import 'server-only';
import { and, asc, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { attempt, goalPlan, goalTask, studyNote, type AttemptSettings, type GoalCoach, type GoalCoachReview, type GoalPlanNotice, type GoalSubject, type StudyNote } from '@/db/schema';
import {
  addDays, buildPlanTasks, daysBetween, finishDate, pack, planHealth, recover, sprintTheme, weekday, weeklyMinutes,
  type DraftTask, type GoalTaskKind, type PlanHealth, type PlannerSubject, type RecoveryOption,
} from '@/lib/goal-plan';
import { dayKey } from '@/lib/streak';
import type { SessionUser } from '@/lib/auth';
import { aiEnabled, consumeAiQuota, jsonCompletion } from './ai/client';
import { countDue, getReadiness } from './analytics';
import { billingEnabled, getPlan } from './billing';
import { invalidateCatalog } from './cache';
import { AppError, notFound } from './errors';
import { getExam, getStudyNotes } from './exams';
import { ensureEnrollment, getOrCreateProfile } from './profile';

// The goal planner (everyone; Pro lifts the size limits). Plans live in goal_plan with one row per task in
// goal_task; src/lib/goal-plan.ts does the arithmetic. Nothing here moves a
// learner's dates without asking, except two things they agreed to: a sprint
// check re-balances the remaining practice, and a vacation ends on its date.

type PlanRow = typeof goalPlan.$inferSelect;
type TaskRow = typeof goalTask.$inferSelect;

export interface PlanSetup {
  name: string;
  subjects: GoalSubject[];
  availability: number[];
  startDate: string;
  targetDate: string;
}

const AUTO_PAUSE_DAYS = 3;

// ---------------------------------------------------------------- limits

export interface PlannerLimits { pro: boolean; maxSubjects: number; maxDays: number }

/** Free plans cover up to 2 subjects over 4 weeks; Pro up to 8 over a year. While billing is off everyone has Pro. */
export async function plannerLimits(userId: string): Promise<PlannerLimits> {
  const pro = !billingEnabled() || (await getPlan(userId)) === 'pro';
  return pro ? { pro, maxSubjects: 8, maxDays: 366 } : { pro, maxSubjects: 2, maxDays: 28 };
}

async function assertWithinLimits(userId: string, setup: Pick<PlanSetup, 'subjects' | 'startDate' | 'targetDate'>) {
  const limits = await plannerLimits(userId);
  if (setup.subjects.length > limits.maxSubjects) {
    throw new AppError(`Free plans cover up to ${limits.maxSubjects} subjects. Upgrade to Pro to plan up to 8 together.`, 402, 'UPGRADE');
  }
  if (daysBetween(setup.startDate, setup.targetDate) > limits.maxDays) {
    throw new AppError(`Free plans run for up to ${limits.maxDays / 7} weeks. Pick an earlier target date, or upgrade to Pro for plans up to a year.`, 402, 'UPGRADE');
  }
}

// ---------------------------------------------------------------- inputs

async function today(userId: string) {
  const profile = await getOrCreateProfile(userId);
  return { today: dayKey(new Date(), profile.timezone), timezone: profile.timezone };
}

async function loadSubjects(userId: string, subjects: GoalSubject[]): Promise<PlannerSubject[]> {
  const canGenerate = aiEnabled();
  return Promise.all(subjects.map(async (s) => {
    const ex = await getExam(s.examId);
    if (!ex?.isPublished) throw notFound('That exam');
    const [readiness, notes] = await Promise.all([getReadiness(userId, ex.id), getStudyNotes(ex.id)]);
    const cfg = ex.config;
    const interview = ex.category === 'interview';
    return {
      examId: ex.id,
      code: ex.code,
      interview,
      familiarity: s.familiarity,
      targetLevel: interview ? s.targetLevel ?? 2 : null,
      skills: cfg.skills.map((k) => {
        const m = readiness?.skills.find((r) => r.skillId === k.id);
        return { skillId: k.id, name: k.name, domain: k.domain, weight: k.weight, answered: m?.answered ?? 0, mastery: m?.mastery ?? 0.5 };
      }),
      secondsPerItem: (cfg.timeLimitMinutes * 60) / cfg.itemCount,
      quick: cfg.modes.quick ? { minutes: cfg.modes.quick.minutes } : null,
      full: cfg.modes.full ? { minutes: cfg.modes.full.minutes } : null,
      readable: cfg.skills.filter((k) => notes[k.id] || canGenerate).map((k) => k.id),
    } satisfies PlannerSubject;
  }));
}

function skillNames(subjects: PlannerSubject[]) {
  const names = new Map<string, string>();
  for (const s of subjects) for (const k of s.skills) names.set(`${s.examId}:${k.skillId}`, k.name);
  return names;
}

function validateDates(setup: Pick<PlanSetup, 'startDate' | 'targetDate'>, todayKey: string) {
  if (setup.startDate < addDays(todayKey, -1)) throw new AppError('The start date has already passed.', 400, 'INVALID');
  if (daysBetween(setup.startDate, setup.targetDate) > 366) throw new AppError('Plans can run for up to a year. Pick an earlier target date.', 400, 'INVALID');
}

// ---------------------------------------------------------------- preview & create

export interface PlanPreview {
  finish: string | null;
  fits: boolean;
  totalMinutes: number;
  taskCount: number;
  /** when it doesn't fit: weekly minutes that would make it fit (null if even triple won't) */
  neededWeekly: number | null;
  sprints: { index: number; from: string; to: string; theme: string; minutes: number }[];
}

export async function previewPlan(userId: string, setup: PlanSetup): Promise<PlanPreview> {
  await assertWithinLimits(userId, setup);
  const { today: todayKey } = await today(userId);
  validateDates(setup, todayKey);
  const subjects = await loadSubjects(userId, setup.subjects);
  const tasks = buildPlanTasks({ subjects, availability: setup.availability, from: setup.startDate, targetDate: setup.targetDate });
  const finish = finishDate(tasks);
  const fits = !finish || finish <= setup.targetDate;

  let neededWeekly: number | null = null;
  if (!fits) {
    // Scale every study day up evenly until the same work fits.
    for (let f = 1.1; f <= 3.0001; f += 0.1) {
      const scaled = setup.availability.map((m) => Math.round(m * f));
      const end = finishDate(pack(tasks, scaled, setup.startDate));
      if (end && end <= setup.targetDate) { neededWeekly = weeklyMinutes(scaled); break; }
    }
  }

  const names = skillNames(subjects);
  const sprints: PlanPreview['sprints'] = [];
  for (const t of tasks) {
    const index = Math.floor(daysBetween(setup.startDate, t.day) / 7);
    const sprint = (sprints[index] ??= { index: index + 1, from: addDays(setup.startDate, index * 7), to: addDays(setup.startDate, index * 7 + 6), theme: '', minutes: 0 });
    sprint.minutes += t.minutes;
  }
  for (const sprint of sprints) {
    if (!sprint) continue;
    sprint.theme = sprintTheme(tasks.filter((t) => t.day >= sprint.from && t.day <= sprint.to)
      .map((t) => ({ skillName: t.skillId ? names.get(`${t.examId}:${t.skillId}`) ?? null : null, minutes: t.minutes })));
  }

  return {
    finish,
    fits,
    totalMinutes: tasks.reduce((a, t) => a + t.minutes, 0),
    taskCount: tasks.length,
    neededWeekly,
    sprints: sprints.filter(Boolean),
  };
}

async function insertTasks(planId: string, tasks: (DraftTask & { day: string; position: number })[]) {
  for (let i = 0; i < tasks.length; i += 400) {
    await db.insert(goalTask).values(tasks.slice(i, i + 400).map((t) => ({
      planId, day: t.day, position: t.position, kind: t.kind, examId: t.examId, skillId: t.skillId, count: t.count,
      role: t.role, minutes: t.minutes, label: t.label, detail: t.detail, priority: t.priority,
    })));
  }
}

export async function createPlan(userId: string, setup: PlanSetup) {
  await assertWithinLimits(userId, setup);
  if (await getCurrentPlan(userId)) throw new AppError('You already have a plan. Finish or drop it before starting another.', 409, 'PLAN_EXISTS');
  const { today: todayKey } = await today(userId);
  validateDates(setup, todayKey);
  const subjects = await loadSubjects(userId, setup.subjects);
  const tasks = buildPlanTasks({ subjects, availability: setup.availability, from: setup.startDate, targetDate: setup.targetDate });
  if (!tasks.length) throw new AppError('Nothing to plan with those settings.', 400, 'INVALID');

  const [plan] = await db.insert(goalPlan).values({
    userId, name: setup.name, subjects: setup.subjects, availability: setup.availability, startDate: setup.startDate, targetDate: setup.targetDate,
  }).returning({ id: goalPlan.id });
  try {
    await insertTasks(plan.id, tasks);
  } catch (err) {
    await db.delete(goalPlan).where(eq(goalPlan.id, plan.id));
    throw err;
  }
  // The subjects show up under "Your exams" too.
  await Promise.all(setup.subjects.map((s) => ensureEnrollment(userId, s.examId)));
  return { id: plan.id };
}

// ---------------------------------------------------------------- reading the plan

export async function getCurrentPlan(userId: string): Promise<PlanRow | null> {
  const [row] = await db.select().from(goalPlan)
    .where(and(eq(goalPlan.userId, userId), inArray(goalPlan.status, ['active', 'paused'])))
    .orderBy(desc(goalPlan.createdAt)).limit(1);
  return row ?? null;
}

async function ownedPlan(userId: string, planId: string) {
  const [row] = await db.select().from(goalPlan).where(and(eq(goalPlan.id, planId), eq(goalPlan.userId, userId))).limit(1);
  if (!row) throw notFound('That plan');
  return row;
}

const loadTasks = (planId: string) => db.select().from(goalTask).where(eq(goalTask.planId, planId)).orderBy(asc(goalTask.day), asc(goalTask.position));
const isOpen = (t: TaskRow) => t.status === 'pending';

export interface GoalTaskView {
  id: string;
  day: string;
  kind: GoalTaskKind;
  examId: string;
  examCode: string;
  skillName: string | null;
  skillId: string | null;
  count: number | null;
  role: number | null;
  minutes: number;
  label: string;
  detail: string;
  status: TaskRow['status'];
  carried: boolean;
}

export interface PlanView {
  id: string;
  name: string;
  status: PlanRow['status'];
  autoPaused: boolean;
  pausedUntil: string | null;
  startDate: string;
  targetDate: string;
  today: string;
  availability: number[];
  subjects: { examId: string; code: string; title: string; targetLevel: number | null }[];
  progress: { doneTasks: number; totalTasks: number; doneMinutes: number; totalMinutes: number; percent: number };
  health: PlanHealth;
  missed: { tasks: number; minutes: number };
  projectedFinish: string | null;
  todayTasks: GoalTaskView[];
  /** the next study day's tasks, for working ahead */
  nextDay: { day: string; tasks: GoalTaskView[] } | null;
  missedTasks: GoalTaskView[];
  sprints: { index: number; from: string; to: string; theme: string; minutes: number; doneMinutes: number; days: { day: string; tasks: GoalTaskView[] }[] }[];
  notice: GoalPlanNotice | null;
  coach: GoalCoach | null;
  /** spaced-review cards due now, per exam (a review with nothing due can be ticked off) */
  due: Record<string, number>;
}

/** The learner's current plan, brought up to date (finished attempts ticked, vacations ended, long silences paused). */
export async function getPlanView(userId: string): Promise<PlanView | null> {
  let plan = await getCurrentPlan(userId);
  if (!plan) return null;
  const { today: todayKey, timezone } = await today(userId);

  if (plan.status === 'paused' && plan.pausedUntil && todayKey >= plan.pausedUntil) {
    await resumePlan(userId, plan.id);
    plan = (await getCurrentPlan(userId))!;
  }

  let tasks = await loadTasks(plan.id);
  if (plan.status === 'active' && (await matchFinishedAttempts(userId, tasks, todayKey, timezone))) tasks = await loadTasks(plan.id);

  const missed = tasks.filter((t) => isOpen(t) && t.day < todayKey);
  if (plan.status === 'active' && missed.length) {
    const lastDone = tasks.filter((t) => t.doneAt).map((t) => dayKey(t.doneAt!, timezone)).sort().pop() ?? plan.startDate;
    if (daysBetween(lastDone, todayKey) >= AUTO_PAUSE_DAYS && daysBetween(plan.startDate, todayKey) >= AUTO_PAUSE_DAYS) {
      await db.update(goalPlan).set({ status: 'paused', pausedAt: new Date(), autoPaused: true, pausedUntil: null }).where(eq(goalPlan.id, plan.id));
      plan = { ...plan, status: 'paused', autoPaused: true, pausedUntil: null };
    }
  }
  if (plan.status === 'active' && !tasks.some(isOpen)) {
    await db.update(goalPlan).set({ status: 'completed' }).where(eq(goalPlan.id, plan.id));
    plan = { ...plan, status: 'completed' };
  }

  const exams = await Promise.all(plan.subjects.map((s) => getExam(s.examId)));
  const codes = new Map(exams.filter(Boolean).map((e) => [e!.id, e!.code]));
  const names = new Map<string, string>();
  for (const e of exams) if (e) for (const k of e.config.skills) names.set(`${e.id}:${k.id}`, k.name);
  const view = (t: TaskRow): GoalTaskView => ({
    id: t.id, day: t.day, kind: t.kind, examId: t.examId, examCode: codes.get(t.examId) ?? t.examId,
    skillId: t.skillId, skillName: t.skillId ? names.get(`${t.examId}:${t.skillId}`) ?? null : null,
    count: t.count, role: t.role, minutes: t.minutes, label: t.label, detail: t.detail, status: t.status, carried: t.carried,
  });

  const live = tasks.filter((t) => t.status !== 'skipped');
  const done = live.filter((t) => t.status === 'done');
  const totalMinutes = live.reduce((a, t) => a + t.minutes, 0);
  const doneMinutes = done.reduce((a, t) => a + t.minutes, 0);
  const pending = tasks.filter(isOpen);
  const projectedFinish = pending.length ? finishDate(pack(pending, plan.availability, todayKey)) : null;
  const studyDays = plan.availability.filter((m) => m > 0);
  const todays = live.filter((t) => t.day === todayKey);
  const health = planHealth({
    missedMinutes: missed.reduce((a, t) => a + t.minutes, 0),
    studyDayMinutes: studyDays.reduce((a, m) => a + m, 0) / Math.max(1, studyDays.length),
    projectedFinish,
    targetDate: plan.targetDate,
    todayMinutes: todays.reduce((a, t) => a + t.minutes, 0),
    todayCapacity: plan.availability[weekday(todayKey)] ?? 0,
  });

  const sprints: PlanView['sprints'] = [];
  for (const t of live) {
    const index = Math.max(0, Math.floor(daysBetween(plan.startDate, t.day) / 7));
    const sprint = (sprints[index] ??= {
      index: index + 1, from: addDays(plan.startDate, index * 7), to: addDays(plan.startDate, index * 7 + 6), theme: '', minutes: 0, doneMinutes: 0, days: [],
    });
    sprint.minutes += t.minutes;
    if (t.status === 'done') sprint.doneMinutes += t.minutes;
    const last = sprint.days[sprint.days.length - 1];
    if (last?.day === t.day) last.tasks.push(view(t));
    else sprint.days.push({ day: t.day, tasks: [view(t)] });
  }
  for (const s of sprints) if (s) s.theme = sprintTheme(s.days.flatMap((d) => d.tasks).map((t) => ({ skillName: t.skillName, minutes: t.minutes })));

  const nextDayKey = pending.find((t) => t.day > todayKey)?.day ?? null;
  const dueCounts = await Promise.all(plan.subjects.map((s) => countDue(userId, s.examId)));

  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    autoPaused: plan.autoPaused,
    pausedUntil: plan.pausedUntil,
    startDate: plan.startDate,
    targetDate: plan.targetDate,
    today: todayKey,
    availability: plan.availability,
    subjects: plan.subjects.map((s, i) => ({ examId: s.examId, code: exams[i]?.code ?? s.examId, title: exams[i]?.title ?? s.examId, targetLevel: s.targetLevel })),
    progress: { doneTasks: done.length, totalTasks: live.length, doneMinutes, totalMinutes, percent: totalMinutes ? Math.round((doneMinutes / totalMinutes) * 100) : 0 },
    health,
    missed: { tasks: missed.length, minutes: missed.reduce((a, t) => a + t.minutes, 0) },
    projectedFinish,
    todayTasks: todays.map(view),
    nextDay: nextDayKey ? { day: nextDayKey, tasks: pending.filter((t) => t.day === nextDayKey).map(view) } : null,
    missedTasks: missed.map(view),
    sprints: sprints.filter(Boolean),
    notice: plan.notice,
    coach: plan.coach,
    due: Object.fromEntries(plan.subjects.map((s, i) => [s.examId, dueCounts[i]])),
  };
}

