import Link from 'next/link';
import { ArrowRight, Check, Route, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanView } from '@/server/goal-plan';
import { GoalTaskButton } from './goal-task-button';
import { HEALTH, KIND_ICON } from './plan-board';

/** Dashboard side card: today's goal-plan tasks and plan health. */
export function GoalToday({ plan }: { plan: PlanView }) {
  const done = plan.todayTasks.filter((t) => t.status === 'done').length;
  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          <Route className="size-4 shrink-0 text-primary" /> <span className="truncate">{plan.name}</span>
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{done}/{plan.todayTasks.length}</span>
      </div>
      {plan.status === 'paused' ? (
        <p className="text-sm text-muted-foreground">Your plan is paused.</p>
      ) : (
        <>
          <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', HEALTH[plan.health].tone)}>{HEALTH[plan.health].label}</span>
          {plan.todayTasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Rest day. Nothing scheduled today.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {plan.todayTasks.map((t) => {
                const Icon = KIND_ICON[t.kind];
                const isDone = t.status === 'done';
                return (
                  <li key={t.id} className="flex items-start gap-3">
                    <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-hairline-strong', isDone && 'border-success bg-success text-success-foreground')}>
                      {isDone ? <Check className="size-3" /> : <Icon className="size-3 text-muted-foreground" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm font-medium', isDone && 'text-muted-foreground line-through')}>{t.label}</span>
                      <span className="block text-xs text-muted-foreground">~{t.minutes} min</span>
                    </span>
                    {!isDone && <GoalTaskButton task={t} due={plan.due[t.examId] ?? 0} />}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <Link href="/planner" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Open plan <ArrowRight className="size-3.5" /></Link>
    </section>
  );
}

/** Dashboard side card when there's no goal plan yet. */
export function GoalPlannerPromo({ access }: { access: boolean }) {
  return (
    <Link href="/planner" className="glass group flex items-center gap-3 rounded-3xl p-4 transition hover:border-primary/40">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Route className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          Plan to a goal
          {!access && <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/12 px-1.5 text-[0.65rem] font-semibold text-primary"><Sparkles className="size-2.5" />PRO</span>}
        </span>
        <span className="block text-xs text-muted-foreground">Pick a date and your free time; get a day-by-day plan that adapts.</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-primary transition group-hover:translate-x-0.5" />
    </Link>
  );
}
