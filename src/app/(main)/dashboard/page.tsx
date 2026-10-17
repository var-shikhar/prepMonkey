import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CalendarClock, ChevronRight, Compass, Flame, Play, Plus, Star, Target, Zap } from 'lucide-react';
import { MascotMark } from '@/components/brand/mascot';
import { Reveal } from '@/components/common/reveal';
import { ActivityHeatmap } from '@/components/dashboard/activity-heatmap';
import { GoalRing } from '@/components/dashboard/goal-ring';
import { StartButton } from '@/components/results/start-button';
import { Button } from '@/components/ui/button';
import { KINDS } from '@/lib/attempt-kinds';
import { daysUntil } from '@/lib/dates';
import { serif } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { getMyExams, type DashboardExam } from '@/server/analytics';
import { getActiveAttempts, listAttempts } from '@/server/attempts';
import { getActivityHeatmap, getOrCreateProfile, getStreak } from '@/server/profile';
import { getStudyPlan, type PlanView } from '@/server/plan';
import { requireUser } from '@/server/session';
import { TodayPlan } from '@/components/plan/study-plan';
import { PlanTaskButton } from '@/components/plan/plan-task-button';
import { GoalPlannerPromo, GoalToday } from '@/components/planner/goal-today';
import { GoalTaskButton } from '@/components/planner/goal-task-button';
import { getPlanView, plannerAccess, type PlanView as GoalPlanView } from '@/server/goal-plan';

export const metadata: Metadata = { title: 'Home' };

