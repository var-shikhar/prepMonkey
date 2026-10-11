import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import { ArrowRight, CalendarClock, ChevronRight, Clock, ExternalLink, FileQuestion, Layers, Play, Target, Trophy } from 'lucide-react';
import { MascotMark } from '@/components/brand/mascot';
import { Reveal } from '@/components/common/reveal';
import { ExamFaq } from '@/components/exam-hub/exam-faq';
import { ExamDateButton, GuestDiagnosticButton, OpenSetupButton } from '@/components/exam-hub/hub-actions';
import { PracticeOptions } from '@/components/exam-hub/practice-options';
import { ReadinessGauge } from '@/components/exam-hub/readiness-gauge';
import { Syllabus } from '@/components/exam-hub/syllabus';
import { StartButton } from '@/components/results/start-button';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KINDS } from '@/lib/attempt-kinds';
import { daysUntil } from '@/lib/dates';
import type { ExamConfig } from '@/lib/engine/types';
import { examFaq } from '@/lib/exam-faq';
import { breadcrumbLd, courseLd, examDescription, examPageTitle, faqLd, graph } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { getExamHubData, type ExamHubData } from '@/server/analytics';
import { getExam, getPoolCounts, getSampleQuestions, getSkillCounts, getStudyNotes } from '@/server/exams';
import { getStudyPlan } from '@/server/plan';
import { getUser } from '@/server/session';
import { WeekPlan } from '@/components/plan/study-plan';

async function publishedExam(examId: string) {
  const ex = await getExam(examId);
  return ex?.isPublished ? ex : null;
}

export async function generateMetadata({ params }: { params: Promise<{ examId: string }> }): Promise<Metadata> {
  const ex = await publishedExam((await params).examId);
  if (!ex) return { title: 'Exam not found', robots: { index: false } };
  const title = examPageTitle(ex);
  const description = examDescription(ex);
  const path = `/exams/${ex.id}`;
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path } };
}

/** The learner's own hub data, loaded once per request and shared by the sections that stream in. */
const learnerHub = cache(async (examId: string) => {
  const user = await getUser();
  if (!user) return null;
  const [hub, plan] = await Promise.all([getExamHubData(user.id, examId), getStudyPlan(user.id, examId)]);
  return { user, hub, plan };
});

