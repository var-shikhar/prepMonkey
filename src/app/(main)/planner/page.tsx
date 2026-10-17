import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarRange, LifeBuoy, Sparkles, Target } from 'lucide-react';
import { Reveal } from '@/components/common/reveal';
import { PageHeader } from '@/components/layout/page-header';
import { PlanBoard } from '@/components/planner/plan-board';
import { Button } from '@/components/ui/button';
import { getPlanView, plannerAccess } from '@/server/goal-plan';
import { requireUser } from '@/server/session';

export const metadata: Metadata = { title: 'Goal planner' };

export default async function PlannerPage() {
  const user = await requireUser('/planner');
  const [access, plan] = await Promise.all([plannerAccess(user.id), getPlanView(user.id)]);
  if (plan) return <PlanBoard plan={plan} />;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
      <PageHeader
        eyebrow={access ? 'Goal planner' : 'Goal planner · Pro'}
        title="A plan that gets you"
        accent="there."
        description="Tell us the goal, the date and the time you have. You get a day-by-day plan across every subject, and it re-plans with you when a week goes sideways."
      />
      <Reveal delay={0.05}>
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Target, title: 'Built around your goal', body: 'Certifications, interview subjects or both, at the level you are aiming for.' },
            { icon: CalendarRange, title: 'Weekly sprints', body: 'Reading, drills and spaced review each day, with a mini mock closing every week.' },
            { icon: LifeBuoy, title: 'Recovers with you', body: 'Missed a few days? Preview your options and pick one. Nothing moves without you.' },
          ].map((f) => (
            <li key={f.title} className="glass rounded-3xl p-5">
              <span className="grid size-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><f.icon className="size-5" /></span>
              <p className="mt-3 font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="glass flex flex-col items-stretch gap-4 rounded-[1.75rem] border-primary/25 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-lg font-semibold">{access ? 'Takes about two minutes' : 'The goal planner is part of Pro'}</p>
            <p className="text-sm text-muted-foreground">{access ? 'You can pause, take a break or start over at any time.' : 'Your free daily plan on the dashboard stays free.'}</p>
          </div>
          {access ? (
            <Button asChild variant="premium" size="xl"><Link href="/planner/new">Build my plan <ArrowRight data-icon="inline-end" /></Link></Button>
          ) : (
            <Button asChild variant="premium" size="xl"><Link href="/pricing"><Sparkles data-icon="inline-start" />See Pro</Link></Button>
          )}
        </div>
      </Reveal>
    </div>
  );
}