/**
 * Practice done outside the plan still counts on the day it was planned for:
 * today's open tasks are ticked off by matching attempts finished today.
 */
async function matchFinishedAttempts(userId: string, tasks: TaskRow[], todayKey: string, timezone: string) {
  const open = tasks.filter((t) => isOpen(t) && t.day === todayKey && t.kind !== 'reading');
  if (!open.length) return false;
  const rows = await db.select({ id: attempt.id, examId: attempt.examId, kind: attempt.kind, settings: attempt.settings, finishedAt: attempt.finishedAt })
    .from(attempt)
    .where(and(
      eq(attempt.userId, userId), eq(attempt.status, 'submitted'), gte(attempt.finishedAt, new Date(Date.now() - 36 * 3_600_000)),
      inArray(attempt.examId, [...new Set(open.map((t) => t.examId))]),
    ));
  const used = new Set(tasks.map((t) => t.attemptId).filter(Boolean));
  const fits = (t: TaskRow, kind: string, s: AttemptSettings) => {
    switch (t.kind) {
      case 'drill': return kind === 'practice' && (s.skills ?? []).includes(t.skillId ?? '');
      case 'mixed': return kind === 'practice' && !(s.skills?.length);
      case 'review': return kind === 'review' || kind === 'mistakes';
      case 'mini_mock': return kind === 'quick' || (kind === 'practice' && Boolean(s.timed));
      case 'full_mock': return kind === 'full';
      default: return false;
    }
  };
  let changed = false;
  for (const t of open) {
    const a = rows.find((r) => !used.has(r.id) && !r.settings.planTaskId && r.examId === t.examId && r.finishedAt
      && dayKey(r.finishedAt, timezone) === todayKey && fits(t, r.kind, r.settings));
    if (!a) continue;
    used.add(a.id);
    await db.update(goalTask).set({ status: 'done', doneAt: a.finishedAt, attemptId: a.id }).where(and(eq(goalTask.id, t.id), eq(goalTask.status, 'pending')));
    changed = true;
  }
  return changed;
}

