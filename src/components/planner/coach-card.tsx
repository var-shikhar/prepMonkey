'use client';

import { useQuery } from '@tanstack/react-query';
import { Lightbulb, MessageSquareQuote, Target, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { GoalCoach } from '@/db/schema';

/** The AI coach's review of the last sprint. A pending review is written on first view. */
export function CoachCard({ planId, coach }: { planId: string; coach: GoalCoach }) {
  const written = useQuery({
    queryKey: ['plan-coach', planId, coach.attemptId],
    queryFn: () => api.post<{ coach: GoalCoach | null }>(`/api/planner/${planId}/coach`).then((r) => r.coach),
    enabled: coach.status === 'pending',
    staleTime: Infinity,
    retry: false,
  });
  const current = coach.status === 'pending' ? written.data : coach;
  if (coach.status === 'pending' && written.isPending) {
    return (
      <section className="glass space-y-3 rounded-3xl p-5 sm:p-6" aria-busy>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"><MessageSquareQuote className="size-4 text-primary" /> Coach · Sprint {coach.sprint}</p>
        <p className="text-sm text-muted-foreground">Reviewing your sprint…</p>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </section>
    );
  }
  const review = current?.status === 'ready' ? current.review : undefined;
  if (!review) return null;

  return (
    <section className="glass space-y-4 rounded-3xl border-primary/25 p-5 sm:p-6">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"><MessageSquareQuote className="size-4 text-primary" /> Coach · Sprint {coach.sprint} review</p>
        <h2 className="mt-2 font-heading text-lg font-semibold tracking-[-0.02em] text-balance">{review.headline}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {review.wentWell.length > 0 && (
          <div>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold"><ThumbsUp className="size-3.5 text-success" /> Went well</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{review.wentWell.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}
        <div>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold"><Target className="size-3.5 text-primary" /> Focus next</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{review.focus.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
      </div>
      <p className="flex gap-2 rounded-2xl border border-hairline bg-wash p-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />{review.tip}</p>
      <p className="text-xs text-muted-foreground">Written by AI from your sprint results.</p>
    </section>
  );
}
