'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, ArrowRight, Briefcase, CalendarCheck, Check, GraduationCap, Layers, Minus, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { api, ApiError } from '@/lib/api';
import { addDays, FAMILIARITY, formatDay, WEEKDAYS, weeklyMinutes, type Familiarity } from '@/lib/goal-plan';
import { ROLE_LEVELS } from '@/lib/role-levels';
import { cn } from '@/lib/utils';
import type { ExamCard } from '@/server/exams';
import type { PlanPreview } from '@/server/goal-plan';

type Focus = 'certification' | 'interview' | 'both';
interface SubjectChoice { familiarity: Familiarity; targetLevel: 1 | 2 | 3 | 4 | 5 | null }

const FOCUS: { key: Focus; icon: typeof GraduationCap; title: string; body: string }[] = [
  { key: 'certification', icon: GraduationCap, title: 'A certification', body: 'Pass a specific exam by a date.' },
  { key: 'interview', icon: Briefcase, title: 'Interviews', body: 'Get interview-ready in a set of subjects.' },
  { key: 'both', icon: Layers, title: 'Both', body: 'Certify and prepare for interviews together.' },
];

/** Interview tracks: suggested subject sets (only the ones that exist are offered). */
const TRACKS: { name: string; ids: string[] }[] = [
  { name: 'Frontend', ids: ['javascript', 'typescript', 'react', 'nextjs'] },
  { name: 'Backend', ids: ['nodejs', 'sql', 'system-design', 'docker'] },
  { name: 'DSA & coding', ids: ['dsa', 'python', 'concurrency'] },
  { name: 'DevOps', ids: ['docker', 'kubernetes', 'vcs'] },
];

const WEEK_PRESETS: { label: string; minutes: number[] }[] = [
  { label: '30 min weekdays, 60 at weekends', minutes: [60, 30, 30, 30, 30, 30, 60] },
  { label: '45 min every day', minutes: [45, 45, 45, 45, 45, 45, 45] },
  { label: '1 hour weekdays, weekends off', minutes: [0, 60, 60, 60, 60, 60, 0] },
  { label: 'Weekends only, 2 hours', minutes: [120, 0, 0, 0, 0, 0, 120] },
];

