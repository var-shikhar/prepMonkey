import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ReadingNote } from '@/components/planner/reading-note';
import { getReadingTask } from '@/server/goal-plan';
import { requireUser } from '@/server/session';

export const metadata: Metadata = { title: 'Reading', robots: { index: false } };

export default async function PlanReadingPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const user = await requireUser(`/planner/read/${taskId}`);
  const found = await getReadingTask(user.id, taskId);
  if (!found) notFound();
  const { task, exam, skill, note } = found;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pt-5 pb-12 sm:px-6 sm:pt-8">
      <Link href="/planner" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to plan</Link>
      <ReadingNote
        taskId={task.id}
        done={task.status === 'done'}
        examId={exam.id}
        examCode={exam.code}
        skillId={skill.id}
        skillName={skill.name}
        role={task.role}
        initial={note}
      />
    </div>
  );
}
