import Link from 'next/link';
import {
  AlertTriangle, BookOpen, CalendarCheck, Check, Clock, Flag, Gauge, Layers, PauseCircle, RotateCcw, Sparkles, Target, Timer, Zap,
} from 'lucide-react';
import { Reveal } from '@/components/common/reveal';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { daysBetween, formatDay, type GoalTaskKind, type PlanHealth } from '@/lib/goal-plan';
import { cn } from '@/lib/utils';
import type { GoalTaskView, PlanView } from '@/server/goal-plan';
import { GoalTaskButton } from './goal-task-button';
import { DismissNotice, PlanMenu, RecoveryButton, ResumeButton } from './plan-actions';

export const KIND_ICON: Record<GoalTaskKind, typeof Zap> = {
  reading: BookOpen, drill: Zap, review: RotateCcw, mixed: Layers, mini_mock: Timer, full_mock: Flag,
};

export const HEALTH: Record<PlanHealth, { label: string; body: string; tone: string }> = {
  on_track: { label: 'On track', body: 'Keep this pace and you reach your goal on time.', tone: 'border-success/30 bg-success/10 text-success' },
  slightly_behind: { label: 'Slightly behind', body: 'A little work slipped. Catch up today to stay close to your target.', tone: 'border-warning/40 bg-warning/10 text-warning' },
  needs_attention: { label: 'Needs attention', body: "At this pace you won't finish by your target date. Pick a way to get back on track.", tone: 'border-destructive/30 bg-destructive/10 text-destructive' },
  overloaded: { label: 'Heavy day', body: "Today's combined workload is well over your usual time. Spread it out or adjust the plan.", tone: 'border-warning/40 bg-warning/10 text-warning' },
};

const relativeDay = (day: string, today: string) => {
  const n = daysBetween(today, day);
  return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : formatDay(day);
};