// ---------------------------------------------------------------- finishing tasks

async function ownedTask(userId: string, taskId: string) {
  const [row] = await db.select({ task: goalTask, plan: goalPlan }).from(goalTask)
    .innerJoin(goalPlan, eq(goalPlan.id, goalTask.planId))
    .where(and(eq(goalTask.id, taskId), eq(goalPlan.userId, userId))).limit(1);
  return row ?? null;
}

/** Called when an attempt started from a plan task is submitted. */
export async function onPlanAttemptFinished(a: { id: string; userId: string; examId: string; settings: AttemptSettings }) {
  const found = a.settings.planTaskId ? await ownedTask(a.userId, a.settings.planTaskId) : null;
  if (!found || found.task.status !== 'pending' || found.task.examId !== a.examId) return;
  await db.update(goalTask).set({ status: 'done', doneAt: new Date(), attemptId: a.id }).where(and(eq(goalTask.id, found.task.id), eq(goalTask.status, 'pending')));
  if (found.task.kind === 'mini_mock' && found.plan.status === 'active') {
    await rebalance(found.plan);
    // The coach writes its review when the learner next opens the plan, so submitting stays fast.
    const { today: todayKey } = await today(a.userId);
    const coach: GoalCoach = { sprint: Math.floor(daysBetween(found.plan.startDate, todayKey) / 7) + 1, day: todayKey, attemptId: a.id, status: 'pending' };
    await db.update(goalPlan).set({ coach }).where(eq(goalPlan.id, found.plan.id));
  }
}

