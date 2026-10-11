import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Lightbulb, Zap } from 'lucide-react';
import { Reveal } from '@/components/common/reveal';
import { RichText } from '@/components/player/rich-text';
import { StartButton } from '@/components/results/start-button';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { breadcrumbLd, clip, graph, studyNoteLd } from '@/lib/seo';
import { getReadiness } from '@/server/analytics';
import { getExam, getStudyNotes } from '@/server/exams';
import { getUser } from '@/server/session';

/** The exam, skill and note, or null when any is missing or the exam isn't published. Cached catalogue reads. */
async function loadNote(examId: string, skillId: string) {
  const ex = await getExam(examId);
  if (!ex?.isPublished) return null;
  const notes = await getStudyNotes(ex.id);
  const note = notes[skillId];
  const skill = ex.config.skills.find((s) => s.id === skillId);
  return note && skill ? { ex, notes, note, skill } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ examId: string; skillId: string }> }): Promise<Metadata> {
  const { examId, skillId } = await params;
  const found = await loadNote(examId, skillId);
  if (!found) return { title: 'Study notes not found', robots: { index: false } };
  const { ex, note, skill } = found;
  const title = `${skill.name}: ${ex.code} study notes`;
  const description = clip(note.summary);
  const path = `/exams/${ex.id}/study/${skill.id}`;
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: 'article' } };
}

export default async function StudyNotePage({ params }: { params: Promise<{ examId: string; skillId: string }> }) {
  const { examId, skillId } = await params;
  const found = await loadNote(examId, skillId);
  if (!found) notFound(); // before anything streams, so missing notes get a real 404
  const { ex, notes, note, skill } = found;
  const domain = ex.config.domains.find((d) => d.id === skill.domain);
  const ordered = ex.config.skills.filter((s) => notes[s.id]);
  const index = ordered.findIndex((s) => s.id === skillId);
  const prev = ordered[index - 1];
  const next = ordered[index + 1];
  const path = `/exams/${ex.id}/study/${skill.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 pt-5 pb-12 sm:space-y-12 sm:px-6 sm:pt-8">
      <JsonLd data={graph(
        studyNoteLd(ex, skill, note.summary),
        breadcrumbLd([{ name: 'Explore', path: '/explore' }, { name: ex.code, path: `/exams/${ex.id}` }, { name: skill.name, path }]),
      )} />

      <Reveal className="space-y-4">
        <Breadcrumbs items={[{ name: ex.code, href: `/exams/${ex.id}` }, ...(domain ? [{ name: domain.name }] : [])]} />
        <div className="flex items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" /> Study notes · {skill.weight}% of the exam</div>
        <h1 className="text-[2rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">{skill.name}</h1>
        <p className="text-lg text-muted-foreground">{note.summary}</p>
        <Suspense fallback={null}>
          <YourMastery examId={ex.id} skillId={skill.id} />
        </Suspense>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold tracking-[-0.02em]"><Lightbulb className="size-5 text-primary" /> Key points</h2>
          <ol className="space-y-3">
            {note.points.map((p, i) => (
              <li key={i} className="glass flex gap-4 rounded-3xl p-4 sm:p-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-heading text-sm font-semibold text-primary">{i + 1}</span>
                <RichText text={p} className="text-[0.95rem]" />
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      {note.traps && note.traps.length > 0 && (
        <Reveal>
          <section className="glass space-y-3 rounded-3xl border-warning/40 bg-warning/10 p-5">
            <h2 className="font-semibold">Common traps</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">{note.traps.map((t, i) => <li key={i}><RichText text={t} /></li>)}</ul>
          </section>
        </Reveal>
      )}

      {note.docs && note.docs.length > 0 && (
        <Reveal>
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Read the source</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {note.docs.map((d) => (
                <li key={d.url}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm transition-colors hover:border-primary/40">
                    <span className="font-medium">{d.title}</span>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="glass flex flex-col items-stretch justify-between gap-4 rounded-[1.75rem] border-primary/25 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Test yourself on {skill.name}</h2>
            <p className="text-sm text-muted-foreground">Ten questions, with the answer and explanation after each one.</p>
          </div>
          <Suspense fallback={<Button variant="premium" size="xl" disabled><Zap data-icon="inline-start" />Start drill</Button>}>
            <DrillAction examId={ex.id} skillId={skill.id} />
          </Suspense>
        </section>
      </Reveal>

      <nav aria-label="More study notes" className="flex items-center justify-between gap-3 border-t border-hairline pt-6 text-sm">
        {prev ? (
          <Link href={`/exams/${ex.id}/study/${prev.id}`} className="group flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" /><span><span className="block text-xs">Previous</span>{prev.name}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/exams/${ex.id}/study/${next.id}`} className="group flex items-center gap-2 text-right text-muted-foreground hover:text-foreground">
            <span><span className="block text-xs">Next</span>{next.name}</span><ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}

/** Signed-in only: how well the learner knows this skill. Streams in after the notes. */
async function YourMastery({ examId, skillId }: { examId: string; skillId: string }) {
  const user = await getUser();
  if (!user) return null;
  const mastery = (await getReadiness(user.id, examId))?.skills.find((s) => s.skillId === skillId);
  if (!mastery || mastery.answered === 0) return null;
  return <p className="text-sm text-muted-foreground">Your mastery: <b className="text-foreground">{Math.round(mastery.mastery * 100)}%</b> from {mastery.answered} answers.</p>;
}

async function DrillAction({ examId, skillId }: { examId: string; skillId: string }) {
  const user = await getUser();
  return user ? (
    <StartButton variant="premium" size="xl" input={{ examId, kind: 'practice', skills: [skillId], count: 10 }}><Zap data-icon="inline-start" />Start drill</StartButton>
  ) : (
    <Button asChild variant="premium" size="xl"><Link href={`/sign-up?next=/exams/${examId}/study/${skillId}`}>Sign up to practise</Link></Button>
  );
}