const STEPS = ['Goal', 'Subjects', 'Levels', 'Time', 'Review'];

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function SetupFlow({ exams, suggested, today }: { exams: ExamCard[]; suggested: Record<string, Familiarity>; today: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [targetDate, setTargetDate] = useState(addDays(today, 56));
  const [picked, setPicked] = useState<Record<string, SubjectChoice>>({});
  const [availability, setAvailability] = useState<number[]>(WEEK_PRESETS[0].minutes);
  const [startDate, setStartDate] = useState(today);
  const [name, setName] = useState('');

  const byId = useMemo(() => new Map(exams.map((e) => [e.id, e])), [exams]);
  const visible = exams.filter((e) => focus === 'both' || !focus || e.category === focus);
  const ids = Object.keys(picked);
  const defaultName = useMemo(() => {
    const track = TRACKS.find((t) => t.ids.filter((id) => byId.has(id)).every((id) => picked[id]) && ids.length);
    if (track && focus !== 'certification') return `${track.name} interview prep`;
    const codes = ids.map((id) => byId.get(id)?.code ?? id);
    return codes.length === 1 ? `${codes[0]} plan` : codes.length ? `${codes.slice(0, 3).join(' + ')}${codes.length > 3 ? ' + more' : ''} plan` : 'My plan';
  }, [ids, byId, picked, focus]);

  const toggle = (id: string) => setPicked((p) => {
    if (p[id]) { const { [id]: _, ...rest } = p; return rest; }
    if (Object.keys(p).length >= 8) { toast.info('Up to 8 subjects per plan.'); return p; }
    const ex = byId.get(id);
    return { ...p, [id]: { familiarity: suggested[id] ?? 'new', targetLevel: ex?.category === 'interview' ? 3 : null } };
  });
  const setPick = (id: string, patch: Partial<SubjectChoice>) => setPicked((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const setup = {
    name: (name || defaultName).slice(0, 80),
    subjects: ids.map((examId) => ({ examId, ...picked[examId] })),
    availability,
    startDate,
    targetDate,
  };
  const debounced = useDebounced(setup);
  const preview = useQuery({
    queryKey: ['plan-preview', debounced],
    queryFn: () => api.post<PlanPreview>('/api/planner/preview', debounced),
    enabled: step >= 3 && debounced.subjects.length > 0 && weeklyMinutes(debounced.availability) >= 15 && debounced.targetDate > debounced.startDate,
    placeholderData: (prev) => prev,
    retry: false,
  });

  const create = useMutation({
    mutationFn: () => api.post<{ id: string }>('/api/planner', setup),
    onSuccess: () => { toast.success('Your plan is ready.'); router.push('/planner'); router.refresh(); },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'UPGRADE') {
        toast.info(err.message, { action: { label: 'See Pro', onClick: () => router.push('/pricing') } });
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Could not create the plan.');
    },
  });

  const canContinue = [
    Boolean(focus) && targetDate > addDays(today, 6),
    ids.length > 0,
    true,
    availability.some((m) => m >= 15),
    true,
  ][step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 pt-6 pb-10 sm:px-6 sm:pt-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">New plan · {STEPS[step]}</p>
        <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span key={s} className={cn('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-8 bg-primary shadow-[0_0_10px_var(--primary)]' : i < step ? 'w-4 bg-primary/50' : 'w-4 bg-hairline-strong')} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-6"
        >
          {step === 0 && (
            <>
              <Heading title="What's the goal?" body="We'll build a day-by-day plan that gets you there, and adjust it if life gets in the way." />
              <div className="grid gap-3">
                {FOCUS.map((f) => (
                  <Choice key={f.key} selected={focus === f.key} onClick={() => setFocus(f.key)}>
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><f.icon className="size-5" /></span>
                    <span><span className="block font-semibold">{f.title}</span><span className="text-sm text-muted-foreground">{f.body}</span></span>
                  </Choice>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-date">Target date <span className="font-normal text-muted-foreground">(exam or interview day)</span></Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input id="target-date" type="date" value={targetDate} min={addDays(today, 7)} max={addDays(today, 365)} onChange={(e) => setTargetDate(e.target.value)} className="h-11 w-auto" />
                  {[4, 8, 12].map((w) => (
                    <Button key={w} type="button" variant="outline" size="sm" onClick={() => setTargetDate(addDays(today, w * 7))} aria-pressed={targetDate === addDays(today, w * 7)}>{w} weeks</Button>
                  ))}
                </div>
                {targetDate <= addDays(today, 6) && <p className="text-xs text-destructive">Give yourself at least a week.</p>}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Heading title="Which subjects?" body="Pick everything this goal needs. One plan keeps them all moving together." />
              {focus !== 'certification' && (
                <div className="flex flex-wrap gap-2">
                  {TRACKS.map((t) => {
                    const available = t.ids.filter((id) => byId.has(id));
                    if (!available.length) return null;
                    return (
                      <Button key={t.name} type="button" variant="outline" size="sm" onClick={() => available.forEach((id) => !picked[id] && toggle(id))}>
                        <Plus data-icon="inline-start" />{t.name}
                      </Button>
                    );
                  })}
                </div>
              )}
              {(['certification', 'interview'] as const).filter((c) => focus === 'both' || focus === c).map((cat) => (
                <div key={cat} className="space-y-2.5">
                  <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{cat === 'certification' ? 'Certifications' : 'Interview subjects'}</h3>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {visible.filter((e) => e.category === cat).map((e) => (
                      <Choice key={e.id} selected={Boolean(picked[e.id])} onClick={() => toggle(e.id)} compact>
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl font-mono text-[0.6rem] font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${e.meta.accent ?? '#ea7a1f'}, oklch(0.42 0.09 45))` }}>{e.code.split('-')[0].slice(0, 4)}</span>
                        <span className="min-w-0 pr-5"><span className="block truncate text-sm font-semibold">{e.title}</span><span className="text-xs text-muted-foreground">{e.questionCount} questions · {e.domainCount} areas</span></span>
                      </Choice>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <Heading title="Where are you now?" body="This sets how much practice each subject needs. Where you've practised here already, we've filled it in." />
              <div className="space-y-3">
                {ids.map((id) => {
                  const ex = byId.get(id)!;
                  const p = picked[id];
                  return (
                    <div key={id} className="glass space-y-3 rounded-3xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{ex.title}</p>
                        {suggested[id] && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="size-3 text-primary" />from your practice</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {FAMILIARITY.map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            aria-pressed={p.familiarity === f.key}
                            onClick={() => setPick(id, { familiarity: f.key })}
                            className={cn('rounded-2xl border border-hairline px-3 py-2 text-left transition hover:border-primary/40', p.familiarity === f.key && 'border-primary bg-primary/[0.06] shadow-[0_0_0_1px_var(--primary)]')}
                          >
                            <span className="block text-sm font-semibold">{f.label}</span>
                            <span className="block text-xs text-muted-foreground">{f.body}</span>
                          </button>
                        ))}
                      </div>
                      {ex.category === 'interview' && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Target level</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ROLE_LEVELS.map((r) => (
                              <button
                                key={r.level}
                                type="button"
                                aria-pressed={p.targetLevel === r.level}
                                onClick={() => setPick(id, { targetLevel: r.level })}
                                className={cn('rounded-full border border-hairline px-3 py-1 text-xs transition hover:border-primary/40', p.targetLevel === r.level && 'border-primary bg-primary text-primary-foreground')}
                                title={`${r.label} · ${r.years}`}
                              >
                                {r.code} · {r.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Heading title="How much time can you give?" body="Be honest: a plan you can keep beats an ambitious one you can't. Days at 0 are days off." />
              <div className="flex flex-wrap gap-2">
                {WEEK_PRESETS.map((p) => (
                  <Button key={p.label} type="button" variant="outline" size="sm" aria-pressed={p.minutes.join() === availability.join()} onClick={() => setAvailability(p.minutes)}>{p.label}</Button>
                ))}
              </div>
              <div className="glass divide-y divide-hairline rounded-3xl">
                {WEEKDAYS.map((w) => {
                  const m = availability[w.dow];
                  const set = (v: number) => setAvailability((a) => a.map((x, i) => (i === w.dow ? Math.max(0, Math.min(300, v)) : x)));
                  return (
                    <div key={w.dow} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-10 text-sm font-semibold">{w.short}</span>
                      <span className="flex-1 text-sm text-muted-foreground">{m ? `${m} min` : 'Day off'}</span>
                      <Button type="button" variant="outline" size="icon-sm" aria-label={`Less time on ${w.short}`} onClick={() => set(m - 15)} disabled={m === 0}><Minus /></Button>
                      <Button type="button" variant="outline" size="icon-sm" aria-label={`More time on ${w.short}`} onClick={() => set(m + 15)} disabled={m >= 300}><Plus /></Button>
                    </div>
                  );
                })}
              </div>
              <Estimate preview={preview.data} loading={preview.isFetching} error={preview.error} targetDate={targetDate} weekly={weeklyMinutes(availability)} />
            </>
          )}

          {step === 4 && (
            <>
              <Heading title="Your plan" body="Check it over. Nothing is final: the plan adapts as you go." />
              <div className="space-y-1.5">
                <Label htmlFor="plan-name">Plan name</Label>
                <Input id="plan-name" value={name} placeholder={defaultName} maxLength={80} onChange={(e) => setName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Start</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" aria-pressed={startDate === today} onClick={() => setStartDate(today)}>Today</Button>
                  <Button type="button" size="sm" variant="outline" aria-pressed={startDate === addDays(today, 1)} onClick={() => setStartDate(addDays(today, 1))}>Tomorrow</Button>
                  <Input type="date" aria-label="Custom start date" value={startDate} min={today} max={addDays(targetDate, -7)} onChange={(e) => e.target.value && setStartDate(e.target.value)} className="h-8 w-auto" />
                </div>
              </div>
              <Estimate preview={preview.data} loading={preview.isFetching} error={preview.error} targetDate={targetDate} weekly={weeklyMinutes(availability)} />
              {preview.data && (
                <ol className="space-y-2">
                  {preview.data.sprints.map((s) => (
                    <li key={s.index} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">{s.index}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{s.theme}</span>
                        <span className="block text-xs text-muted-foreground">{formatDay(s.from)} – {formatDay(s.to)} · ~{Math.round(s.minutes / 6) / 10}h</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="mt-10 flex items-center justify-between gap-3 border-t border-hairline pt-5">
        <Button variant="ghost" size="xl" onClick={() => (step === 0 ? router.push('/planner') : setStep((s) => s - 1))}>
          <ArrowLeft data-icon="inline-start" />{step === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          variant="premium"
          size="xl"
          disabled={!canContinue || create.isPending || (isLast && !preview.data)}
          onClick={() => (isLast ? create.mutate() : setStep((s) => s + 1))}
        >
          {create.isPending && <Spinner />}
          {isLast ? 'Start my plan' : 'Continue'}
          {!create.isPending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </footer>
    </div>
  );
}

function Estimate({ preview, loading, error, targetDate, weekly }: { preview: PlanPreview | undefined; loading: boolean; error: unknown; targetDate: string; weekly: number }) {
  if (error && !preview) return <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Could not estimate the plan.'}</p>;
  if (!preview) return <div className="glass grid place-items-center rounded-3xl p-6"><Spinner /></div>;
  return (
    <div className={cn('glass flex items-start gap-4 rounded-3xl p-5 transition-opacity', loading && 'opacity-60', !preview.fits && 'border-warning/40')}>
      <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl border', preview.fits ? 'border-success/30 bg-success/10 text-success' : 'border-warning/40 bg-warning/10 text-warning')}>
        {preview.fits ? <CalendarCheck className="size-5" /> : <AlertTriangle className="size-5" />}
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-heading text-lg font-semibold">
          {preview.fits ? `Ready by ${formatDay(targetDate)}` : `Estimated finish ${preview.finish ? formatDay(preview.finish) : '–'}`}
        </p>
        <p className="text-muted-foreground">
          ~{Math.round(preview.totalMinutes / 60)} hours over {preview.sprints.length} weekly sprint{preview.sprints.length === 1 ? '' : 's'} at {Math.round(weekly / 6) / 10}h a week.
          {preview.fits
            ? ' Spare time before the date goes to mixed practice and mocks.'
            : preview.neededWeekly
              ? ` That's after your target. About ${Math.round(preview.neededWeekly / 6) / 10}h a week would make it, or move the date.`
              : ' That is well after your target: add time, move the date, or pick fewer subjects.'}
        </p>
      </div>
    </div>
  );
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
    </div>
  );
}

function Choice({ selected, onClick, children, compact }: { selected: boolean; onClick: () => void; children: React.ReactNode; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'glass relative flex items-center gap-4 text-left transition-all hover:border-primary/40',
        compact ? 'gap-3 rounded-2xl p-3' : 'rounded-3xl p-4',
        selected && 'border-primary bg-primary/[0.06] shadow-[0_0_0_1px_var(--primary)]',
      )}
    >
      {children}
      {selected && (
        <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground animate-pop">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
}
