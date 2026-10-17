// Goal planner (pure; the server feeds it readiness and stores the result).
//
// A goal is a set of subjects (certifications and/or interview subjects),
// a target date and the minutes a learner can give each weekday. From that
// we derive the work: every skill gets enough drill questions to lift it to
// mastery (more for heavier blueprint weights and higher target levels), a
// reading task before drilling a skill that's still weak, a spaced review of
// missed questions every couple of days, a mini mock closing each week of
// work, and full mocks at the end. Spare time before the target is filled
// with mixed practice. The work is then packed, in order, into the days the
// learner said they're free.
//
// The same packing prices the recovery options when someone falls behind,
// so a preview and the plan it produces always agree.

import type { RoleLevel } from '@/lib/engine/types';

export type GoalTaskKind = 'reading' | 'drill' | 'review' | 'mixed' | 'mini_mock' | 'full_mock';
export type Familiarity = 'new' | 'basic' | 'intermediate' | 'strong';
export type PlanHealth = 'on_track' | 'slightly_behind' | 'needs_attention' | 'overloaded';
export type RecoveryOption = 'push' | 'catch_up' | 'trim';

export const FAMILIARITY: { key: Familiarity; label: string; body: string; prior: number }[] = [
  { key: 'new', label: 'New to it', body: 'Starting from scratch', prior: 0.3 },
  { key: 'basic', label: 'The basics', body: 'Know the fundamentals', prior: 0.5 },
  { key: 'intermediate', label: 'Comfortable', body: 'Used it in real work', prior: 0.65 },
  { key: 'strong', label: 'Strong', body: 'Just needs polish', prior: 0.8 },
];

/** Weekdays in the order people read a week; values index a Sunday-first availability array. */
export const WEEKDAYS = [
  { dow: 1, short: 'Mon' }, { dow: 2, short: 'Tue' }, { dow: 3, short: 'Wed' }, { dow: 4, short: 'Thu' },
  { dow: 5, short: 'Fri' }, { dow: 6, short: 'Sat' }, { dow: 0, short: 'Sun' },
];

export interface PlannerSkill { skillId: string; name: string; domain: number; weight: number; answered: number; mastery: number }

export interface PlannerSubject {
  examId: string;
  code: string;
  interview: boolean;
  familiarity: Familiarity;
  /** interview subjects: questions are drawn up to this level */
  targetLevel: RoleLevel | null;
  /** in syllabus order */
  skills: PlannerSkill[];
  secondsPerItem: number;
  quick: { minutes: number } | null;
  full: { minutes: number } | null;
  /** skills with study notes (stored, or generated on demand) */
  readable: string[];
}

export interface DraftTask {
  kind: GoalTaskKind;
  examId: string;
  skillId: string | null;
  /** drills: questions; mini mocks: set for a timed drill when the exam has no quick mock */
  count: number | null;
  role: number | null;
  minutes: number;
  label: string;
  detail: string;
  /** expected gain; the trim option drops the lowest first */
  priority: number;
}

export type Placed<T> = T & { day: string; position: number };

/** Minutes available on each weekday, Sunday first (Date#getUTCDay order). */
export type WeekAvailability = number[];

const TARGET_MASTERY = 0.8;
const DRILL_SIZE = 15;
const BASE_ITEMS = 40;
const READING_MINUTES = 12;
const REVIEW_COUNT = 15;
const REVIEW_MINUTES = 12;
const MIXED_SIZE = 20;
const MAX_DAYS = 3 * 365;

// ---------------------------------------------------------------- dates

