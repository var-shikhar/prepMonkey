'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { BookOpen, Check } from 'lucide-react';
import { toast } from 'sonner';
import { StartButton } from '@/components/results/start-button';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { GoalTaskView } from '@/server/goal-plan';

type Size = 'sm' | 'xl';
type Variant = 'outline' | 'premium';

/** Starts whatever a plan task needs; the attempt carries the task id, so finishing it ticks the task off. */
export function GoalTaskButton({ task, due, size = 'sm', variant = 'outline', label = 'Start' }: {
  task: GoalTaskView; due: number; size?: Size; variant?: Variant; label?: string;
}) {
  const base = { examId: task.examId, planTaskId: task.id, role: task.role ?? undefined };
  switch (task.kind) {
    case 'reading':
      return <Button asChild size={size} variant={variant}><Link href={`/planner/read/${task.id}`}><BookOpen data-icon="inline-start" />Read</Link></Button>;
    case 'review':
      return due > 0
        ? <StartButton size={size} variant={variant} input={{ examId: task.examId, planTaskId: task.id, kind: 'review', count: Math.min(due, task.count ?? 15) }}>{label}</StartButton>
        : <CompleteTaskButton taskId={task.id} size={size}>Nothing due · tick off</CompleteTaskButton>;
    case 'drill':
      return <StartButton size={size} variant={variant} input={{ ...base, kind: 'practice', skills: task.skillId ? [task.skillId] : undefined, count: task.count ?? 15 }}>{label}</StartButton>;
    case 'mixed':
      return <StartButton size={size} variant={variant} input={{ ...base, kind: 'practice', count: task.count ?? 20 }}>{label}</StartButton>;
    case 'mini_mock':
      // Exams without a quick mock get a timed mixed drill instead.
      return task.count
        ? <StartButton size={size} variant={variant} input={{ ...base, kind: 'practice', count: task.count, timed: true }}>{label}</StartButton>
        : <StartButton size={size} variant={variant} input={{ ...base, kind: 'quick' }}>{label}</StartButton>;
    case 'full_mock':
      return <StartButton size={size} variant={variant} input={{ ...base, kind: 'full' }}>{label}</StartButton>;
  }
}

export function CompleteTaskButton({ taskId, size = 'sm', children }: { taskId: string; size?: Size; children: React.ReactNode }) {
  const router = useRouter();
  const done = useMutation({
    mutationFn: () => api.post(`/api/planner/tasks/${taskId}/complete`),
    onSuccess: () => router.refresh(),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update the task.'),
  });
  return (
    <Button size={size} variant="outline" onClick={() => done.mutate()} disabled={done.isPending}>
      {done.isPending ? <Spinner /> : <Check data-icon="inline-start" />}{children}
    </Button>
  );
}