export function PlanBoard({ plan }: { plan: PlanView }) {
  const active = plan.status === 'active';
  const late = plan.projectedFinish && plan.projectedFinish > plan.targetDate;
  const todayOpen = plan.todayTasks.filter((t) => t.status === 'pending');
  const daysLeft = daysBetween(plan.today, plan.targetDate);
  const current = plan.sprints.find((s) => plan.today >= s.from && plan.today <= s.to) ?? plan.sprints.find((s) => s.from > plan.today) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-6 pb-12 sm:space-y-8 sm:px-6 sm:pt-10">
      <PageHeader
        eyebrow="Goal planner"
        title={plan.name}
        description={<>{plan.subjects.map((s) => `${s.code}${s.targetLevel ? ` · L${s.targetLevel}` : ''}`).join('  ·  ')} — target {formatDay(plan.targetDate, { day: 'numeric', month: 'long', year: 'numeric' })}</>}
      >
        {plan.status !== 'completed' && <PlanMenu planId={plan.id} active={active} today={plan.today} />}
      </PageHeader>

      {plan.notice && (
        <Reveal>
          <div className="glass flex items-start gap-3 rounded-2xl border-primary/30 p-4">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="flex-1 text-sm">{plan.notice.message}</p>
            <DismissNotice planId={plan.id} />
          </div>
        </Reveal>
      )}

      {plan.status === 'paused' && (
        <Reveal>
          <div className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
            <PauseCircle className="size-8 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">
                {plan.autoPaused ? 'We paused your plan after a few quiet days' : plan.pausedUntil ? `On a break until ${formatDay(plan.pausedUntil)}` : 'Your plan is paused'}
              </p>
              <p className="text-sm text-muted-foreground">Nothing counts as missed while it&apos;s paused. Resuming picks up from today; the finish date moves only if it has to.</p>
            </div>
            <ResumeButton planId={plan.id} size="xl" />
          </div>
        </Reveal>
      )}

      {plan.status === 'completed' && (
        <Reveal>
          <div className="glass rounded-3xl border-success/30 p-6 text-center">
            <p className="font-heading text-2xl font-semibold">Plan complete</p>
            <p className="mt-1 text-muted-foreground">Every task is done. Book the exam, or build a new plan for your next goal.</p>
            <Button asChild variant="premium" size="xl" className="mt-4"><Link href="/planner/new">Build a new plan</Link></Button>
          </div>
        </Reveal>
      )}

      {/* Status strip: progress, finish, health. */}
      <Reveal delay={0.05}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat icon={Gauge} label="Progress">
            <div className="flex items-baseline gap-2"><span className="font-heading text-3xl font-semibold tabular-nums">{plan.progress.percent}%</span><span className="text-xs text-muted-foreground">{plan.progress.doneTasks}/{plan.progress.totalTasks} tasks</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline"><div className="bg-gradient-brand h-full rounded-full" style={{ width: `${plan.progress.percent}%` }} /></div>
            <p className="mt-2 text-xs text-muted-foreground">{Math.round(plan.progress.doneMinutes / 60)}h of ~{Math.round(plan.progress.totalMinutes / 60)}h done</p>
          </Stat>
          <Stat icon={CalendarCheck} label="Estimated finish">
            <p className={cn('font-heading text-2xl font-semibold', late && 'text-destructive')}>{plan.projectedFinish ? formatDay(plan.projectedFinish) : 'Done'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target {formatDay(plan.targetDate)}{daysLeft >= 0 ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''}{late ? ' · running late' : ''}
            </p>
          </Stat>
          <Stat icon={Target} label="Plan health">
            {active ? (
              <>
                <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-sm font-semibold', HEALTH[plan.health].tone)}>{HEALTH[plan.health].label}</span>
                <p className="mt-2 text-xs text-muted-foreground">{HEALTH[plan.health].body}</p>
                {plan.health !== 'on_track' && <div className="mt-3"><RecoveryButton planId={plan.id} targetDate={plan.targetDate} /></div>}
              </>
            ) : <p className="text-sm text-muted-foreground">{plan.status === 'paused' ? 'Paused' : 'Complete'}</p>}
          </Stat>
        </div>
      </Reveal>

      {active && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-6">
            <Reveal delay={0.08}>
              <section className="glass rounded-3xl p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Today</h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {plan.todayTasks.filter((t) => t.status === 'done').length}/{plan.todayTasks.length} · ~{plan.todayTasks.reduce((a, t) => a + t.minutes, 0)} min
                  </span>
                </div>
                {plan.todayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">A rest day on your schedule.{plan.nextDay ? ' Want to get ahead? Tasks for your next study day are below.' : ''}</p>
                ) : (
                  <TaskList tasks={plan.todayTasks} due={plan.due} />
                )}
                {todayOpen.length === 0 && plan.nextDay && (
                  <div className="mt-6 border-t border-hairline pt-5">
                    <h3 className="mb-3 text-sm font-semibold">Work ahead · {relativeDay(plan.nextDay.day, plan.today)}</h3>
                    <TaskList tasks={plan.nextDay.tasks} due={plan.due} />
                  </div>
                )}
              </section>
            </Reveal>

            {plan.missedTasks.length > 0 && (
              <Reveal delay={0.1}>
                <section className="glass rounded-3xl border-warning/30 p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-[-0.02em]"><AlertTriangle className="size-4 text-warning" /> Missed ({plan.missed.tasks})</h2>
                    <RecoveryButton planId={plan.id} targetDate={plan.targetDate} />
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {plan.missed.minutes} minutes of earlier work is still open. Do it now, or pick a recovery option to re-plan it.
                  </p>
                  <TaskList tasks={plan.missedTasks.slice(0, 8)} due={plan.due} showDay today={plan.today} />
                  {plan.missedTasks.length > 8 && <p className="mt-3 text-xs text-muted-foreground">and {plan.missedTasks.length - 8} more</p>}
                </section>
              </Reveal>
            )}
          </div>

          <Reveal delay={0.12}>
            <section className="glass rounded-3xl p-5">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"><Clock className="size-4 text-primary" /> Your week</h2>
              <WeekStrip availability={plan.availability} />
              <p className="mt-3 text-xs text-muted-foreground">Minutes you study each day. To change them, drop this plan and build a new one; your progress on questions is kept.</p>
            </section>
          </Reveal>
        </div>
      )}

      <Reveal delay={0.14}>
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Sprints</h2>
          <div className="space-y-2.5">
            {plan.sprints.map((s) => {
              const pct = s.minutes ? Math.round((s.doneMinutes / s.minutes) * 100) : 0;
              const isCurrent = current?.index === s.index;
              return (
                <details key={s.index} open={isCurrent} className={cn('glass group rounded-3xl', isCurrent && 'border-primary/40')}>
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl border font-heading text-sm font-semibold', pct === 100 ? 'border-success bg-success text-success-foreground' : 'border-primary/20 bg-primary/10 text-primary')}>
                      {pct === 100 ? <Check className="size-4" /> : s.index}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">Sprint {s.index}: {s.theme}</span>
                      <span className="block text-xs text-muted-foreground">{formatDay(s.from)} – {formatDay(s.to)} · ~{Math.round(s.minutes / 60 * 10) / 10}h{isCurrent ? ' · this week' : ''}</span>
                    </span>
                    <span className="hidden w-28 sm:block">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-hairline"><span className="bg-gradient-brand block h-full rounded-full" style={{ width: `${pct}%` }} /></span>
                    </span>
                    <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">{pct}%</span>
                  </summary>
                  <ol className="space-y-4 border-t border-hairline p-4 sm:p-5">
                    {s.days.map((d) => (
                      <li key={d.day}>
                        <h3 className={cn('mb-2 text-sm font-semibold', d.day === plan.today && 'text-primary')}>{relativeDay(d.day, plan.today)}</h3>
                        <TaskList tasks={d.tasks} due={plan.due} compact readOnly={!active || d.day > plan.today} />
                      </li>
                    ))}
                  </ol>
                </details>
              );
            })}
          </div>
        </section>
      </Reveal>
    </div>
  );
}