export const addDays = (day: string, n: number) => {
  const t = new Date(`${day}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
export const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);
export const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

/** Study minutes available from `from` to `to`, both inclusive. */
export function capacityBetween(availability: WeekAvailability, from: string, to: string) {
  let total = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) total += availability[weekday(d)] ?? 0;
  return total;
}

/** "Tue 3 Nov" (dates are calendar days, so they're read at noon UTC to avoid shifting). */
export const formatDay = (day: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });

export const weeklyMinutes = (availability: WeekAvailability) => availability.reduce((a, m) => a + m, 0);

// ---------------------------------------------------------------- work

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const drillMinutes = (count: number, secondsPerItem: number) => Math.max(5, Math.round((count * secondsPerItem) / 60));
const levelSuffix = (s: PlannerSubject) => (s.targetLevel ? ` up to L${s.targetLevel}` : '');

/** Where a skill stands: the learner's measured mastery, leaning on their self-assessment until there are a few answers. */
export function currentMastery(skill: PlannerSkill, familiarity: Familiarity) {
  const prior = FAMILIARITY.find((f) => f.key === familiarity)?.prior ?? 0.5;
  const seen = Math.min(skill.answered, 5) / 5;
  return prior + (skill.mastery - prior) * seen;
}

/** Reading and drills for one subject, in study order. */
function subjectWork(subject: PlannerSubject, skipReading: Set<string>): DraftTask[] {
  const totalWeight = subject.skills.reduce((a, s) => a + s.weight, 0) || 1;
  const avgWeight = totalWeight / Math.max(1, subject.skills.length);
  const levelFactor = subject.targetLevel ? 0.7 + 0.15 * subject.targetLevel : 1;
  const role = subject.targetLevel;

  const scored = subject.skills.map((skill) => {
    const mastery = currentMastery(skill, subject.familiarity);
    const deficit = Math.max(0, TARGET_MASTERY - mastery);
    return { skill, mastery, deficit, priority: (skill.weight / totalWeight) * (deficit + 0.05) };
  });
  // Someone new to a subject learns it in syllabus order; someone revising goes after the biggest gains.
  const learning = subject.familiarity === 'new' || subject.familiarity === 'basic';
  const ordered = learning ? scored : [...scored].sort((a, b) => b.priority - a.priority);

  const out: DraftTask[] = [];
  for (const { skill, mastery, deficit, priority } of ordered) {
    if (mastery < 0.75 && subject.readable.includes(skill.skillId) && !skipReading.has(`${subject.examId}:${skill.skillId}`)) {
      out.push({
        kind: 'reading', examId: subject.examId, skillId: skill.skillId, count: null, role, minutes: READING_MINUTES,
        label: `Read: ${skill.name}`, detail: `Key points and common traps in ${subject.code} before you practise.`, priority: priority * 1.2,
      });
    }
    const weightFactor = clamp(skill.weight / avgWeight, 0.6, 1.6);
    const items = deficit < 0.03 ? DRILL_SIZE : roundTo5(clamp(deficit / 0.3, 0.35, 1.6) * BASE_ITEMS * levelFactor * weightFactor);
    const chunks: number[] = [];
    for (let left = items; left > 0; left -= DRILL_SIZE) chunks.push(Math.min(DRILL_SIZE, left));
    if (chunks.length > 1 && chunks[chunks.length - 1] < 8) chunks[chunks.length - 2] += chunks.pop()!;
    chunks.forEach((count, i) => {
      out.push({
        kind: 'drill', examId: subject.examId, skillId: skill.skillId, count, role,
        minutes: drillMinutes(count, subject.secondsPerItem),
        label: `Drill ${skill.name}${chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : ''}`,
        detail: `${count} ${subject.code} questions${levelSuffix(subject)}, with the answer after each one.`,
        // Later chunks of a skill matter a little less than the first.
        priority: priority / (1 + i * 0.5),
      });
    });
  }
  return out;
}

/** Interleaves subjects so each moves forward at the same pace (by share of its own work done). */
function interleave(lists: DraftTask[][]): DraftTask[] {
  const totals = lists.map((l) => l.reduce((a, t) => a + t.minutes, 0) || 1);
  const done = lists.map(() => 0);
  const cursor = lists.map(() => 0);
  const out: DraftTask[] = [];
  for (;;) {
    let pick = -1;
    for (let i = 0; i < lists.length; i++) {
      if (cursor[i] >= lists[i].length) continue;
      if (pick < 0 || done[i] / totals[i] < done[pick] / totals[pick]) pick = i;
    }
    if (pick < 0) return out;
    const task = lists[pick][cursor[pick]++];
    done[pick] += task.minutes;
    out.push(task);
  }
}

const reviewTask = (s: PlannerSubject, label = `Review missed questions · ${s.code}`): DraftTask => ({
  kind: 'review', examId: s.examId, skillId: null, count: REVIEW_COUNT, role: null, minutes: REVIEW_MINUTES,
  label, detail: 'Spaced review: questions you got wrong come back just before you forget them.', priority: 0.5,
});

const miniMock = (s: PlannerSubject): DraftTask => ({
  kind: 'mini_mock', examId: s.examId, skillId: null, count: s.quick ? null : MIXED_SIZE, role: s.targetLevel,
  minutes: s.quick?.minutes ?? drillMinutes(MIXED_SIZE, s.secondsPerItem),
  label: `Sprint check · ${s.code} mini mock`,
  detail: 'A short timed mock across the syllabus. Your result re-balances the rest of the plan.', priority: 1,
});

const mixedTask = (s: PlannerSubject): DraftTask => ({
  kind: 'mixed', examId: s.examId, skillId: null, count: MIXED_SIZE, role: s.targetLevel,
  minutes: drillMinutes(MIXED_SIZE, s.secondsPerItem),
  label: `Mixed practice · ${s.code}`, detail: `${MIXED_SIZE} questions across the whole syllabus${levelSuffix(s)}.`, priority: 0,
});

export interface BuildInput {
  subjects: PlannerSubject[];
  availability: WeekAvailability;
  /** first day to schedule */
  from: string;
  targetDate: string;
  /** `${examId}:${skillId}` pairs already read */
  skipReading?: Set<string>;
}

/** The whole plan from `from` onwards, packed into days. */
export function buildPlanTasks(input: BuildInput): Placed<DraftTask>[] {
  const { subjects, availability, from, targetDate } = input;
  if (!subjects.length || weeklyMinutes(availability) <= 0) return [];
  const core = interleave(subjects.map((s) => subjectWork(s, input.skipReading ?? new Set())));

  const endgame: DraftTask[] = [
    ...subjects.filter((s) => s.full).map((s): DraftTask => ({
      kind: 'full_mock', examId: s.examId, skillId: null, count: null, role: s.targetLevel, minutes: s.full!.minutes,
      label: `Full mock · ${s.code}`, detail: 'A dress rehearsal under real timing.', priority: 1,
    })),
    ...subjects.map((s) => reviewTask(s, `Final review · ${s.code}`)),
  ];

  // Spare time before the target goes to mixed practice, weakest subject first: as much as still
  // finishes on time once reviews and mock checks are woven in (found by bisection on the real layout).
  const bySubjectGap = [...subjects].sort((a, b) => avgGap(b) - avgGap(a));
  const layout = (fillerCount: number) => {
    const fillers = Array.from({ length: fillerCount }, (_, i) => mixedTask(bySubjectGap[i % bySubjectGap.length]));
    return pack([...weave(subjects, [...core, ...fillers], availability), ...endgame], availability, from);
  };
  const fitsTarget = (tasks: { day: string }[]) => (finishDate(tasks) ?? from) <= targetDate;
  let best = layout(0);
  if (!fitsTarget(best)) return best;
  let lo = 0;
  let hi = Math.ceil(capacityBetween(availability, from, targetDate) / Math.max(1, mixedTask(bySubjectGap[0]).minutes));
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const tasks = layout(mid);
    if (fitsTarget(tasks)) { lo = mid; best = tasks; } else hi = mid - 1;
  }
  return best;
}

/** Weaves in spaced reviews (every ~2 days of work) and a mini mock closing each week of work. */
function weave(subjects: PlannerSubject[], work: DraftTask[], availability: WeekAvailability): DraftTask[] {
  const daily = weeklyMinutes(availability) / 7;
  const reviewEvery = Math.max(60, daily * 2);
  const mockEvery = Math.max(120, weeklyMinutes(availability));
  const bySubject = new Map(subjects.map((s) => [s.examId, s]));
  const woven: DraftTask[] = [];
  let sinceReview = 0;
  let sinceMock = 0;
  let window = new Map<string, number>();
  let reviewTurn = 0;
  for (const task of work) {
    woven.push(task);
    sinceReview += task.minutes;
    sinceMock += task.minutes;
    window.set(task.examId, (window.get(task.examId) ?? 0) + task.minutes);
    if (sinceReview >= reviewEvery) {
      woven.push(reviewTask(subjects[reviewTurn++ % subjects.length]));
      sinceReview = 0;
    }
    if (sinceMock >= mockEvery) {
      const busiest = [...window.entries()].sort((a, b) => b[1] - a[1])[0][0];
      woven.push(miniMock(bySubject.get(busiest)!));
      sinceMock = 0;
      window = new Map();
    }
  }
  return woven;
}

function avgGap(s: PlannerSubject) {
  return s.skills.reduce((a, k) => a + Math.max(0, TARGET_MASTERY - currentMastery(k, s.familiarity)), 0) / Math.max(1, s.skills.length);
}

/**
 * Lays tasks out in order, filling each day up to its minutes (with 10%
 * slack). A day with time always takes at least one task, so a full mock
 * longer than a short evening still gets a day of its own.
 */
export function pack<T extends { minutes: number }>(tasks: T[], availability: WeekAvailability, from: string, loadFactor = 1): Placed<T>[] {
  if (weeklyMinutes(availability) <= 0) return [];
  const out: Placed<T>[] = [];
  let i = 0;
  for (let day = from, n = 0; i < tasks.length && n < MAX_DAYS; day = addDays(day, 1), n++) {
    const cap = (availability[weekday(day)] ?? 0) * loadFactor;
    if (cap <= 0) continue;
    let used = 0;
    let position = 0;
    while (i < tasks.length && (used === 0 || used + tasks[i].minutes <= cap * 1.1)) {
      out.push({ ...tasks[i], day, position: position++ });
      used += tasks[i].minutes;
      i++;
    }
  }
  return out;
}

export const finishDate = (tasks: { day: string }[]) => tasks.reduce<string | null>((max, t) => (!max || t.day > max ? t.day : max), null);

// ---------------------------------------------------------------- falling behind

export interface RecoveryResult<T> {
  option: RecoveryOption;
  feasible: boolean;
  tasks: Placed<T>[];
  dropped: T[];
  finish: string | null;
  /** catch-up: average extra minutes a study day needs */
  extraMinutesPerDay: number;
}

/**
 * Re-lays the learner's unfinished tasks from today.
 * push      keep every task and the daily load; the finish date moves out
 * catch_up  keep every task and the date; study days get longer (up to double)
 * trim      keep the date and the load; drop the lowest-value practice
 */
export function recover<T extends { minutes: number; priority: number; kind: GoalTaskKind }>(
  option: RecoveryOption, pending: T[], availability: WeekAvailability, today: string, targetDate: string,
): RecoveryResult<T> {
  const base = { option, dropped: [] as T[], extraMinutesPerDay: 0 };
  if (option === 'push') {
    const tasks = pack(pending, availability, today);
    return { ...base, feasible: true, tasks, finish: finishDate(tasks) };
  }
  if (option === 'catch_up') {
    for (let f = 1; f <= 2.0001; f += 0.1) {
      const tasks = pack(pending, availability, today, f);
      const finish = finishDate(tasks);
      if (!finish || finish <= targetDate) {
        const studyDays = availability.filter((m) => m > 0);
        const avg = studyDays.reduce((a, m) => a + m, 0) / Math.max(1, studyDays.length);
        return { ...base, feasible: true, tasks, finish, extraMinutesPerDay: Math.round(avg * (f - 1)) };
      }
    }
    const tasks = pack(pending, availability, today, 2);
    return { ...base, feasible: false, tasks, finish: finishDate(tasks), extraMinutesPerDay: 0 };
  }
  // trim: mocks and reviews stay; practice goes, least valuable first, up to half of it.
  const droppable = pending.filter((t) => t.kind === 'mixed' || t.kind === 'drill' || t.kind === 'reading').sort((a, b) => a.priority - b.priority);
  const limit = Math.floor(droppable.length / 2);
  const dropped = new Set<T>();
  let tasks = pack(pending, availability, today);
  let finish = finishDate(tasks);
  for (let i = 0; i < limit && finish && finish > targetDate; i++) {
    dropped.add(droppable[i]);
    tasks = pack(pending.filter((t) => !dropped.has(t)), availability, today);
    finish = finishDate(tasks);
  }
  return { ...base, feasible: !finish || finish <= targetDate, tasks, finish, dropped: [...dropped] };
}

export function planHealth(input: {
  missedMinutes: number;
  /** average minutes on a study day */
  studyDayMinutes: number;
  projectedFinish: string | null;
  targetDate: string;
  todayMinutes: number;
  todayCapacity: number;
}): PlanHealth {
  if (input.todayCapacity > 0 && input.todayMinutes > input.todayCapacity * 1.5) return 'overloaded';
  if (input.missedMinutes > input.studyDayMinutes || (input.projectedFinish && input.projectedFinish > input.targetDate)) return 'needs_attention';
  if (input.missedMinutes > 0) return 'slightly_behind';
  return 'on_track';
}

/** "Linked Lists, Stacks & Queues": the skills a sprint spends most time on. */
export function sprintTheme(tasks: { skillName: string | null; minutes: number }[], max = 3) {
  const bySkill = new Map<string, number>();
  for (const t of tasks) if (t.skillName) bySkill.set(t.skillName, (bySkill.get(t.skillName) ?? 0) + t.minutes);
  const names = [...bySkill.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([n]) => n);
  if (!names.length) return 'Practice and mocks';
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}