/** Reading is ticked off by hand, and so is a review when nothing is due. */
export async function completeTask(userId: string, taskId: string) {
  const found = await ownedTask(userId, taskId);
  if (!found) throw notFound('That task');
  const { task } = found;
  if (task.kind !== 'reading' && task.kind !== 'review') throw new AppError('This task is ticked off when you finish it.', 400);
  if (task.kind === 'review') {
    const due = await countDue(userId, task.examId);
    if (due > 0) throw new AppError(`You have ${due} question${due === 1 ? '' : 's'} due. Start the review to clear them.`, 400);
  }
  if (task.status === 'pending') await db.update(goalTask).set({ status: 'done', doneAt: new Date() }).where(eq(goalTask.id, task.id));
  return { ok: true };
}

// ---------------------------------------------------------------- adapting

/** Writes a new day/position for many tasks in one statement. */
async function relayout(rows: { id: string; day: string; position: number; carried: boolean }[]) {
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    await db.execute(sql`
      update ${goalTask} as t
      set day = v.day::date, position = v.position::int, carried = t.carried or v.carried::boolean
      from (values ${sql.join(chunk.map((r) => sql`(${r.id}, ${r.day}, ${r.position}, ${r.carried})`), sql`, `)}) as v(id, day, position, carried)
      where t.id = v.id`);
  }
}

