import Link from 'next/link';
import { ArrowRight, Check, Lock, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDay } from '@/lib/goal-plan';
import { cn } from '@/lib/utils';
import type { ExamPlanStatus } from '@/server/goal-plan';
import { GoalTaskButton } from './goal-task-button';
import { HEALTH, KIND_ICON } from './plan-board';

/**
 * The goal planner on an exam's page. Without a plan: plan for this exam.
 * With a plan that includes it: that plan's progress and today's tasks here.
 * With a plan for something else: one plan at a time, so it's locked.
 */
export function ExamPlanCard({ examId, examCode, status }: { examId: string; examCode: string; status: ExamPlanStatus | null }) {
  const setup = `/planner/new?exam=${encodeURIComponent(examId)}`;

  if (!status || status.kind === 'none') {
    return (
      <section className="glass flex flex-col gap-4 rounded-3xl border-primary/25 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Route className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Plan for {examCode}</h2>
          <p className="text-sm text-muted-foreground">Set your date and the time you have. Get a day-by-day plan that adapts when you fall behind.</p>
        </div>
        <Button asChild variant="premium" size="xl" className="w-full sm:w-auto">
          <Link href={status ? setup : `/sign-up?next=${encodeURIComponent(setup)}`}>Plan for this exam <ArrowRight data-icon="inline-end" /></Link>
        </Button>
      </section>
    );
  }

  if (status.kind === 'other_plan') {
    return (
      <section className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-hairline bg-wash text-muted-foreground"><Lock className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">You&apos;re on &ldquo;{status.planName}&rdquo;</h2>
          <p className="text-sm text-muted-foreground">One plan at a time keeps it realistic. Finish or drop that plan to plan for {examCode}. You can still practise here freely.</p>
        </div>
        <Button asChild variant="outline" size="xl" className="w-full sm:w-auto"><Link href="/planner">Open my plan</Link></Button>
      </section>
    );
  }

  const { plan } = status;
  const here = plan.todayTasks.filter((t) => t.examId === examId);
  return (
    <section className="glass space-y-4 rounded-3xl border-primary/25 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase"><Route className="size-4" /> Part of your plan</p>
          <h2 className="mt-1 truncate font-heading text-lg font-semibold tracking-[-0.02em]">{plan.name}</h2>
        </div>
        {plan.status === 'active'
          ? <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', HEALTH[plan.health].tone)}>{HEALTH[plan.health].label}</span>
          : <span className="rounded-full border border-hairline bg-wash px-2.5 py-0.5 text-xs font-semibold">Paused</span>}
      </div>
      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-hairline"><div className="bg-gradient-brand h-full rounded-full" style={{ width: `${plan.progress.percent}%` }} /></div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {plan.progress.percent}% done · target {formatDay(plan.targetDate)}{plan.projectedFinish ? ` · finishing ${formatDay(plan.projectedFinish)}` : ''}
        </p>
      </div>
      {plan.status === 'active' && (
        here.length ? (
          <ul className="space-y-2.5">
            {here.map((t) => {
              const Icon = KIND_ICON[t.kind];
              const done = t.status === 'done';
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg border', done ? 'border-success bg-success text-success-foreground' : 'border-hairline bg-wash text-primary')}>
                    {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm font-medium', done && 'text-muted-foreground line-through')}>{t.label}</span>
                    <span className="block text-xs text-muted-foreground">Today · ~{t.minutes} min</span>
                  </span>
                  {!done && <GoalTaskButton task={t} due={plan.due[t.examId] ?? 0} />}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Nothing for {examCode} on today&apos;s plan.</p>
      )}
      <Link href="/planner" className="inline-flex items-center gap-1 text-sm font-medium text-primary">Open full plan <ArrowRight className="size-3.5" /></Link>
    </section>
  );
}