function greeting(timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone }).format(new Date()));
  return hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default async function DashboardPage() {
  const user = await requireUser('/dashboard');
  const [profile, myExams, active, streak, heat, recent, goal, goalAccess] = await Promise.all([
    getOrCreateProfile(user.id),
    getMyExams(user.id),
    getActiveAttempts(user.id),
    getStreak(user.id),
    getActivityHeatmap(user.id),
    listAttempts(user.id, { limit: 4 }),
    getPlanView(user.id),
    plannerAccess(user.id),
  ]);
  if (!profile.onboardedAt && myExams.length === 0 && recent.length === 0) redirect('/onboarding');

  const firstName = user.isAnonymous ? '' : user.name.split(' ')[0];
  const primary = myExams.find((e) => e.id === profile.primaryExamId) ?? myExams[0] ?? null;
  // A goal plan takes over from the free 7-day plan.
  const plan = primary && !goal ? await getStudyPlan(user.id, primary.id) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-10">
      <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: profile.timezone })}
          </p>
          <h1 className="mt-2 text-[2.1rem] leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">
            {greeting(profile.timezone)},{' '}
            <span className={cn(serif.className, 'text-ember pr-1 font-normal tracking-[-0.01em]')}>{firstName || 'there'}.</span>
          </h1>
        </div>
        {user.isAnonymous && (
          <Link
            href="/sign-up"
            className="glass group inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition hover:border-primary/40 sm:w-auto"
          >
            <MascotMark className="size-7 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">You&apos;re practising as a guest</span>
              <span className="block text-xs text-muted-foreground">Create a free account to keep your progress</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-primary transition group-hover:translate-x-0.5" />
          </Link>
        )}
      </Reveal>

      {/*
        Phones get one column in priority order: next step, today, plan, exams, results, activity.
        From lg the two wrappers become columns; on phones they're display:contents, so `order` interleaves them.
      */}
      <div className="mt-7 flex flex-col gap-5 sm:mt-9 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-6">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <Reveal delay={0.05} className="order-1"><UpNext active={active} exams={myExams} primary={primary} plan={plan} goal={goal} /></Reveal>

          <Reveal delay={0.1} className="order-4">
            <section className="space-y-3">
              <SectionTitle title="Your exams" action={<Link href="/explore" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"><Plus className="size-4" /> Add an exam</Link>} />
              {myExams.length === 0 ? (
                <Link href="/explore" className="glass flex items-center gap-4 rounded-3xl border-dashed p-6 transition hover:border-primary/40">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary"><Compass className="size-5" /></span>
                  <span><span className="block font-semibold">Pick your first exam</span><span className="text-sm text-muted-foreground">Browse certifications and quizzes, then take a free diagnostic.</span></span>
                </Link>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myExams.map((e) => <MyExamCard key={e.id} exam={e} />)}
                </div>
              )}
            </section>
          </Reveal>

          {recent.length > 0 && (
            <Reveal delay={0.15} className="order-5">
              <section className="space-y-3">
                <SectionTitle title="Recent results" action={<Link href="/progress" className="inline-flex items-center gap-1 text-sm font-medium text-primary">See all <ArrowRight className="size-3.5" /></Link>} />
                <ul className="glass divide-y divide-hairline overflow-hidden rounded-3xl">
                  {recent.map((a) => {
                    const pct = a.itemCount ? Math.round(((a.correctCount ?? 0) / a.itemCount) * 100) : 0;
                    return (
                      <li key={a.id}>
                        <Link href={`/attempt/${a.id}/result`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-wash">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-hairline bg-wash font-mono text-[0.62rem] font-bold">{a.examCode.split('-')[0].slice(0, 4)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{KINDS[a.kind].label}</span>
                            <span className="block text-xs text-muted-foreground">{new Date(a.startedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                          </span>
                          <span className={cn('rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums', a.passed ? 'bg-success/12 text-success' : 'bg-wash')}>
                            {KINDS[a.kind].scored && a.scaled != null ? a.scaled : `${pct}%`}
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </Reveal>
          )}
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <Reveal delay={0.08} className="order-2">
            <section className="glass rounded-3xl p-5">
              <div className="flex items-center gap-4">
                <GoalRing done={streak.today.items} goal={profile.dailyGoal} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Today</p>
                  <p className="mt-1 font-heading text-lg leading-snug font-semibold">
                    {streak.today.items >= profile.dailyGoal ? 'Daily goal done.' : `${profile.dailyGoal - streak.today.items} questions to go`}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat icon={<Flame className={cn('size-4', streak.activeToday ? 'fill-banana/70 text-primary' : 'text-muted-foreground')} />} value={streak.current} label="day streak" />
                <Stat icon={<Star className="size-4 text-muted-foreground" />} value={profile.xp} label="XP earned" />
              </div>
            </section>
          </Reveal>
          {goal && <Reveal delay={0.12} className="order-3"><GoalToday plan={goal} /></Reveal>}
          {plan && <Reveal delay={0.12} className="order-3"><TodayPlan plan={plan} /></Reveal>}
          {!goal && <Reveal delay={0.13} className="order-3"><GoalPlannerPromo access={goalAccess} /></Reveal>}
          <Reveal delay={0.15} className="order-6">
            <section className="glass rounded-3xl p-5">
              <h2 className="mb-4 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">Activity</h2>
              <div className="mx-auto max-w-[19rem] lg:max-w-none">
                <ActivityHeatmap days={heat} timeZone={profile.timezone} />
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">{title}</h2>
      {action}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-wash px-3 py-2.5">
      <div className="flex items-center gap-1.5">{icon}<span className="font-heading text-lg font-semibold tabular-nums">{value.toLocaleString()}</span></div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function UpNext({ active, exams, primary, plan, goal }: {
  active: Awaited<ReturnType<typeof getActiveAttempts>>;
  exams: DashboardExam[];
  primary: DashboardExam | null;
  plan: PlanView | null;
  goal: GoalPlanView | null;
}) {
  let eyebrow = 'Up next';
  let title: string;
  let body: string;
  let action: React.ReactNode;
  let progress: number | null = null;
  const mostDue = [...exams].sort((a, b) => b.due - a.due)[0];
  const nextTask = plan?.days[0]?.tasks.find((t) => !t.done && t.kind !== 'rest');
  const goalNext = goal?.status === 'active' ? goal.todayTasks.find((t) => t.status === 'pending') ?? goal.missedTasks[0] : undefined;

  if (active[0]) {
    const a = active[0];
    eyebrow = 'Pick up where you left off';
    title = `${a.examCode} · ${KINDS[a.kind].label}`;
    body = `Question ${a.position} of ${a.itemCount}, ${a.answered} answered${a.deadline ? '. The timer is still running.' : '.'}`;
    progress = a.itemCount ? Math.round((a.answered / a.itemCount) * 100) : 0;
    action = <Button asChild variant="premium" size="xl"><Link href={`/attempt/${a.id}`}><Play data-icon="inline-start" />Resume</Link></Button>;
  } else if (goal?.status === 'paused') {
    eyebrow = goal.name;
    title = 'Your plan is paused';
    body = 'Resume when you are ready. It picks up from today, and the finish date moves only if it has to.';
    action = <Button asChild variant="premium" size="xl"><Link href="/planner">Open plan <ArrowRight data-icon="inline-end" /></Link></Button>;
  } else if (goal && goalNext) {
    eyebrow = `Today's plan · ${goal.name}`;
    title = goalNext.label;
    body = `${goalNext.detail} About ${goalNext.minutes} minutes.`;
    action = <GoalTaskButton task={goalNext} due={goal.due[goalNext.examId] ?? 0} size="xl" variant="premium" label="Start now" />;
  } else if (plan && nextTask) {
    eyebrow = `Today's plan · ${plan.examCode}`;
    title = nextTask.label;
    body = `${nextTask.detail} About ${nextTask.minutes} minutes.`;
    action = <PlanTaskButton examId={plan.examId} task={nextTask} size="xl" variant="premium" label="Start now" />;
  } else if (mostDue && mostDue.due > 0) {
    title = `Daily review: ${mostDue.due} question${mostDue.due === 1 ? '' : 's'} due`;
    body = `Questions you missed in ${mostDue.code} are ready to revisit. It takes a few minutes and makes them stick.`;
    action = <StartButton variant="premium" size="xl" input={{ examId: mostDue.id, kind: 'review' }}><CalendarClock data-icon="inline-start" />Start review</StartButton>;
  } else if (primary && !primary.readiness?.answered) {
    title = `Find your starting point in ${primary.code}`;
    body = 'A 15-question diagnostic across the whole syllabus shows exactly where to focus.';
    action = <StartButton variant="premium" size="xl" input={{ examId: primary.id, kind: 'diagnostic' }}><Target data-icon="inline-start" />Take the diagnostic</StartButton>;
  } else if (primary?.readiness) {
    const weakest = [...primary.readiness.skills].sort((a, b) => (a.answered ? a.mastery : 0.55) - (b.answered ? b.mastery : 0.55))[0];
    if ((primary.readiness.readiness ?? 0) >= 75) {
      title = `You look ready. Prove it with a full ${primary.code} mock`;
      body = `Readiness ${primary.readiness.readiness}%. A timed mock under exam conditions is the best final check.`;
      action = <Button asChild variant="premium" size="xl"><Link href={`/exams/${primary.id}`}>Go to full mock <ArrowRight data-icon="inline-end" /></Link></Button>;
    } else {
      title = `Strengthen ${weakest.name}`;
      body = weakest.answered
        ? `It's your weakest ${primary.code} skill at ${Math.round(weakest.mastery * 100)}%. Ten questions with explanations will move it.`
        : `You haven't practised this ${primary.code} skill yet. Ten quick questions will fix that.`;
      action = <StartButton variant="premium" size="xl" input={{ examId: primary.id, kind: 'practice', skills: [weakest.skillId], count: 10 }}><Zap data-icon="inline-start" />Start 10-question drill</StartButton>;
    }
  } else {
    title = 'Choose what to practise';
    body = 'Pick a certification or quiz and we will plan the rest.';
    action = <Button asChild variant="premium" size="xl"><Link href="/explore">Explore exams <ArrowRight data-icon="inline-end" /></Link></Button>;
  }

  return (
    <section className="glass relative overflow-hidden rounded-[1.75rem] border-primary/25 p-6 sm:p-8">
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
      <div className="relative">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <MascotMark className="size-5" /> {eyebrow}
        </p>
        <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">{body}</p>
        {progress != null && (
          <div className="mt-5 h-1.5 max-w-sm overflow-hidden rounded-full bg-hairline">
            <div className="bg-gradient-brand h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        )}
        {/* Full width on phones, where it's the thumb's target; natural width from sm. */}
        <div className="mt-6 [&>*]:w-full sm:[&>*]:w-auto">{action}</div>
      </div>
    </section>
  );
}

function ReadinessRing({ value }: { value: number | null }) {
  return (
    <div className="relative size-14 shrink-0">
      <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-hairline" strokeWidth="3" />
        {value != null && <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" pathLength="100" strokeDasharray={`${value} 100`} />}
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[0.7rem] font-semibold tabular-nums">{value != null ? `${value}%` : '–'}</span>
    </div>
  );
}

function MyExamCard({ exam }: { exam: DashboardExam }) {
  const r = exam.readiness;
  const days = exam.targetDate ? daysUntil(exam.targetDate) : null;
  return (
    <Link href={`/exams/${exam.id}`} className="glass group flex h-full flex-col rounded-3xl p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl font-mono text-[0.62rem] font-bold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${exam.accent ?? '#ea7a1f'}, oklch(0.42 0.09 45))` }}
        >
          {exam.code.split('-')[0].slice(0, 4)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-muted-foreground">{exam.code}</div>
          <div className="line-clamp-2 leading-snug font-semibold">{exam.title}</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <ReadinessRing value={r?.readiness ?? null} />
        <div className="min-w-0 text-sm">
          <div className="font-medium">{r?.readiness != null ? (r.readiness >= 75 ? 'Looking ready' : 'Building up') : 'Not started yet'}</div>
          <div className="text-xs text-muted-foreground">{r?.predictedScaled != null ? `Predicted score ${r.predictedScaled}` : 'Take the diagnostic to get a readiness score'}</div>
        </div>
      </div>
      {(exam.due > 0 || (days != null && days >= 0)) && (
        <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
          {exam.due > 0 && <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-medium text-primary">{exam.due} due for review</span>}
          {days != null && days >= 0 && <span className="rounded-full border border-hairline bg-wash px-2.5 py-1">Exam in {days} day{days === 1 ? '' : 's'}</span>}
        </div>
      )}
    </Link>
  );
}
