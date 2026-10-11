import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, Award, CheckCircle2, Clock, EyeOff, RotateCcw, Target, TimerOff, TrendingUp } from 'lucide-react';
import { MascotMark } from '@/components/brand/mascot';
import { Reveal } from '@/components/common/reveal';
import { ReviewList } from '@/components/results/review-list';
import { ScoreRing } from '@/components/results/score-ring';
import { StartButton } from '@/components/results/start-button';
import { Button } from '@/components/ui/button';
import { KINDS } from '@/lib/attempt-kinds';
import type { ResultState } from '@/lib/dto';
import { serif } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { getResult } from '@/server/attempts';
import { AppError } from '@/server/errors';
import { requireUser } from '@/server/session';
import { NewBadges } from '@/components/achievements/achievements';
import { ChallengeButton } from '@/components/challenges/challenge-button';
import { recentBadges } from '@/server/gamification';

export const metadata: Metadata = { title: 'Your results' };

const fmtDuration = (ms: number) => {
  const m = Math.round(ms / 60_000);
  return m < 60 ? `${Math.max(1, m)} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/attempt/${id}/result`);
  const [result, fresh] = await Promise.all([getResult(user.id, id).catch((err) => {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  }), recentBadges(user.id)]);
  if ('active' in result) redirect(`/attempt/${id}`);

  const { summary, scale } = result;
  const kind = KINDS[result.kind];
  const scored = kind.scored;
  const percent = summary.itemCount ? Math.round((summary.correctCount / summary.itemCount) * 100) : 0;
  const domains = [...summary.byDomain].sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));
  const weakest = domains.find((d) => (d.percent ?? 100) < 70) ?? null;
  const wrong = result.items.filter((i) => !i.correct).length;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 pt-5 pb-12 sm:space-y-14 sm:px-6 sm:pt-8">
      {/* ---------------- hero */}
      <Reveal>
        <section className="glass relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
          <div aria-hidden className={cn('pointer-events-none absolute -top-24 -right-24 size-80 rounded-full blur-3xl', scored && summary.passed ? 'bg-success/20' : 'bg-primary/20')} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 60% 90% at 100% 0%, black, transparent 70%)',
            }}
          />
          <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
            <div className="mx-auto">
              {scored ? (
                <ScoreRing
                  value={(summary.scaled - scale.min) / (scale.max - scale.min)}
                  mark={(scale.passing - scale.min) / (scale.max - scale.min)}
                  label={summary.scaled}
                  sublabel={`of ${scale.max.toLocaleString()} · pass ${scale.passing}`}
                  tone={summary.passed ? 'pass' : 'fail'}
                />
              ) : (
                <ScoreRing value={percent / 100} label={percent} sublabel="% correct" tone="neutral" />
              )}
            </div>
            <div className="space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{result.examCode}</span>
                <span className="rounded-full border border-hairline bg-wash px-2.5 py-1 text-xs font-medium">{kind.label}</span>
                <span className="rounded-full border border-hairline bg-wash px-2.5 py-1 text-xs text-muted-foreground">{result.difficultyLabel}</span>
                {summary.timedOut && <span className="inline-flex items-center gap-1 rounded-full border border-warning/50 bg-warning/10 px-2.5 py-1 text-xs font-medium"><TimerOff className="size-3" />Time ran out</span>}
              </div>
              <h1 className="text-[2rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
                {scored
                  ? summary.passed ? <>You <Accent>passed.</Accent></> : <>Not there yet, but <Accent>close enough to see it.</Accent></>
                  : percent >= 80 ? <>Great <Accent>drill.</Accent></> : percent >= 50 ? <>Good <Accent>progress.</Accent></> : <>Every miss is <Accent>a lesson.</Accent></>}
              </h1>
              <p className="text-muted-foreground">
                {scored
                  ? summary.passed
                    ? `You scored ${summary.scaled} against a pass mark of ${scale.passing}. ${result.certificateId ? 'Your readiness certificate is ready.' : ''}`
                    : `You scored ${summary.scaled}; the pass mark is ${scale.passing}. ${weakest ? `Your biggest gain is in ${weakest.name}.` : ''}`
                  : `You got ${summary.correctCount} of ${summary.itemCount} right. Missed questions are now in your review queue.`}
              </p>
              <dl className="grid grid-cols-3 gap-2 text-left sm:max-w-lg">
                <Stat icon={CheckCircle2} label="Correct" value={`${summary.correctCount}/${summary.itemCount}`} />
                <Stat icon={Clock} label="Time" value={fmtDuration(summary.durationMs)} />
                <Stat icon={Target} label="Answered" value={`${summary.answeredCount}/${summary.itemCount}`} />
              </dl>
            </div>
          </div>
        </section>
      </Reveal>

      <NewBadges badges={fresh} />

      {result.integrity && result.integrity.blurs + result.integrity.fullscreenExits > 0 && (
        <p className="glass flex items-start gap-2 rounded-2xl border-warning/50 bg-warning/10 p-4 text-sm">
          <EyeOff className="mt-0.5 size-4 shrink-0" />
          <span>You left the exam tab {result.integrity.blurs} time{result.integrity.blurs === 1 ? '' : 's'}{result.integrity.fullscreenExits ? ` and exited full screen ${result.integrity.fullscreenExits} time${result.integrity.fullscreenExits === 1 ? '' : 's'}` : ''}. On a proctored exam, that can end your attempt, so practise staying in the exam window.</span>
        </p>
      )}

      {/* ---------------- one next step */}
      <Reveal delay={0.05}>
        <NextStep result={result} weakest={weakest} wrong={wrong} />
      </Reveal>

      {/* ---------------- breakdown */}
      <Reveal delay={0.1}>
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">By domain</h2>
            <p className="text-xs text-muted-foreground">Informational: pass/fail comes from the overall score.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {domains.map((d) => (
              <div key={d.id} className="glass rounded-3xl p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{d.name}</span>
                  <span className={cn('font-heading text-lg font-semibold tabular-nums', (d.percent ?? 0) >= 70 ? 'text-success' : (d.percent ?? 0) >= 50 ? 'text-foreground' : 'text-destructive')}>
                    {d.percent ?? 0}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-hairline">
                  <div
                    className={cn('h-full rounded-full', (d.percent ?? 0) >= 70 ? 'bg-success' : (d.percent ?? 0) >= 50 ? 'bg-gradient-brand' : 'bg-destructive/70')}
                    style={{ width: `${d.percent ?? 0}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.correct} of {d.total} correct</span>
                  {(d.percent ?? 0) < 70 && (
                    <StartButton variant="link" size="xs" className="h-auto p-0" input={{ examId: result.examId, kind: 'practice', domains: [Number(d.id)], count: 10 }}>
                      Drill this <ArrowRight data-icon="inline-end" />
                    </StartButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <ReviewList items={result.items} attemptId={result.id} aiTutor={result.aiTutor} />
    </div>
  );
}

/** The serif, ember-tinted words a headline leans on. */
function Accent({ children }: { children: React.ReactNode }) {
  return <span className={cn(serif.className, 'text-ember pr-1 font-normal tracking-[-0.01em]')}>{children}</span>;
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-wash px-3 py-2.5">
      <dt className="flex items-center gap-1 text-[0.7rem] text-muted-foreground"><Icon className="size-3" />{label}</dt>
      <dd className="font-heading text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function NextStep({ result, weakest, wrong }: { result: ResultState; weakest: { id: number; name: string; percent: number | null } | null; wrong: number }) {
  const scored = KINDS[result.kind].scored;
  let title: string;
  let body: string;
  let action: React.ReactNode;

  if (result.certificateId) {
    title = 'Your readiness certificate is ready';
    body = 'Share it, or push further with a harder difficulty.';
    action = <Button asChild variant="premium" size="xl"><Link href={`/certificates/${result.certificateId}`}><Award data-icon="inline-start" />View certificate</Link></Button>;
  } else if (scored && result.summary.passed && !result.certificateEligibleMode) {
    title = 'Ready for the real thing?';
    body = 'Sit the full mock at exam-realistic difficulty to earn your readiness certificate.';
    action = <StartButton variant="premium" size="xl" input={{ examId: result.examId, kind: 'full', difficulty: 'standard' }}>Start full mock <ArrowRight data-icon="inline-end" /></StartButton>;
  } else if (weakest) {
    title = `Next: strengthen ${weakest.name}`;
    body = `You scored ${weakest.percent ?? 0}% here. A 10-question drill with explanations is the fastest way up.`;
    action = <StartButton variant="premium" size="xl" input={{ examId: result.examId, kind: 'practice', domains: [Number(weakest.id)], count: 10 }}><TrendingUp data-icon="inline-start" />Drill {weakest.name.split(' ')[0]}</StartButton>;
  } else if (wrong > 0) {
    title = 'Lock in what you missed';
    body = `Retry the ${wrong} question${wrong === 1 ? '' : 's'} you got wrong while the explanations are fresh.`;
    action = <StartButton variant="premium" size="xl" input={{ examId: result.examId, kind: 'mistakes', count: Math.min(wrong, 30) }}><RotateCcw data-icon="inline-start" />Retry mistakes</StartButton>;
  } else {
    title = 'Flawless. Time to raise the bar';
    body = 'Try a timed mock at a harder difficulty.';
    action = <StartButton variant="premium" size="xl" input={{ examId: result.examId, kind: 'quick', difficulty: 'hard' }}>Start a harder mock <ArrowRight data-icon="inline-end" /></StartButton>;
  }

  return (
    <section className="glass relative flex flex-col items-stretch justify-between gap-5 overflow-hidden rounded-[1.75rem] border-primary/25 p-6 sm:p-7 lg:flex-row lg:items-center">
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase"><MascotMark className="size-5" /> Recommended next step</p>
        <h2 className="mt-3 font-heading text-xl font-semibold tracking-[-0.02em] text-balance sm:text-2xl">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      </div>
      {/* Stacked, full-width buttons on phones; a row from sm. */}
      <div className="relative flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
        {action}
        {scored && result.kind !== 'adaptive' && <ChallengeButton attemptId={result.id} examCode={result.examCode} />}
        <Button asChild variant="ghost" size="xl"><Link href={`/exams/${result.examId}`}>Back to exam</Link></Button>
      </div>
    </section>
  );
}
