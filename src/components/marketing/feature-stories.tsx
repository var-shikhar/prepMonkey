'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence, MotionConfig, motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue,
} from 'motion/react';
import { BookOpenCheck, CalendarClock, Check, Clock, Flame, Gauge, MessagesSquare, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Kind = 'diagnose' | 'drill' | 'mock' | 'review' | 'interview';

const STORIES: { kind: Kind; icon: LucideIcon; eyebrow: string; title: string; body: string }[] = [
  {
    kind: 'diagnose', icon: Gauge, eyebrow: 'Day one',
    title: 'Find out where you stand in 15 questions',
    body: 'A short diagnostic samples every skill on the blueprint, then builds a plan around your weakest ones. No guessing where to start.',
  },
  {
    kind: 'drill', icon: BookOpenCheck, eyebrow: 'Every day',
    title: 'Drills that explain every option',
    body: 'Pick a skill and practise. Right or wrong, you see why each option is right or wrong, straight away, while it still matters.',
  },
  {
    kind: 'mock', icon: Clock, eyebrow: 'When you are close',
    title: 'Timed mocks that feel like the real thing',
    body: 'Questions are drawn in the official proportions, with the real timer, scaled score and pass mark. Harder questions weigh more.',
  },
  {
    kind: 'review', icon: CalendarClock, eyebrow: 'A few minutes a day',
    title: 'Missed questions come back right on time',
    body: 'Spaced review brings back what you got wrong just before you would forget it, and your streak keeps you coming back.',
  },
  {
    kind: 'interview', icon: MessagesSquare, eyebrow: 'Ready for the job',
    title: 'AI mock interviews with honest feedback',
    body: 'Pick a role and level. The interviewer asks follow-ups based on your answers and scores you against a clear rubric.',
  },
];

/**
 * "How it works" as a horizontal journey. On wide screens the section pins and
 * vertical scrolling slides a row of cards sideways; inside each card the big
 * step number, the copy and the demo drift at different speeds (parallax).
 * Each demo starts the first time its card arrives. Phones get a simple vertical list instead.
 */
export function FeatureStories() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="hidden lg:block"><HorizontalStories /></div>
      <div className="space-y-14 lg:hidden">
        {STORIES.map((s) => <StackedStory key={s.kind} story={s} />)}
      </div>
    </MotionConfig>
  );
}

const N = STORIES.length;