/**
 * After a sprint check: everything not yet done (except today's list) is
 * rebuilt from fresh mastery. Strong topics lose drills, weak ones gain them;
 * the target date is unchanged, so if it no longer fits, the plan says so.
 */
async function rebalance(plan: PlanRow) {
  const { today: todayKey } = await today(plan.userId);
  const from = addDays(todayKey, 1);
  if (from > plan.targetDate) return;
  const tasks = await loadTasks(plan.id);
  const read = new Set(tasks.filter((t) => t.kind === 'reading' && (t.status === 'done' || t.day === todayKey)).map((t) => `${t.examId}:${t.skillId}`));
  const subjects = await loadSubjects(plan.userId, plan.subjects);
  const fresh = buildPlanTasks({ subjects, availability: plan.availability, from, targetDate: plan.targetDate, skipReading: read });
  await db.delete(goalTask).where(and(eq(goalTask.planId, plan.id), eq(goalTask.status, 'pending'), ne(goalTask.day, todayKey)));
  await insertTasks(plan.id, fresh);
  await db.update(goalPlan).set({
    notice: { kind: 'rebalanced', day: todayKey, message: 'Your sprint check re-balanced the plan: less time on what you have mastered, more on your weakest topics.' },
  }).where(eq(goalPlan.id, plan.id));
}