function Stat({ icon: Icon, label, children }: { icon: typeof Zap; label: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"><Icon className="size-4 text-primary" /> {label}</p>
      {children}
    </div>
  );
}

function TaskList({ tasks, due, compact, readOnly, showDay, today }: {
  tasks: GoalTaskView[]; due: Record<string, number>; compact?: boolean; readOnly?: boolean; showDay?: boolean; today?: string;
}) {
  return (
    <ul className={cn(compact ? 'space-y-2' : 'space-y-3')}>
      {tasks.map((t) => {
        const Icon = KIND_ICON[t.kind];
        const done = t.status === 'done';
        return (
          <li key={t.id} className="flex items-center gap-3">
            <span className={cn('grid shrink-0 place-items-center rounded-xl border', compact ? 'size-7' : 'size-9', done ? 'border-success bg-success text-success-foreground' : 'border-hairline bg-wash text-primary')}>
              {done ? <Check className="size-3.5" /> : <Icon className={compact ? 'size-3.5' : 'size-4'} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-sm font-medium', done && 'text-muted-foreground line-through')}>{t.label}</span>
              <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>~{t.minutes} min</span>
                {!compact && <span className="hidden sm:inline">· {t.detail}</span>}
                {showDay && today && <span>· planned {relativeDay(t.day, today).toLowerCase()}</span>}
                {t.carried && !done && <span className="rounded-full border border-warning/40 bg-warning/10 px-1.5 text-warning">carried over</span>}
              </span>
            </span>
            {!done && !readOnly && <GoalTaskButton task={t} due={due[t.examId] ?? 0} />}
          </li>
        );
      })}
    </ul>
  );
}

const WEEK = [{ dow: 1, d: 'M' }, { dow: 2, d: 'T' }, { dow: 3, d: 'W' }, { dow: 4, d: 'T' }, { dow: 5, d: 'F' }, { dow: 6, d: 'S' }, { dow: 0, d: 'S' }];

function WeekStrip({ availability }: { availability: number[] }) {
  const max = Math.max(...availability, 1);
  return (
    <div className="flex items-end justify-between gap-1.5">
      {WEEK.map((w) => {
        const m = availability[w.dow] ?? 0;
        return (
          <div key={w.dow} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[0.65rem] text-muted-foreground tabular-nums">{m || '–'}</span>
            <span className="flex h-16 w-full items-end overflow-hidden rounded-lg bg-hairline">
              <span className={cn('w-full rounded-lg', m ? 'bg-gradient-brand' : '')} style={{ height: `${(m / max) * 100}%` }} />
            </span>
            <span className="text-xs font-medium text-muted-foreground">{w.d}</span>
          </div>
        );
      })}
    </div>
  );
}
