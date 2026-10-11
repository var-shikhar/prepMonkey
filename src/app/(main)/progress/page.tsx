import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, ChevronRight, Compass } from 'lucide-react';
import { MascotMark } from '@/components/brand/mascot';
import { MasteryBars } from '@/components/charts/mastery-bars';
import { ScoreTrend } from '@/components/charts/score-trend';
import { LinkPending } from '@/components/common/link-pending';
import { Reveal } from '@/components/common/reveal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KINDS } from '@/lib/attempt-kinds';
import { serif } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { getProgressData } from '@/server/analytics';
import { listAttempts } from '@/server/attempts';
import { requireUser } from '@/server/session';
import { BadgeGrid, Leaderboard } from '@/components/achievements/achievements';
import { listBadges, weeklyLeaderboard } from '@/server/gamification';
import { getOrCreateProfile } from '@/server/profile';

export const metadata: Metadata = { title: 'Progress' };

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ exam?: string; tab?: string }> }) {
  const { exam: examParam, tab } = await searchParams;
  const user = await requireUser('/progress');
  const data = await getProgressData(user.id, examParam);
  const [history, badges, board, profile] = await Promise.all([
    listAttempts(user.id, { examId: data.examId ?? undefined, limit: 100 }),
    listBadges(user.id),
    weeklyLeaderboard(user.id),
    getOrCreateProfile(user.id),
  ]);
  const current = data.exams.find((e) => e.id === data.examId);
  const defaultTab = tab === 'history' || tab === 'certificates' || tab === 'achievements' ? tab : 'overview';

  if (!data.exams.length && !data.certificates.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="glass rounded-[1.75rem] p-8 text-center sm:p-12">
        <MascotMark className="mx-auto size-16" />
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Your progress <Accent>lives here.</Accent></h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Scores, trends and skill mastery appear after your first drill or mock. The diagnostic is the quickest start.</p>
        <Button asChild variant="premium" size="xl" className="mt-7 w-full sm:w-auto"><Link href="/explore"><Compass data-icon="inline-start" />Pick an exam</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-6 pb-12 sm:space-y-8 sm:px-6 sm:pt-10">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{current ? current.code : 'All exams'}</p>
          <h1 className="mt-2 text-[2.1rem] leading-[1.05] font-semibold tracking-[-0.04em] sm:text-5xl">Your <Accent>progress.</Accent></h1>
          {current && <p className="mt-2 text-muted-foreground">{current.title}</p>}
        </div>
      </Reveal>

      {/* one filter row, above everything it scopes */}
      {data.exams.length > 1 && (
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {data.exams.map((e) => (
            <Link
              key={e.id}
              href={`/progress?exam=${e.id}${tab ? `&tab=${tab}` : ''}`}
              className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', e.id === data.examId ? 'border-primary bg-primary text-primary-foreground' : 'border-hairline-strong bg-wash hover:border-primary/40')}
            >
              <LinkPending>{e.code}</LinkPending>
            </Link>
          ))}
        </div>
      )}

      {/* Keyed so a link to another ?tab= (e.g. the user menu's Certificates) switches tabs while already here. */}
      <Tabs key={defaultTab} defaultValue={defaultTab} className="gap-6">
        {/* Scrolls sideways on narrow phones rather than squeezing four tabs. */}
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="glass h-auto w-max rounded-full p-1">
            <TabsTrigger value="overview" className="rounded-full px-3 py-1.5 data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground">Overview</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full px-3 py-1.5 data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground">History</TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-full px-3 py-1.5 data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground">Certificates{data.certificates.length ? ` · ${data.certificates.length}` : ''}</TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-full px-3 py-1.5 data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground">Achievements</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Readiness" value={data.readiness?.readiness != null ? `${data.readiness.readiness}%` : '—'} hint={data.readiness?.predictedScaled != null ? `predicted ${data.readiness.predictedScaled}` : 'answer a few questions'} />
            <Tile label="Best mock" value={data.stats.best != null ? String(data.stats.best) : '—'} hint={data.scale ? `pass mark ${data.scale.passing}` : ''} />
            <Tile label="Questions answered" value={data.stats.answered.toLocaleString()} hint={`${data.stats.mocks} mock${data.stats.mocks === 1 ? '' : 's'} taken`} />
            <Tile label="Accuracy, last 30 days" value={data.stats.accuracy30 != null ? `${data.stats.accuracy30}%` : '—'} hint="across drills and mocks" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="glass min-w-0 rounded-3xl p-5">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Mock score trend</h2>
              <p className="mb-4 text-xs text-muted-foreground">Scaled score of each mock and diagnostic{current ? ` for ${current.code}` : ''}.</p>
              {data.trend.length && data.scale ? (
                <ScoreTrend points={data.trend} min={data.scale.min} max={data.scale.max} passing={data.scale.passing} title={`Mock score trend${current ? ` for ${current.code}` : ''}`} />
              ) : (
                <p className="rounded-2xl border border-dashed border-hairline-strong p-8 text-center text-sm text-muted-foreground">Take a diagnostic or a mock to start your trend line.</p>
              )}
            </section>
            <section className="glass min-w-0 rounded-3xl p-5">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Skill mastery</h2>
              <p className="mb-4 text-xs text-muted-foreground">Weakest first. Recent answers count most.</p>
              {data.readiness?.answered ? (
                <MasteryBars skills={data.readiness.skills} />
              ) : (
                <p className="rounded-2xl border border-dashed border-hairline-strong p-8 text-center text-sm text-muted-foreground">No answers yet for this exam.</p>
              )}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {history.length === 0 ? (
            <p className="glass rounded-3xl border-dashed p-10 text-center text-sm text-muted-foreground">No finished attempts yet.</p>
          ) : (
            <ul className="glass divide-y divide-hairline overflow-hidden rounded-3xl">
              {history.map((a) => (
                <li key={a.id}>
                  <Link href={`/attempt/${a.id}/result`} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-wash sm:px-5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{a.examCode} · {KINDS[a.kind].label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(a.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · {a.correctCount ?? 0}/{a.itemCount} correct
                      </span>
                    </span>
                    <span className={cn('rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums', a.passed ? 'bg-success/12 text-success' : 'bg-wash')}>
                      {KINDS[a.kind].scored && a.scaled != null ? a.scaled : `${a.itemCount ? Math.round(((a.correctCount ?? 0) / a.itemCount) * 100) : 0}%`}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="certificates">
          {data.certificates.length === 0 ? (
            <div className="glass rounded-3xl border-dashed p-10 text-center">
              <Award className="mx-auto size-10 text-primary" />
              <p className="mt-3 font-medium">No certificates yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Pass a full mock at exam-realistic difficulty or harder to earn a verifiable readiness certificate.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.certificates.map((c) => (
                <Link key={c.id} href={`/certificates/${c.id}`} className="glass group relative overflow-hidden rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                  <div aria-hidden className="absolute -top-10 -right-10 size-32 rounded-full bg-primary/20 blur-2xl" />
                  <Award className="size-7 text-primary" />
                  <div className="mt-3 text-xs font-semibold text-muted-foreground">{c.examCode}</div>
                  <div className="font-semibold">{c.examTitle}</div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-heading text-xl font-bold">{c.scaled}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.issuedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="achievements" className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <BadgeGrid badges={badges} />
          <Leaderboard top={board.top} me={board.me} optedIn={profile.leaderboardOptIn} anonymous={Boolean(user.isAnonymous)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** The serif, ember-tinted words a headline leans on. */
function Accent({ children }: { children: React.ReactNode }) {
  return <span className={cn(serif.className, 'text-ember pr-1 font-normal tracking-[-0.01em]')}>{children}</span>;
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-[1.7rem] font-semibold tracking-[-0.03em] tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