const openInOrder = (tasks: TaskRow[]) => tasks.filter(isOpen);

export interface RecoveryPreview {
  option: RecoveryOption;
  feasible: boolean;
  finish: string | null;
  extraMinutesPerDay: number;
  dropped: { count: number; minutes: number; labels: string[] };
}

export async function getRecoveryOptions(userId: string, planId: string): Promise<RecoveryPreview[]> {
  const plan = await ownedPlan(userId, planId);
  const { today: todayKey } = await today(userId);
  const pending = openInOrder(await loadTasks(plan.id));
  return (['push', 'catch_up', 'trim'] as const).map((option) => {
    const r = recover(option, pending, plan.availability, todayKey, plan.targetDate);
    return {
      option, feasible: r.feasible, finish: r.finish, extraMinutesPerDay: r.extraMinutesPerDay,
      dropped: { count: r.dropped.length, minutes: r.dropped.reduce((a, t) => a + t.minutes, 0), labels: r.dropped.slice(0, 6).map((t) => t.label) },
    };
  });
}

export async function applyRecovery(userId: string, planId: string, option: RecoveryOption) {
  const plan = await ownedPlan(userId, planId);
  if (plan.status !== 'active') throw new AppError('Resume the plan first.', 400);
  const { today: todayKey } = await today(userId);
  const pending = openInOrder(await loadTasks(plan.id));
  const r = recover(option, pending, plan.availability, todayKey, plan.targetDate);
  if (!r.feasible) throw new AppError('That option cannot fit the work before your target date. Try another.', 400);
  const wasOn = new Map(pending.map((t) => [t.id, t.day]));
  // "Carried" marks work that was missed and has moved to a new day.
  await relayout(r.tasks.map((t) => ({ id: t.id, day: t.day, position: t.position, carried: (wasOn.get(t.id) ?? t.day) < todayKey })));
  if (r.dropped.length) await db.update(goalTask).set({ status: 'skipped' }).where(inArray(goalTask.id, r.dropped.map((t) => t.id)));
  const targetDate = option === 'push' && r.finish && r.finish > plan.targetDate ? r.finish : plan.targetDate;
  const message = option === 'push'
    ? `Your missed work is back on the schedule. The plan now finishes on ${targetDate}.`
    : option === 'catch_up'
      ? `Catch-up mode: about ${r.extraMinutesPerDay} extra minutes a study day until you're back on track.`
      : `Trimmed ${r.dropped.length} lower-value practice task${r.dropped.length === 1 ? '' : 's'} to keep your date.`;
  await db.update(goalPlan).set({ targetDate, notice: { kind: 'recovered', day: todayKey, message } }).where(eq(goalPlan.id, plan.id));
  return { ok: true };
}

export async function pausePlan(userId: string, planId: string, until: string | null) {
  const plan = await ownedPlan(userId, planId);
  if (plan.status !== 'active') throw new AppError('Only an active plan can be paused.', 400);
  const { today: todayKey } = await today(userId);
  if (until && until <= todayKey) throw new AppError('Pick a return date after today.', 400);
  await db.update(goalPlan).set({ status: 'paused', pausedAt: new Date(), pausedUntil: until, autoPaused: false }).where(eq(goalPlan.id, plan.id));
  return { ok: true };
}

