import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SetupFlow } from '@/components/planner/setup-flow';
import { dayKey } from '@/lib/streak';
import type { Familiarity } from '@/lib/goal-plan';
import { getMyExams } from '@/server/analytics';
import { listExams } from '@/server/exams';
import { getCurrentPlan, plannerLimits } from '@/server/goal-plan';
import { getOrCreateProfile } from '@/server/profile';
import { requireUser } from '@/server/session';

export const metadata: Metadata = { title: 'New goal plan' };

export default async function NewPlanPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const { exam: initialExam } = await searchParams;
  const user = await requireUser('/planner/new');
  const [limits, current, exams, mine, profile] = await Promise.all([
    plannerLimits(user.id), getCurrentPlan(user.id), listExams(), getMyExams(user.id, 50), getOrCreateProfile(user.id),
  ]);
  if (current) redirect('/planner');
  const plannable = exams.filter((e) => e.category === 'certification' || e.category === 'interview');

  // Pre-fill each subject's level from practice here: enough answers and good accuracy read as further along.
  const suggested: Record<string, Familiarity> = {};
  for (const e of mine) {
    const r = e.readiness;
    if (!r?.answered) continue;
    const practised = r.skills.filter((s) => s.answered > 0);
    const avg = practised.reduce((a, s) => a + s.mastery, 0) / Math.max(1, practised.length);
    suggested[e.id] = r.answered < 20 ? 'basic' : avg >= 0.8 && r.coverage >= 0.6 ? 'strong' : avg >= 0.62 ? 'intermediate' : 'basic';
  }

  return (
    <SetupFlow
      exams={plannable}
      suggested={suggested}
      limits={limits}
      initialExam={plannable.some((e) => e.id === initialExam) ? initialExam : undefined}
      today={dayKey(new Date(), profile.timezone)}
    />
  );
}
