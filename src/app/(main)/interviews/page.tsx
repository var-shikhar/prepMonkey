import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, KeyRound } from 'lucide-react';
import { Reveal } from '@/components/common/reveal';
import { InterviewSetup } from '@/components/interviews/interview-setup';
import { PageHeader } from '@/components/layout/page-header';
import { focusLabel, levelLabel, roleLabel } from '@/lib/interview-presets';
import { cn } from '@/lib/utils';
import { aiEnabled } from '@/server/ai/client';
import { listInterviews } from '@/server/ai/interviews';
import { getUser, isStaff } from '@/server/session';

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
        <div className="glass rounded-3xl border-dashed p-8 text-center">
          <KeyRound className="mx-auto size-9 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Interviews are almost ready</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {isStaff(user)
              ? 'Add OPENAI_API_KEY (plus OPENAI_BASE_URL for a LiteLLM proxy, and AI_MODEL) to .env and restart the server to switch them on.'
              : 'AI interviews switch on shortly. In the meantime, sharpen up with a drill.'}
          </p>
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