/** Picks the plan up from today: unfinished work keeps its order, and the finish date moves only if it has to. */
export async function resumePlan(userId: string, planId: string) {
  const plan = await ownedPlan(userId, planId);
  if (plan.status !== 'paused') return { ok: true };
  const { today: todayKey } = await today(userId);
  const pending = openInOrder(await loadTasks(plan.id));
  const placed = pack(pending, plan.availability, todayKey);
  await relayout(placed.map((t) => ({ id: t.id, day: t.day, position: t.position, carried: false })));
  const finish = finishDate(placed);
  const targetDate = finish && finish > plan.targetDate ? finish : plan.targetDate;
  await db.update(goalPlan).set({
    status: 'active', pausedAt: null, pausedUntil: null, autoPaused: false, targetDate,
    notice: { kind: 'resumed', day: todayKey, message: targetDate !== plan.targetDate ? `Welcome back. Your plan picks up today and now finishes on ${targetDate}.` : 'Welcome back. Your plan picks up today and still finishes on time.' },
  }).where(eq(goalPlan.id, plan.id));
  return { ok: true };
}

export async function dropPlan(userId: string, planId: string) {
  await ownedPlan(userId, planId);
  await db.update(goalPlan).set({ status: 'dropped' }).where(eq(goalPlan.id, planId));
  return { ok: true };
}

export async function dismissNotice(userId: string, planId: string) {
  await ownedPlan(userId, planId);
  await db.update(goalPlan).set({ notice: null }).where(eq(goalPlan.id, planId));
  return { ok: true };
}

// ---------------------------------------------------------------- reading tasks

export async function getReadingTask(userId: string, taskId: string) {
  const found = await ownedTask(userId, taskId);
  if (!found || found.task.kind !== 'reading' || !found.task.skillId) return null;
  const ex = await getExam(found.task.examId);
  const skill = ex?.config.skills.find((k) => k.id === found.task.skillId);
  if (!ex || !skill) return null;
  const notes = await getStudyNotes(ex.id);
  return { task: found.task, exam: ex, skill, note: (notes[skill.id] as StudyNote | undefined) ?? null };
}

const noteShape = z.object({
  summary: z.string().min(1).max(1200),
  points: z.array(z.string().min(1).max(900)).min(3).max(10),
  traps: z.array(z.string().min(1).max(700)).max(6),
});

/**
 * Notes for a reading task's skill, written by AI the first time anyone needs
 * them and stored for everyone (marked as AI-generated until an admin edits
 * them). No links: a model can invent URLs.
 */
export async function ensureReadingNote(user: SessionUser, taskId: string): Promise<StudyNote> {
  const found = await getReadingTask(user.id, taskId);
  if (!found) throw notFound('That reading task');
  if (found.note) return found.note;
  await consumeAiQuota(user.id, user.role ?? 'learner');
  const { exam: ex, skill } = found;
  const domain = ex.config.domains.find((d) => d.id === skill.domain);
  const audience = ex.category === 'interview'
    ? `engineers preparing for technical interviews${found.task.role ? ` at level L${found.task.role} (1 fresher … 5 staff)` : ''}`
    : `candidates preparing for the ${ex.code} certification exam`;
  const note = await jsonCompletion({
    name: 'study_note',
    maxTokens: 2500,
    messages: [
      {
        role: 'system',
        content: 'You write short, accurate study notes. Plain sentences; Markdown inline code is allowed. Leave out anything you are not sure is correct. Never include links or URLs.',
      },
      {
        role: 'user',
        content: `Subject: ${ex.title} (${ex.code}).\nTopic: ${skill.name}${domain ? ` (part of "${domain.name}")` : ''}.\nAudience: ${audience}.\n\nWrite: a two-sentence summary of what the topic covers and why it matters; 5 to 8 key points, each one to three sentences, in the order someone should learn them; and 2 to 4 common traps or misconceptions.`,
      },
    ],
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'points', 'traps'],
      properties: {
        summary: { type: 'string' },
        points: { type: 'array', items: { type: 'string' } },
        traps: { type: 'array', items: { type: 'string' } },
      },
    },
    parse: noteShape,
  });
  const content: StudyNote = { ...note, source: 'ai' };
  await db.insert(studyNote).values({ examId: ex.id, skillId: skill.id, content }).onConflictDoNothing();
  invalidateCatalog(`catalog:notes:${ex.id}`);
  return (await getStudyNotes(ex.id))[skill.id] ?? content;
}

// ---------------------------------------------------------------- AI coach

const reviewShape = z.object({
  headline: z.string().min(1).max(160),
  wentWell: z.array(z.string().min(1).max(300)).max(3),
  focus: z.array(z.string().min(1).max(300)).min(1).max(3),
  tip: z.string().min(1).max(300),
});

/**
 * The coach's review of the sprint a mini mock just closed: what went well,
 * what to focus on next. Written once (AI, counted against the daily
 * allowance); if AI is off or the allowance is spent, the review is skipped
 * rather than retried on every visit.
 */
