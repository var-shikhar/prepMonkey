'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, Check, Lightbulb, Sparkles, Zap } from 'lucide-react';
import { RichText } from '@/components/player/rich-text';
import { StartButton } from '@/components/results/start-button';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { StudyNote } from '@/db/schema';
import { CompleteTaskButton } from './goal-task-button';

/** A plan's reading task: the skill's notes (written by AI on first use when none exist), then tick it off. */
export function ReadingNote({ taskId, done, examId, examCode, skillId, skillName, role, initial }: {
  taskId: string; done: boolean; examId: string; examCode: string; skillId: string; skillName: string; role: number | null; initial: StudyNote | null;
}) {
  const generated = useQuery({
    queryKey: ['plan-note', taskId],
    queryFn: () => api.post<{ note: StudyNote }>(`/api/planner/tasks/${taskId}/note`).then((r) => r.note),
    enabled: !initial,
    staleTime: Infinity,
    retry: false,
  });
  const note = initial ?? generated.data;

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" /> Reading · {examCode}</p>
        <h1 className="text-[2rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">{skillName}</h1>
        {note && <p className="text-lg text-muted-foreground">{note.summary}</p>}
        {note?.source === 'ai' && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-primary" />AI-generated notes, not yet reviewed by our editors. Check anything important against the official docs.</p>
        )}
      </header>

      {!note && (generated.isError ? (
        <div className="glass rounded-3xl p-5 text-sm">
          <p className="font-semibold">Notes for this topic aren&apos;t available yet</p>
          <p className="mt-1 text-muted-foreground">{generated.error instanceof Error ? generated.error.message : 'Please try again later.'} You can still drill the topic below and tick this off.</p>
        </div>
      ) : (
        <div className="glass flex items-center gap-3 rounded-3xl p-5 text-sm text-muted-foreground"><Spinner /> Writing notes for {skillName}… this takes a few seconds the first time.</div>
      ))}

      {note && (
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
      )}

      {note?.traps && note.traps.length > 0 && (
        <section className="glass space-y-3 rounded-3xl border-warning/40 bg-warning/10 p-5">
          <h2 className="font-semibold">Common traps</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">{note.traps.map((t, i) => <li key={i}><RichText text={t} /></li>)}</ul>
        </section>
      )}

      <section className="glass flex flex-col items-stretch justify-between gap-4 rounded-[1.75rem] border-primary/25 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">{done ? 'Read. Nice.' : 'Finished reading?'}</h2>
          <p className="text-sm text-muted-foreground">Tick it off, or check yourself with ten questions first.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StartButton variant="outline" size="xl" input={{ examId, kind: 'practice', skills: [skillId], count: 10, role: role ?? undefined }}><Zap data-icon="inline-start" />Quick check</StartButton>
          {done
            ? <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 text-sm font-medium text-success"><Check className="size-4" />Done</span>
            : <CompleteTaskButton taskId={taskId} size="xl">Mark as read</CompleteTaskButton>}
        </div>
      </section>
    </article>
  );
}