function HorizontalStories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);
  const [reached, setReached] = useState(0);

  // How far the track must slide so the last card ends where the first began.
  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - viewport.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.0005 });
  const x = useTransform(p, (v) => -v * distance);
  useMotionValueEvent(p, 'change', (v) => {
    const i = Math.min(N - 1, Math.max(0, Math.round(v * (N - 1))));
    setActive(i);
    setReached((r) => Math.max(r, i));
  });

  return (
    <div ref={sectionRef} className="relative" style={{ height: `${N * 70 + 30}vh` }}>
      <div ref={viewportRef} className="sticky top-14 flex h-[calc(100svh-3.5rem)] flex-col justify-center overflow-hidden">

        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-8 px-[calc((100vw-min(66rem,80vw))/2)]">
          {STORIES.map((s, i) => (
            <HorizontalCard key={s.kind} story={s} index={i} p={p} active={active === i} mounted={i <= reached} />
          ))}
        </motion.div>

        <div className="mx-auto mt-10 flex w-full max-w-[min(66rem,80vw)] items-center gap-5">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">0{active + 1} <span className="opacity-50">/ 0{N}</span></span>
          <div className="h-px flex-1 bg-border">
            <motion.div className="bg-gradient-brand h-full origin-left" style={{ scaleX: p }} />
          </div>
          <div className="flex gap-1.5">
            {STORIES.map((s, i) => (
              <span key={s.kind} className={cn('h-1.5 rounded-full transition-all duration-500', i === active ? 'w-6 bg-primary' : 'w-1.5 bg-hairline-strong')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HorizontalCard({ story, index, p, active, mounted }: {
  story: (typeof STORIES)[number]; index: number; p: MotionValue<number>; active: boolean; mounted: boolean;
}) {
  // -1 when the card is one step to the right, 0 when centred, 1 when one step past.
  const local = useTransform(p, (v) => v * (N - 1) - index);
  const numberX = useTransform(local, (l) => l * -140);
  const copyX = useTransform(local, (l) => l * -40);
  const demoX = useTransform(local, (l) => l * 70);
  const tilt = useTransform(local, (l) => Math.max(-6, Math.min(6, l * -6)));
  const Icon = story.icon;

  return (
    <motion.article
      style={{ rotateY: tilt, transformPerspective: 1400 }}
      className={cn(
        'glass relative grid h-[min(32rem,62svh)] w-[min(66rem,80vw)] shrink-0 grid-cols-[1fr_1.15fr] gap-10 overflow-hidden rounded-[2rem] p-10 transition-[border-color] duration-500',
        active && 'border-primary/25',
      )}
    >
      <div aria-hidden className={cn('absolute -bottom-32 -left-24 size-96 rounded-full bg-primary/20 blur-3xl transition-opacity duration-700', active ? 'opacity-100' : 'opacity-0')} />
      <motion.span
        aria-hidden
        style={{ x: numberX }}
        className="pointer-events-none absolute -top-6 left-6 font-heading text-[11rem] leading-none font-semibold tracking-[-0.06em] text-foreground/[0.05]"
      >
        0{index + 1}
      </motion.span>
      <motion.div style={{ x: copyX }} className="relative flex flex-col justify-end">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <span className="grid size-8 place-items-center rounded-xl border border-primary/25 bg-primary/10"><Icon className="size-4" /></span>
          {story.eyebrow}
        </div>
        <h3 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance">{story.title}</h3>
        <p className="mt-4 max-w-sm text-muted-foreground">{story.body}</p>
      </motion.div>
      <motion.div style={{ x: demoX }} className="relative min-h-0">
        <div className="h-full overflow-hidden rounded-2xl border border-hairline bg-inset p-6">
          {mounted && <Demo kind={story.kind} />}
        </div>
      </motion.div>
    </motion.article>
  );
}

function StackedStory({ story }: { story: (typeof STORIES)[number] }) {
  const Icon = story.icon;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <span className="grid size-8 place-items-center rounded-xl border border-primary/25 bg-primary/10"><Icon className="size-4" /></span>
        {story.eyebrow}
      </div>
      <h3 className="text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-3xl">{story.title}</h3>
      <p className="max-w-md text-muted-foreground">{story.body}</p>
      <div className="pt-4"><InlineDemo kind={story.kind} /></div>
    </div>
  );
}

/** The phone layout's demo: mounted once it scrolls into view, so its animation plays where it is seen. */
function InlineDemo({ kind }: { kind: Kind }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -25% 0px' });
  return <div ref={ref} className="h-[22rem]"><Panel>{seen && <Demo kind={kind} />}</Panel></div>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full">
      <div aria-hidden className="absolute inset-x-10 -bottom-6 top-10 -z-10 rounded-full bg-primary/20 blur-3xl" />
      <div className="glass h-full overflow-hidden rounded-3xl p-6 backdrop-blur-xl">{children}</div>
    </div>
  );
}

function Demo({ kind }: { kind: Kind }) {
  if (kind === 'diagnose') return <DiagnoseDemo />;
  if (kind === 'drill') return <DrillDemo />;
  if (kind === 'mock') return <MockDemo />;
  if (kind === 'review') return <ReviewDemo />;
  return <InterviewDemo />;
}

const spring = { type: 'spring', stiffness: 160, damping: 22 } as const;

function DiagnoseDemo() {
  const skills = [['Prompt design', 82], ['Tool use', 64], ['Evaluation', 38], ['Context windows', 71], ['Safety', 45]] as const;
  const score = 68;
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-5">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 36 36" className="size-28 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-secondary" strokeWidth="3.5" />
            <motion.circle
              cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3.5" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: score / 100 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-center">
            <span><span className="block font-heading text-2xl font-bold">{score}%</span><span className="text-[0.65rem] text-muted-foreground">ready</span></span>
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Diagnostic done</div>
          <div className="font-heading text-lg font-semibold">Your plan focuses on 2 skills</div>
          <div className="text-sm text-muted-foreground">About 3 weeks at 20 minutes a day</div>
        </div>
      </div>
      <div className="space-y-2.5">
        {skills.map(([name, v], i) => (
          <div key={name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={v < 50 ? 'font-semibold' : 'text-muted-foreground'}>{name}{v < 50 && <span className="ml-1.5 rounded-full bg-banana/30 px-1.5 py-px text-[0.6rem]">focus</span>}</span>
              <span className="tabular-nums text-muted-foreground">{v}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className={cn('h-full rounded-full', v < 50 ? 'bg-banana' : 'bg-gradient-brand')}
                initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ ...spring, delay: 0.3 + i * 0.08 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrillDemo() {
  // 0: question shown, 1: wrong pick, 2: correct revealed, 3: explanation in.
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [700, 1500, 2100].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  const options = ['Raise max_tokens', 'Add worked examples to the prompt', 'Lower the temperature to 0', 'Switch to a smaller model'];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-xs font-semibold text-muted-foreground">Drill · Prompt design</div>
      <p className="text-sm font-medium">The model keeps returning the wrong JSON shape. What helps most?</p>
      <div className="space-y-1.5">
        {options.map((o, i) => {
          const wrong = step >= 1 && i === 2;
          const right = step >= 2 && i === 1;
          return (
            <motion.div
              key={o}
              animate={wrong && step === 1 ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors duration-300',
                wrong && 'border-destructive/50 bg-destructive/8',
                right && 'border-success/50 bg-success/10',
              )}
            >
              <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border text-[0.65rem] font-semibold', wrong && 'border-destructive bg-destructive text-white', right && 'border-success bg-success text-white')}>
                {wrong ? <X className="size-3" /> : right ? <Check className="size-3" /> : String.fromCharCode(65 + i)}
              </span>
              {o}
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {step >= 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="rounded-xl bg-secondary/70 p-3 text-xs leading-relaxed">
            <span className="font-semibold">Why B:</span> examples show the exact shape you want. Temperature 0 makes answers repeatable, but it can repeat the wrong shape just as reliably.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MockDemo() {
  const [secs, setSecs] = useState(1 * 3600 + 42 * 60 + 18);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const blueprint = [27, 20, 18, 20, 15];
  const answered = 23;
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Full mock · 53 questions</div>
          <div className="font-heading text-lg font-semibold">Question {answered + 1} of 53</div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-sm font-semibold tabular-nums">
          <Clock className="size-4 text-primary" />{hh}:{mm}:<motion.span key={ss} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }}>{ss}</motion.span>
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">Questions per domain, as on the official blueprint</div>
        <div className="flex h-3 gap-1 overflow-hidden rounded-full">
          {blueprint.map((w, i) => (
            <motion.div
              key={i}
              className="h-full rounded-full bg-primary"
              style={{ opacity: 1 - i * 0.15 }}
              initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ ...spring, delay: 0.15 + i * 0.08 }}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5">
        {Array.from({ length: 52 }, (_, i) => (
          <motion.span
            key={i}
            className={cn('aspect-square rounded-[5px]', i < answered ? 'bg-primary/80' : i === answered ? 'bg-banana ring-2 ring-banana/40' : 'bg-secondary', (i === 7 || i === 15) && 'bg-banana/70')}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.012 }}
          />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-2 text-xs">
        <span className="text-muted-foreground">Scaled score so far</span>
        <span className="font-heading text-base font-bold">762 <span className="text-xs font-medium text-success">on track</span></span>
      </div>
    </div>
  );
}

function ReviewDemo() {
  const heat = [10, 35, 60, 20, 80, 45, 25, 55, 70, 30, 90, 65, 40, 85, 50, 75, 95, 60, 80, 100, 70];
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Today</div>
          <div className="font-heading text-lg font-semibold">12 cards due · about 5 min</div>
        </div>
        <motion.span
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-sm font-semibold"
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: 0.9 }}
        >
          <Flame className="size-4 text-primary" /> 21-day streak
        </motion.span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-center text-[0.65rem] text-muted-foreground">{d}</span>)}
        {heat.map((h, i) => (
          <motion.span
            key={i}
            className="aspect-square rounded-md"
            style={{ background: `color-mix(in oklch, var(--primary) ${h}%, var(--secondary))` }}
            initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: 0.05 + i * 0.035 }}
          />
        ))}
      </div>
      <div className="mt-auto flex gap-2 text-xs">
        {[['Again', 'Tomorrow'], ['Good', 'In 4 days'], ['Easy', 'In 11 days']].map(([label, when], i) => (
          <motion.div
            key={label}
            className={cn('flex-1 rounded-xl border px-2 py-2 text-center', i === 1 && 'border-primary/50 bg-primary/10')}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 1 + i * 0.08 }}
          >
            <div className="font-semibold">{label}</div><div className="text-muted-foreground">{when}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function InterviewDemo() {
  const lines = [
    { me: false, text: 'Walk me through how you would design a rate limiter for a public API.' },
    { me: true, text: 'I would start with a token bucket per API key, stored in Redis so every node shares it…' },
    { me: false, text: 'Good. What happens when Redis is down?' },
  ];
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const timers = [1300, 2600].map((ms, i) => setTimeout(() => setShown(i + 2), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground">Backend engineer · Senior</span>
        <span className="rounded-full bg-primary/12 px-2 py-0.5 font-semibold text-primary">AI interviewer</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 text-sm">
        {lines.slice(0, shown).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}
            className={cn('max-w-[85%] rounded-2xl px-3.5 py-2', l.me ? 'ml-auto rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-secondary')}
          >
            {l.text}
          </motion.div>
        ))}
        {shown < lines.length && (
          <div className={cn('flex w-fit gap-1 rounded-2xl bg-secondary px-3.5 py-3', lines[shown].me && 'ml-auto')}>
            {[0, 1, 2].map((d) => (
              <motion.span key={d} className="size-1.5 rounded-full bg-muted-foreground" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} />
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {[['Depth', 4], ['Clarity', 5], ['Trade-offs', 3]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-secondary/70 py-2">
            <div className="text-muted-foreground">{k}</div>
            <div className="font-heading text-base font-bold">{v}/5</div>
          </div>
        ))}
      </div>
    </div>
  );
}