export default async function ExamHubPage({ params, searchParams }: { params: Promise<{ examId: string }>; searchParams: Promise<{ start?: string }> }) {
  const { examId } = await params;
  const { start } = await searchParams;
  const ex = await publishedExam(examId);
  if (!ex) notFound(); // before anything streams, so unknown exams get a real 404
  const cfg = ex.config;
  // Catalogue data is cached in-process, so the public page renders straight into the first HTML
  // (what crawlers read). Only the learner's own progress streams in afterwards.
  const [counts, notes, pools, samples] = await Promise.all([getSkillCounts(ex.id), getStudyNotes(ex.id), getPoolCounts(ex.id), getSampleQuestions(ex.id)]);
  const studySkills = Object.keys(notes);
  const faqs = examFaq(ex);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pt-5 pb-12 sm:space-y-16 sm:px-6 sm:pt-8">
      <JsonLd data={graph(courseLd(ex), breadcrumbLd([{ name: 'Explore', path: '/explore' }, { name: ex.code, path: `/exams/${ex.id}` }]), faqLd(faqs))} />

      {/* ---------------- header */}
      <Reveal>
        <section className="glass relative overflow-hidden rounded-[1.75rem] p-5 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -top-28 -right-20 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 60% 90% at 100% 0%, black, transparent 70%)',
            }}
          />
          <div className="relative">
            <Breadcrumbs items={[{ name: 'Explore', href: '/explore' }, { name: ex.code }]} />
            <div className="mt-5 flex items-center gap-3">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-2xl font-mono text-[0.7rem] font-bold text-white shadow-sm sm:size-14"
                style={{ background: `linear-gradient(135deg, ${ex.meta.accent ?? '#ea7a1f'}, oklch(0.42 0.09 45))` }}
              >
                {ex.code.split('-')[0].slice(0, 4)}
              </span>
              <div className="flex min-w-0 flex-wrap gap-1.5 text-xs">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-semibold text-primary">{ex.code}</span>
                {ex.vendor && <span className="rounded-full border border-hairline bg-wash px-2.5 py-1 font-medium">{ex.vendor}</span>}
                {cfg.blueprintVersion && <span className="rounded-full border border-hairline bg-wash px-2.5 py-1 text-muted-foreground">{cfg.blueprintVersion}</span>}
              </div>
            </div>
            <h1 className="mt-5 max-w-3xl text-[1.9rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">{ex.title}</h1>
            {ex.meta.description && <p className="mt-3 max-w-3xl text-muted-foreground sm:text-lg">{ex.meta.description}</p>}
            <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <Spec icon={FileQuestion} value={String(cfg.itemCount)} label="questions" />
              <Spec icon={Clock} value={String(cfg.timeLimitMinutes)} label="minutes" />
              <Spec icon={Target} value={String(cfg.scale.passing)} suffix={`/ ${cfg.scale.max.toLocaleString()}`} label="pass mark" />
              <Spec icon={Layers} value={String(cfg.domains.length)} label="domains" />
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {pools.bank + pools.imported > 0 && (
                <span className="inline-flex items-center gap-1.5"><Trophy className="size-4 text-primary" />{(pools.bank + pools.imported).toLocaleString()} practice questions</span>
              )}
              {cfg.officialUrl && (
                <a href={cfg.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                  Official exam page <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ---------------- the learner's own sections stream in behind the public page */}
      <Suspense fallback={<LearnerSectionsSkeleton />}>
        <LearnerSections examId={ex.id} exam={cfg} counts={counts} hasImported={pools.imported > 0} start={start} />
      </Suspense>

      <Reveal delay={0.1}>
        {/* The public syllabus is the fallback, so it is in the first HTML; the learner's mastery replaces it. */}
        <Suspense fallback={<Syllabus exam={cfg} mastery={null} counts={counts} studySkills={studySkills} signedIn={false} pending />}>
          <LearnerSyllabus exam={cfg} counts={counts} studySkills={studySkills} />
        </Suspense>
      </Reveal>

      {samples.length > 0 && (
        <Reveal>
          <section className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-6">
            <MascotMark className="size-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-semibold">Sample questions with answers</h2>
              <p className="text-sm text-muted-foreground">{samples.length} questions from the {ex.code} bank, with an explanation for every option. No sign-up needed.</p>
            </div>
            <Button asChild variant="ghost" size="lg" className="glass w-full sm:w-auto"><Link href={`/exams/${ex.id}/sample-questions`}>See sample questions <ArrowRight data-icon="inline-end" /></Link></Button>
          </section>
        </Reveal>
      )}

      <Suspense fallback={null}>
        <RecentAttempts examId={ex.id} />
      </Suspense>

      <Reveal>
        <ExamFaq faqs={faqs} />
      </Reveal>
    </div>
  );
}

async function LearnerSections({ examId, exam, counts, hasImported, start }: {
  examId: string; exam: ExamConfig; counts: Record<string, number>; hasImported: boolean; start?: string;
}) {
  const learner = await learnerHub(examId);
  const user = learner?.user ?? null;
  const hub = learner?.hub ?? null;
  return (
    <>
      <Reveal delay={0.05}>
        {user && hub ? <ProgressCard examId={examId} hub={hub} passing={exam.scale.passing} /> : <VisitorCard examId={examId} />}
      </Reveal>

      <Reveal delay={0.1}>
        <PracticeOptions
          exam={exam}
          signedIn={Boolean(user)}
          defaultName={user && !user.isAnonymous ? user.name : ''}
          hasImported={hasImported}
          skillCounts={counts}
          due={hub?.due ?? 0}
          mistakes={hub?.mistakes ?? 0}
          autoOpen={user && (start === 'quick' || start === 'full' || start === 'practice') ? start : undefined}
        />
      </Reveal>

      {learner?.plan && <Reveal delay={0.1}><WeekPlan plan={learner.plan} /></Reveal>}
    </>
  );
}

function LearnerSectionsSkeleton() {
  return (
    <>
      <Skeleton className="h-52 rounded-3xl" />
      <div className="space-y-4" aria-hidden>
        <div className="space-y-2"><Skeleton className="h-6 w-44" /><Skeleton className="h-4 w-72 max-w-full" /></div>
        <div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      </div>
    </>
  );
}

async function LearnerSyllabus({ exam, counts, studySkills }: { exam: ExamConfig; counts: Record<string, number>; studySkills: string[] }) {
  const learner = await learnerHub(exam.id);
  return <Syllabus exam={exam} mastery={learner?.hub.readiness?.skills ?? null} counts={counts} studySkills={studySkills} signedIn={Boolean(learner)} />;
}

async function RecentAttempts({ examId }: { examId: string }) {
  const recent = (await learnerHub(examId))?.hub.recent ?? [];
  if (!recent.length) return null;
  return (
    <Reveal>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Recent attempts</h2>
          <Link href={`/progress?exam=${examId}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary">All history <ArrowRight className="size-3.5" /></Link>
        </div>
        <ul className="glass divide-y divide-hairline overflow-hidden rounded-3xl">
          {recent.map((a) => (
            <li key={a.id}>
              <Link href={`/attempt/${a.id}/result`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-wash sm:px-5">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{KINDS[a.kind].label}</span>
                  <span className="block text-xs text-muted-foreground">{new Date(a.startedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {a.correctCount ?? 0}/{a.itemCount} correct</span>
                </span>
                {KINDS[a.kind].scored && a.scaled != null ? (
                  <span className={cn('rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums', a.passed ? 'bg-success/12 text-success' : 'bg-wash')}>{a.scaled}</span>
                ) : (
                  <span className="rounded-full bg-wash px-2.5 py-1 text-sm font-semibold tabular-nums">{a.itemCount ? Math.round(((a.correctCount ?? 0) / a.itemCount) * 100) : 0}%</span>
                )}
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  );
}

function Spec({ icon: Icon, value, suffix, label }: { icon: React.ComponentType<{ className?: string }>; value: string; suffix?: string; label: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-wash px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5 text-primary" />{label}</dt>
      <dd className="mt-1 font-heading text-2xl font-semibold tracking-[-0.03em] tabular-nums">
        {value}{suffix && <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">{suffix}</span>}
      </dd>
    </div>
  );
}

function ProgressCard({ examId, hub, passing }: { examId: string; hub: ExamHubData; passing: number }) {
  const r = hub.readiness;
  const confidenceNote = !r || r.confidence === 'none'
    ? 'Answer a few questions and your readiness appears here.'
    : r.confidence === 'low'
      ? 'Early estimate. It sharpens as you cover more of the syllabus.'
      : r.confidence === 'medium' ? 'Solid estimate. Cover every skill for the most accurate read.' : 'High confidence. Based on broad, recent practice.';

  let primary: React.ReactNode;
  let hint: string;
  if (hub.active) {
    primary = (
      <Button asChild variant="premium" size="xl">
        <Link href={`/attempt/${hub.active.id}`}><Play data-icon="inline-start" />Resume {KINDS[hub.active.kind].label.toLowerCase()}</Link>
      </Button>
    );
    hint = `Question ${hub.active.position} of ${hub.active.itemCount} · ${hub.active.answered} answered${hub.active.deadline ? ' · timer running' : ''}`;
  } else if (!r || r.answered === 0) {
    primary = <StartButton variant="premium" size="xl" input={{ examId, kind: 'diagnostic' }}>Take the 15-question diagnostic <ArrowRight data-icon="inline-end" /></StartButton>;
    hint = 'About 20 minutes. Tells you exactly where to focus.';
  } else if (hub.due >= 5) {
    primary = <StartButton variant="premium" size="xl" input={{ examId, kind: 'review' }}><CalendarClock data-icon="inline-start" />Review {hub.due} due questions</StartButton>;
    hint = 'Spaced review takes a few minutes and locks in what you missed.';
  } else if ((r.readiness ?? 0) < 50) {
    const weakest = [...r.skills].filter((s) => s.answered > 0).sort((a, b) => a.mastery - b.mastery)[0] ?? r.skills.find((s) => s.answered === 0);
    primary = weakest
      ? <StartButton variant="premium" size="xl" input={{ examId, kind: 'practice', skills: [weakest.skillId], count: 10 }}>Drill {weakest.name} <ArrowRight data-icon="inline-end" /></StartButton>
      : <OpenSetupButton kind="practice" variant="premium" size="xl">Start a drill <ArrowRight data-icon="inline-end" /></OpenSetupButton>;
    hint = weakest ? `Your ${weakest.answered ? 'weakest' : 'least practised'} skill right now.` : 'Build your base with instant feedback.';
  } else {
    primary = <OpenSetupButton kind="full" variant="premium" size="xl">Start full mock <ArrowRight data-icon="inline-end" /></OpenSetupButton>;
    hint = 'You look ready to test yourself under real conditions.';
  }

  return (
    <section className="glass relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto] md:gap-8">
        <ReadinessGauge value={r?.readiness ?? null} />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Your progress</h2>
            <ExamDateButton examId={examId} targetDate={hub.targetDate} daysLeft={hub.targetDate ? daysUntil(hub.targetDate) : null} />
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:max-w-md">
            <MiniStat label="Predicted" value={r?.predictedScaled != null ? String(r.predictedScaled) : '—'} good={r?.predictedScaled != null && r.predictedScaled >= passing} />
            <MiniStat label="Best mock" value={hub.bestScaled != null ? String(hub.bestScaled) : '—'} good={hub.bestScaled != null && hub.bestScaled >= passing} />
            <MiniStat label="Answered" value={String(r?.answered ?? 0)} />
          </dl>
          <p className="text-xs text-muted-foreground">{confidenceNote}</p>
        </div>
        {/* The main action spans the card on phones, where it's the thumb's target. */}
        <div className="flex flex-col items-stretch gap-2 md:items-end [&>*:first-child]:w-full md:[&>*:first-child]:w-auto">
          {primary}
          <p className="max-w-xs text-xs text-muted-foreground md:text-right">{hint}</p>
          {hub.certificateId && (
            <Link href={`/certificates/${hub.certificateId}`} className="inline-flex items-center gap-1 text-sm font-medium text-success hover:underline md:justify-end">
              <Trophy className="size-4" /> View your certificate
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-2xl border border-hairline bg-wash px-3 py-2.5">
      <dt className="text-[0.7rem] text-muted-foreground">{label}</dt>
      <dd className={cn('font-heading text-lg font-semibold tabular-nums', good && 'text-success')}>{value}</dd>
    </div>
  );
}

function VisitorCard({ examId }: { examId: string }) {
  return (
    <section className="glass relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[1.75rem] border-primary/25 p-6 sm:flex-row sm:items-center sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative space-y-1.5">
        <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Know where you stand in 20 minutes</h2>
        <p className="max-w-xl text-sm text-muted-foreground">Take the free 15-question diagnostic. No account needed, and your results carry over if you sign up later.</p>
      </div>
      <div className="relative flex w-full flex-col gap-2 sm:w-auto sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">
        <GuestDiagnosticButton examId={examId} />
        <Button asChild variant="ghost" size="xl"><Link href={`/sign-in?next=/exams/${examId}`}>Sign in</Link></Button>
      </div>
    </section>
  );
}
