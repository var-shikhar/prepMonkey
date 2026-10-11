'use client';

import { useRef, useState } from 'react';
import {
  AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform,
  type MotionValue,
} from 'motion/react';
import { useReducedMotionSafe } from '@/lib/use-reduced-motion';
import { Check, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOMAINS = [
  { name: 'Agentic architecture', total: 14 },
  { name: 'Tool design & MCP', total: 10 },
  { name: 'Claude Code workflows', total: 11 },
  { name: 'Prompt engineering', total: 10 },
  { name: 'Context & reliability', total: 8 },
];

const OPTIONS = [
  'Raise the temperature so the model explores more answers.',
  'Send the batch through the Message Batches API overnight.',
  'Stream each response and cancel the slow ones.',
  'Split every document into single-sentence requests.',
];

const CAPTIONS = [
  { k: 'A real exam, in your browser.', d: 'The official blueprint, timer and scoring.' },
  { k: 'Every answer moves the needle.', d: 'Readiness and your predicted score update as you go.' },
  { k: 'Know exactly when to book.', d: 'Book the exam once the trend says you’re ready.' },
];

const CALLOUTS = [
  { at: 0.7, title: 'Blueprint-weighted', body: 'Questions drawn in the official proportions', className: 'top-[20%] -left-3 lg:-left-28 xl:-left-36' },
  { at: 0.76, title: 'Live readiness', body: 'Recalculated after every answer', className: 'top-[21%] -right-3 lg:-right-28 xl:-right-44' },
  { at: 0.82, title: 'Real scoring', body: 'Scaled 100–1000, pass mark 720', className: '-bottom-5 left-1/2 -translate-x-1/2' },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
const phase = (v: number, from: number, to: number) => (v - from) / (to - from);

/**
 * The hero's product moment, pinned and played by scrolling. The window tips
 * up flat, an answer is picked, the navigator fills, readiness and the predicted
 * score climb, then callouts point out what matters. Scrolling back rewinds it.
 * Under reduced motion it's a static, finished screenshot that doesn't pin.
 */
export function ProductSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 150, damping: 32, restDelta: 0.0005 });
  const done = useMotionValue(1);
  const p = reduce ? done : smooth;

  const rotateX = useTransform(p, [0, 0.2], [20, 0]);
  const scale = useTransform(p, [0, 0.2], [0.9, 1]);
  const ring = useTransform(p, [0.42, 0.72], [0.54, 0.78]);
  const spark = useTransform(p, [0.45, 0.75], [0, 1]);

  // Integer readouts only re-render when the number they show actually changes.
  const [v, setV] = useState(() => readouts(0));
  useMotionValueEvent(p, 'change', (x) => setV((prev) => {
    const next = readouts(x);
    return Object.keys(next).every((k) => next[k as keyof typeof next] === prev[k as keyof typeof prev]) ? prev : next;
  }));
  const r = reduce ? readouts(1) : v;

  return (
    <div ref={ref} className={cn('relative', !reduce && 'h-[260vh] lg:h-[320vh]')}>
      <div className={cn(!reduce && 'sticky top-14 flex h-[calc(100svh-3.5rem)] flex-col justify-center')}>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="relative mb-8 h-16 text-center sm:h-[4.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={r.caption}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <div className="font-heading text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{CAPTIONS[r.caption].k}</div>
                <div className="mt-1 text-sm text-muted-foreground sm:text-base">{CAPTIONS[r.caption].d}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative" style={{ perspective: '1600px' }}>
            <div aria-hidden className="absolute inset-x-[12%] top-[15%] bottom-0 rounded-full bg-primary/25 blur-[110px]" />
            <motion.div style={reduce ? undefined : { rotateX, scale, transformOrigin: '50% 0%' }} className="relative">
              <Window r={r} ring={ring} spark={spark} />
              {CALLOUTS.map((c) => <Callout key={c.title} {...c} p={p} />)}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function readouts(x: number) {
  const answered = Math.round(lerp(14, 41, phase(x, 0.22, 0.6)));
  const secs = Math.round(lerp(6138, 3521, phase(x, 0.22, 0.85)));
  return {
    picked: x > 0.26,
    answered,
    question: answered + 1,
    readiness: Math.round(lerp(54, 78, phase(x, 0.42, 0.72))),
    score: Math.round(lerp(688, 784, phase(x, 0.42, 0.72))),
    secs,
    caption: x < 0.38 ? 0 : x < 0.68 ? 1 : 2,
  };
}

const clock = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');

const HISTORY = [612, 655, 641, 702, 718, 744, 784];

function Window({ r, ring, spark }: { r: ReturnType<typeof readouts>; ring: MotionValue<number>; spark: MotionValue<number> }) {
  const max = Math.max(...HISTORY);
  const min = Math.min(...HISTORY) - 40;
  const y = (v: number) => 36 - ((v - min) / (max - min)) * 32;
  const points = HISTORY.map((v, i) => `${(i / (HISTORY.length - 1)) * 100},${y(v)}`).join(' ');
  // Spread the answered count over the domains in blueprint order.
  const domains = DOMAINS.map((d, i) => {
    const before = DOMAINS.slice(0, i).reduce((a, x) => a + x.total, 0);
    return { ...d, done: Math.min(d.total, Math.max(0, r.answered - before)) };
  });

  return (
    <div className="glass overflow-hidden rounded-[1.4rem] text-left backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <div className="flex gap-1.5">
          {['bg-[#ff5f57]', 'bg-[#febc2e]', 'bg-[#28c840]'].map((c) => <span key={c} className={cn('size-2.5 rounded-full opacity-80', c)} />)}
        </div>
        <div className="mx-auto min-w-0 truncate rounded-md bg-wash px-3 py-1 font-mono text-[0.7rem] text-muted-foreground">prepmonkey.in/exams/ccdv-f/mock</div>
        <div className="hidden w-10 sm:block" />
      </div>

      <div className="grid md:grid-cols-[13rem_1fr] lg:grid-cols-[13.5rem_1fr_15rem]">
        <aside className="hidden border-r border-hairline p-4 md:block">
          <div className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">CCDV-F · Full mock</div>
          <ul className="mt-4 space-y-3">
            {domains.map((d) => (
              <li key={d.name} className="space-y-1.5">
                <div className="flex justify-between gap-2 text-xs">
                  <span className={d.done ? 'text-foreground/90' : 'text-muted-foreground'}>{d.name}</span>
                  <span className="tabular-nums text-muted-foreground">{d.done}/{d.total}</span>
                </div>
                <div className="h-[3px] rounded-full bg-hairline">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(d.done / d.total) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-8 gap-1">
            {Array.from({ length: 48 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'aspect-square rounded-[3px] transition-colors duration-300',
                  i < r.answered ? 'bg-primary/70' : i === r.answered ? 'bg-foreground ring-2 ring-primary/50' : 'bg-hairline',
                  (i === 4 || i === 11 || i === 27) && i < r.answered && 'bg-banana/80',
                )}
              />
            ))}
          </div>
        </aside>

        <section className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question <span className="text-foreground tabular-nums">{r.question}</span> of 53 · Agentic architecture</span>
            <span className="inline-flex items-center gap-1.5"><Flag className="size-3.5" /> Flag</span>
          </div>
          <p className="text-[0.95rem] leading-relaxed font-medium sm:text-base">
            A team must summarise 10,000 support tickets by tomorrow morning at the lowest cost. Latency per ticket doesn&apos;t matter. Which approach fits best?
          </p>
          <div className="space-y-2.5">
            {OPTIONS.map((o, i) => {
              const picked = r.picked && i === 1;
              return (
                <div
                  key={o}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm transition-all duration-300',
                    picked ? 'border-primary/60 bg-primary/[0.09] shadow-[0_0_0_4px_oklch(0.74_0.17_58/0.08)]' : 'border-hairline text-muted-foreground',
                  )}
                >
                  <span className={cn('grid size-5 shrink-0 place-items-center rounded-md text-[0.65rem] font-semibold transition-colors duration-300', picked ? 'bg-primary text-primary-foreground' : 'border border-hairline-strong')}>
                    {picked ? <Check className="size-3" /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className={picked ? 'text-foreground' : ''}>{o}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-auto flex items-center justify-between pt-2 text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground"><ChevronLeft className="size-3.5" /> Previous</span>
            <span className="flex items-center gap-3 lg:hidden">
              <span className="tabular-nums text-muted-foreground">Readiness <span className="font-semibold text-foreground">{r.readiness}%</span></span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 font-semibold text-background">Next <ChevronRight className="size-3.5" /></span>
          </div>
        </section>

        <aside className="hidden flex-col gap-4 border-l border-hairline p-5 lg:flex">
          <div>
            <div className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Time left</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{clock(r.secs)}</div>
          </div>
          <div className="rounded-xl border border-hairline p-4">
            <div className="flex items-center gap-3">
              <div className="relative size-14">
                <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-hairline" strokeWidth="3" />
                  <motion.circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" style={{ pathLength: ring }} />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-xs font-semibold tabular-nums">{r.readiness}%</span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Readiness</div>
                <div className="font-heading text-lg font-semibold whitespace-nowrap">{r.readiness >= 70 ? 'Likely pass' : 'Almost there'}</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-hairline p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Predicted score</span>
              <span className="text-[0.65rem] text-muted-foreground">pass 720</span>
            </div>
            <div className={cn('mt-1 font-heading text-3xl font-semibold tabular-nums transition-colors', r.score >= 720 && 'text-ember')}>{r.score}</div>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-3 h-10 w-full overflow-visible">
              <line x1="0" x2="100" y1={y(720)} y2={y(720)} className="stroke-hairline-strong" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              <motion.polyline points={points} fill="none" className="stroke-primary" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" style={{ pathLength: spark }} />
            </svg>
            <div className="mt-1 text-[0.65rem] text-muted-foreground">Last 7 mocks</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Callout({ at, title, body, className, p }: { at: number; title: string; body: string; className: string; p: MotionValue<number> }) {
  const opacity = useTransform(p, [at, at + 0.06], [0, 1]);
  const y = useTransform(p, [at, at + 0.06], [12, 0]);
  return (
    <motion.div style={{ opacity, y }} className={cn('pointer-events-none absolute z-10 hidden md:block', className)}>
      <div className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-popover/85 px-3.5 py-2.5 shadow-[0_20px_50px_-24px_oklch(0.2_0.03_45/0.6)] backdrop-blur-xl">
        <span className="relative mt-1 flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs text-muted-foreground">{body}</span>
        </span>
      </div>
    </motion.div>
  );
}
