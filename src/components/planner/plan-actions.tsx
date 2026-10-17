'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarClock, CalendarPlus, Ellipsis, Pause, Play, Scissors, Trash2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDay, type RecoveryOption } from '@/lib/goal-plan';
import type { RecoveryPreview } from '@/server/goal-plan';

const fail = (err: unknown) => toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');

const OPTIONS: Record<RecoveryOption, { icon: typeof CalendarPlus; title: string }> = {
  push: { icon: CalendarPlus, title: 'Move the finish date' },
  catch_up: { icon: Zap, title: 'Catch up, keep the date' },
  trim: { icon: Scissors, title: 'Trim practice, keep the date' },
};

function describe(o: RecoveryPreview, targetDate: string) {
  if (o.option === 'push') {
    return o.finish && o.finish > targetDate
      ? `Keep every task and your usual daily time. You'd finish on ${formatDay(o.finish)} instead of ${formatDay(targetDate)}.`
      : `Keep every task and your usual daily time. You'd still finish by ${formatDay(targetDate)}.`;
  }
  if (o.option === 'catch_up') {
    return o.feasible
      ? `Keep every task and ${formatDay(targetDate)}. Study days get about ${o.extraMinutesPerDay} minutes longer until you're caught up.`
      : `Even doubling your study time wouldn't fit everything before ${formatDay(targetDate)}.`;
  }
  return o.feasible
    ? o.dropped.count
      ? `Keep your daily time and ${formatDay(targetDate)}. ${o.dropped.count} lower-value practice task${o.dropped.count === 1 ? '' : 's'} (${o.dropped.minutes} min) are skipped; mocks and reviews stay.`
      : 'Everything already fits. Nothing needs to be cut.'
    : `Cutting up to half of the practice still wouldn't fit before ${formatDay(targetDate)}.`;
}

/** "Get back on track": previews each recovery and applies the one the learner picks. */
export function RecoveryButton({ planId, targetDate, size = 'sm', variant = 'outline' }: { planId: string; targetDate: string; size?: 'sm' | 'xl'; variant?: 'outline' | 'premium' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<RecoveryOption | null>(null);
  const options = useQuery({
    queryKey: ['plan-recovery', planId],
    queryFn: ({ signal }) => api.get<{ options: RecoveryPreview[] }>(`/api/planner/${planId}/recovery`, { signal }),
    enabled: open,
    staleTime: 0,
  });
  const apply = useMutation({
    mutationFn: (option: RecoveryOption) => api.post(`/api/planner/${planId}/recovery`, { option }),
    onSuccess: () => { setOpen(false); toast.success('Plan updated.'); router.refresh(); },
    onError: fail,
  });

  return (
    <>
      <Button size={size} variant={variant} onClick={() => { setChoice(null); setOpen(true); }}>Get back on track</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose how to recover</DialogTitle>
            <DialogDescription>Nothing changes until you confirm. Each option shows what it does to your plan.</DialogDescription>
          </DialogHeader>
          {options.isPending ? (
            <div className="grid place-items-center py-10"><Spinner /></div>
          ) : options.isError ? (
            <p className="text-sm text-destructive">Could not load the options. Close this and try again.</p>
          ) : (
            <div className="grid gap-2.5">
              {options.data.options.map((o) => {
                const { icon: Icon, title } = OPTIONS[o.option];
                return (
                  <button
                    key={o.option}
                    type="button"
                    disabled={!o.feasible}
                    aria-pressed={choice === o.option}
                    onClick={() => setChoice(o.option)}
                    className={cn(
                      'glass flex gap-3 rounded-2xl p-4 text-left transition-all hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
                      choice === o.option && 'border-primary bg-primary/[0.06] shadow-[0_0_0_1px_var(--primary)]',
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-4" /></span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{title}</span>
                      <span className="block text-sm text-muted-foreground">{describe(o, targetDate)}</span>
                      {o.option === 'trim' && o.feasible && o.dropped.labels.length > 0 && (
                        <span className="mt-1.5 block text-xs text-muted-foreground">Skips: {o.dropped.labels.join(' · ')}{o.dropped.count > o.dropped.labels.length ? ' …' : ''}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
            <Button variant="premium" disabled={!choice || apply.isPending} onClick={() => choice && apply.mutate(choice)}>
              {apply.isPending && <Spinner />}Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function useStateAction(planId: string, success: string) {
  const router = useRouter();
  return useMutation({
    mutationFn: (body: { action: 'pause' | 'resume' | 'drop'; until?: string | null }) => api.post(`/api/planner/${planId}/state`, body),
    onSuccess: () => { toast.success(success); router.refresh(); },
    onError: fail,
  });
}

export function ResumeButton({ planId, size = 'sm' }: { planId: string; size?: 'sm' | 'xl' }) {
  const resume = useStateAction(planId, 'Welcome back. Your plan picks up today.');
  return (
    <Button size={size} variant="premium" onClick={() => resume.mutate({ action: 'resume' })} disabled={resume.isPending}>
      {resume.isPending ? <Spinner /> : <Play data-icon="inline-start" />}Resume plan
    </Button>
  );
}

/** Pause, take a break until a date, or drop the plan. */
export function PlanMenu({ planId, active, today }: { planId: string; active: boolean; today: string }) {
  const pause = useStateAction(planId, 'Plan paused. Nothing counts as missed while it is.');
  const drop = useStateAction(planId, 'Plan dropped.');
  const [breakOpen, setBreakOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [until, setUntil] = useState('');
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-lg" aria-label="Plan options"><Ellipsis /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {active && <DropdownMenuItem onSelect={() => pause.mutate({ action: 'pause' })}><Pause /> Pause plan</DropdownMenuItem>}
          {active && <DropdownMenuItem onSelect={() => setBreakOpen(true)}><CalendarClock /> Take a break until…</DropdownMenuItem>}
          {active && <DropdownMenuSeparator />}
          <DropdownMenuItem variant="destructive" onSelect={() => setDropOpen(true)}><Trash2 /> Drop plan</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={breakOpen} onOpenChange={setBreakOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Take a break</DialogTitle>
            <DialogDescription>The plan pauses now and picks up by itself on the day you choose. Your finish date moves only if it has to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="break-until">Back on</Label>
            <Input id="break-until" type="date" min={today} value={until} onChange={(e) => setUntil(e.target.value)} className="h-11" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBreakOpen(false)}>Cancel</Button>
            <Button
              variant="premium"
              disabled={!until || until <= today || pause.isPending}
              onClick={() => pause.mutate({ action: 'pause', until }, { onSuccess: () => setBreakOpen(false) })}
            >
              {pause.isPending && <Spinner />}Start break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dropOpen} onOpenChange={setDropOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop this plan?</AlertDialogTitle>
            <AlertDialogDescription>Your practice history and scores stay. The plan and its schedule are closed, and you can build a new one.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => drop.mutate({ action: 'drop' }, { onSuccess: () => router.push('/planner') })}
            >
              Drop plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DismissNotice({ planId }: { planId: string }) {
  const router = useRouter();
  const dismiss = useMutation({ mutationFn: () => api.delete(`/api/planner/${planId}/notice`), onSuccess: () => router.refresh() });
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={() => dismiss.mutate()} disabled={dismiss.isPending}>
      {dismiss.isPending ? <Spinner /> : <X />}
    </Button>
  );
}
