import Link from 'next/link';
import { ArrowRight, Check, Route } from 'lucide-react';
import { MascotMark } from '@/components/brand/mascot';
import { Button } from '@/components/ui/button';
import { daysBetween, formatDay } from '@/lib/goal-plan';
import { cn } from '@/lib/utils';
import type { PlanView, PlannerLimits } from '@/server/goal-plan';
import { GoalTaskButton } from './goal-task-button';
import { ResumeButton } from './plan-actions';
import { HEALTH, KIND_ICON } from './plan-board';

const Backdrop = () => (
  <>
    <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: 'linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 70% 90% at 100% 0%, black, transparent 70%)',
      }}
    />
  </>
);

/** The top of Home for someone on a plan: the next task, how the plan is going, and today's list. */
export function GoalHero({ plan }: { plan: PlanView }) {
  const next = plan.todayTasks.find((t) => t.status === 'pending') ?? plan.missedTasks[0];
  const daysLeft = daysBetween(plan.today, plan.targetDate);
  const late = plan.projectedFinish && plan.projectedFinish > plan.targetDate;

  return (
    <section className="glass relative overflow-hidden rounded-[1.75rem] border-primary/25 p-6 sm:p-8">
      <Backdrop />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <Route className="size-4 shrink-0" /> <span className="truncate">{plan.name}</span>
          </p>
          {plan.status === 'active' && <span className={cn('rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold', HEALTH[plan.health].tone)}>{HEALTH[plan.health].label}</span>}
        </div>

        {plan.status === 'paused' ? (
          <>
            <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.03em] sm:text-3xl">Your plan is paused</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">Resume when you&apos;re ready. It picks up from today, and the finish date moves only if it has to.</p>
            <div className="mt-6 [&>*]:w-full sm:[&>*]:w-auto"><ResumeButton planId={plan.id} size="xl" /></div>
          </>
        ) : next ? (
          <>
            <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-3xl">{next.label}</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {next.day < plan.today ? 'Missed earlier. ' : ''}{next.detail} About {next.minutes} minutes.
            </p>
            <div className="mt-6 [&>*]:w-full sm:[&>*]:w-auto"><GoalTaskButton task={next} due={plan.due[next.examId] ?? 0} size="xl" variant="premium" label="Start now" /></div>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.03em] sm:text-3xl">{plan.todayTasks.length ? "Today's plan is done." : 'Rest day.'}</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{plan.nextDay ? 'Rest, or get ahead with your next study day.' : 'Nothing else is scheduled.'}</p>
            {plan.nextDay && <div className="mt-6 [&>*]:w-full sm:[&>*]:w-auto"><Button asChild variant="outline" size="xl"><Link href="/planner">Work ahead <ArrowRight data-icon="inline-end" /></Link></Button></div>}
          </>
        )}

        <dl className="mt-7 grid grid-cols-3 gap-2 sm:max-w-lg">
          <div className="rounded-2xl border border-hairline bg-wash px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">Progress</dt>
            <dd className="font-heading text-lg font-semibold tabular-nums">{plan.progress.percent}%</dd>
          </div>
          <div className="rounded-2xl border border-hairline bg-wash px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">Finish</dt>
            <dd className={cn('font-heading text-lg font-semibold', late && 'text-destructive')}>{plan.projectedFinish ? formatDay(plan.projectedFinish, { day: 'numeric', month: 'short' }) : 'Done'}</dd>
          </div>
          <div className="rounded-2xl border border-hairline bg-wash px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">Days left</dt>
            <dd className="font-heading text-lg font-semibold tabular-nums">{Math.max(0, daysLeft)}</dd>
          </div>
        </dl>

        {plan.status === 'active' && plan.todayTasks.length > 0 && (
          <ul className="mt-6 space-y-2 border-t border-hairline pt-5">
            {plan.todayTasks.map((t) => {
              const Icon = KIND_ICON[t.kind];
              const done = t.status === 'done';
              return (
                <li key={t.id} className="flex items-center gap-3 text-sm">
                  <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border border-hairline-strong', done && 'border-success bg-success text-success-foreground')}>
                    {done ? <Check className="size-3.5" /> : <Icon className="size-3.5 text-muted-foreground" />}
                  </span>
                  <span className={cn('min-w-0 flex-1 truncate', done && 'text-muted-foreground line-through')}>{t.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">~{t.minutes} min</span>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/planner" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">Open full plan <ArrowRight className="size-3.5" /></Link>
      </div>
    </section>
  );
}

/** Home banner for someone without a plan. */
export function GoalPlannerPromo({ limits }: { limits: PlannerLimits }) {
  return (
    <section className="glass relative overflow-hidden rounded-[1.75rem] border-primary/25 p-6 sm:p-7">
      <Backdrop />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <MascotMark className="size-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Plan to a goal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick an exam or interview date and the time you have. You get a day-by-day plan that re-plans with you when a week goes sideways.
            {!limits.pro && ` Free plans cover up to ${limits.maxSubjects} subjects over ${limits.maxDays / 7} weeks.`}
          </p>
        </div>
        <Button asChild variant="premium" size="xl" className="w-full sm:w-auto"><Link href="/planner/new">Build my plan <ArrowRight data-icon="inline-end" /></Link></Button>
      </div>
    </section>
  );
}
