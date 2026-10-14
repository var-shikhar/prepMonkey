import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/common/reveal';
import { InterviewSetup } from '@/components/interviews/interview-setup';
import { PageHeader } from '@/components/layout/page-header';
import { focusLabel, levelLabel, roleLabel } from '@/lib/interview-presets';
import { cn } from '@/lib/utils';
import { aiEnabled } from '@/server/ai/client';
import { listInterviews } from '@/server/ai/interviews';
import { getUser } from '@/server/session';

export const metadata: Metadata = {
  title: 'AI mock interviews',
  description: 'An AI interviewer asks one question at a time, follows up when an answer is thin, and scores you against a clear rubric at the end.',
  alternates: { canonical: '/interviews' },
};

export default async function InterviewsPage() {
  const user = await getUser();
  // Visitors meet interviews on the landing page.
  if (!user) redirect('/#how-it-works');
  const enabled = aiEnabled();
  const past = user ? await listInterviews(user.id) : [];
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pt-6 pb-12 sm:space-y-10 sm:px-6 sm:pt-10">
      <PageHeader
        eyebrow="AI mock interviews"
        title="Practise the interview,"
        accent="not just the quiz."
        description="An AI interviewer asks one question at a time, follows up when an answer is thin, and scores you against a clear rubric at the end."
      />

      {!enabled ? (
        // Setup instructions for admins live on the admin Generate page; everyone here sees the same card.
        <div className="glass rounded-3xl border-dashed p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Sparkles className="size-6" /></span>
          <span className="mt-4 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Coming soon</span>
          <h2 className="mt-2 text-lg font-semibold">AI mock interviews are on their way</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            A live interviewer that asks real interview questions for your level, follows up, and scores you on a clear rubric.
            Until then, sharpen up with a drill.
          </p>
          <Button asChild variant="premium" className="mt-5"><Link href="/explore">Find a drill</Link></Button>
        </div>
      ) : (
        <Reveal delay={0.05}><InterviewSetup signedIn={Boolean(user)} /></Reveal>
      )}

      {past.length > 0 && (
        <Reveal delay={0.1}>
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Your interviews</h2>
            <ul className="glass divide-y divide-hairline overflow-hidden rounded-3xl">
              {past.map((i) => (
                <li key={i.id}>
                  <Link href={`/interviews/${i.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-wash">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{roleLabel(i.role)} · {levelLabel(i.level)} · {focusLabel(i.focus)}</span>
                      <span className="block text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {i.status === 'active' ? 'in progress' : i.status}</span>
                    </span>
                    <span className={cn('rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums', i.overall != null ? 'bg-wash' : 'bg-primary/10 text-primary')}>
                      {i.overall != null ? `${i.overall}/10` : i.status === 'active' ? 'Resume' : '—'}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}
    </div>
  );
}