export async function writeCoachReview(user: SessionUser, planId: string): Promise<GoalCoach | null> {
  const plan = await ownedPlan(user.id, planId);
  const coach = plan.coach;
  if (!coach || coach.status !== 'pending') return coach;
  const settle = async (next: GoalCoach) => {
    await db.update(goalPlan).set({ coach: next }).where(and(eq(goalPlan.id, plan.id), sql`${goalPlan.coach}->>'attemptId' = ${coach.attemptId}`));
    return next;
  };
  if (!aiEnabled()) return settle({ ...coach, status: 'failed' });

  try {
    const [mock] = await db.select({ examId: attempt.examId, summary: attempt.summary }).from(attempt).where(eq(attempt.id, coach.attemptId)).limit(1);
    const ex = mock ? await getExam(mock.examId) : null;
    const tasks = await loadTasks(plan.id);
    const from = addDays(coach.day, -6);
    const week = tasks.filter((t) => t.day >= from && t.day <= coach.day && t.status !== 'skipped');
    const done = week.filter((t) => t.status === 'done');
    const upcoming = tasks.filter((t) => isOpen(t) && t.day > coach.day).slice(0, 25);
    const readiness = ex ? await getReadiness(user.id, ex.id) : null;
    const practised = (readiness?.skills ?? []).filter((k) => k.answered > 0).sort((a, b) => a.mastery - b.mastery);
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    const facts = [
      `Plan: "${plan.name}", target date ${plan.targetDate}, sprint ${coach.sprint}.`,
      `This sprint: ${done.length} of ${week.length} planned tasks done (${done.reduce((a, t) => a + t.minutes, 0)} of ${week.reduce((a, t) => a + t.minutes, 0)} minutes).`,
      mock?.summary && ex ? `Sprint check (${ex.code} mini mock): ${mock.summary.correctCount}/${mock.summary.itemCount} correct. By skill: ${mock.summary.bySkill.filter((k) => k.total > 0).map((k) => `${k.name} ${k.correct}/${k.total}`).join('; ')}.` : '',
      practised.length ? `Weakest practised skills: ${practised.slice(0, 3).map((k) => `${k.name} (${pct(k.mastery)})`).join(', ')}.` : '',
      practised.length > 3 ? `Strongest: ${practised.slice(-3).reverse().map((k) => `${k.name} (${pct(k.mastery)})`).join(', ')}.` : '',
      upcoming.length ? `Next up in the plan: ${[...new Set(upcoming.map((t) => t.label))].slice(0, 8).join('; ')}.` : '',
    ].filter(Boolean).join('\n');

    await consumeAiQuota(user.id, user.role ?? 'learner');
    const review: GoalCoachReview = await jsonCompletion({
      name: 'sprint_review',
      maxTokens: 900,
      messages: [
        {
          role: 'system',
          content: 'You are a calm, specific study coach. Use only the facts given; never invent scores or topics. Be brief and encouraging without hype. Address the learner as "you". No emoji.',
        },
        {
          role: 'user',
          content: `${facts}

Write a short review of this sprint: a one-line headline; up to 3 things that went well (skip if nothing did); 1 to 3 things to focus on next sprint, naming skills; and one practical tip for the coming week.`,
        },
      ],
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['headline', 'wentWell', 'focus', 'tip'],
        properties: {
          headline: { type: 'string' },
          wentWell: { type: 'array', items: { type: 'string' } },
          focus: { type: 'array', items: { type: 'string' } },
          tip: { type: 'string' },
        },
      },
      parse: reviewShape,
    });
    return settle({ ...coach, status: 'ready', review });
  } catch (err) {
    console.error('[planner coach]', err);
    return settle({ ...coach, status: 'failed' });
  }
}

// ---------------------------------------------------------------- exam pages

export type ExamPlanStatus =
  | { kind: 'none' }
  | { kind: 'in_plan'; plan: PlanView }
  | { kind: 'other_plan'; planName: string };

/** How an exam page should talk about planning: no plan yet, part of the learner's plan, or blocked by another plan. */
export async function getExamPlanStatus(userId: string, examId: string): Promise<ExamPlanStatus> {
  const current = await getCurrentPlan(userId);
  if (!current) return { kind: 'none' };
  if (!current.subjects.some((s) => s.examId === examId)) return { kind: 'other_plan', planName: current.name };
  const plan = await getPlanView(userId);
  return plan ? { kind: 'in_plan', plan } : { kind: 'none' };
}
