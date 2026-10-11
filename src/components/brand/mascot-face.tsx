'use client';

import { useEffect, useId, useRef } from 'react';
import { animate, motion, useMotionValue, useSpring } from 'motion/react';
import { useReducedMotionSafe } from '@/lib/use-reduced-motion';
import { FACE, GOLD, INK, MARK_GEOMETRY, MARK_VIEWBOX, MarkDefs, MarkHead } from '@/components/brand/mascot';
import { cn } from '@/lib/utils';

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/**
 * The mark with a mind of its own, for large, hero-sized use: focused eyes follow
 * the pointer (or glance around on touch screens), with a blink now and then,
 * a sceptical raised brow, a knowing half-smile and a slight head tilt towards
 * whatever it is looking at, and an idea spark that breathes. Built on the same geometry as MascotMark.
 */
export function MascotFace({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  const g = MARK_GEOMETRY;
  const ref = useRef<SVGSVGElement>(null);
  const reduce = useReducedMotionSafe();

  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const ex = useSpring(useMotionValue(0), spring);
  const ey = useSpring(useMotionValue(0), spring);
  const tilt = useSpring(useMotionValue(0), { stiffness: 80, damping: 14 });
  const blink = useMotionValue(1);
  const brow = useMotionValue(0);

  useEffect(() => {
    if (reduce) return;
    let last = 0;
    const look = (dx: number, dy: number) => {
      ex.set(clamp(dx, 1) * 1.5);
      ey.set(clamp(dy, 1) * 1.1);
      tilt.set(clamp(dx, 1) * 5);
    };
    const onMove = (e: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      last = Date.now();
      look((e.clientX - (box.left + box.width / 2)) / 420, (e.clientY - (box.top + box.height / 2)) / 420);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // Without a pointer (or when it goes still), glance around now and then.
    const wander = setInterval(() => {
      if (Date.now() - last < 3000) return;
      const glances: [number, number][] = [[0.8, -0.2], [-0.7, 0.1], [0, 0], [0.3, 0.6], [-0.4, -0.5]];
      const [dx, dy] = glances[Math.floor(Math.random() * glances.length)];
      look(dx, dy);
    }, 2200);

    // Blink every few seconds, sometimes twice.
    let blinkTimer: ReturnType<typeof setTimeout>;
    const doBlink = () => {
      animate(blink, [1, 0.08, 1], { duration: 0.22, times: [0, 0.45, 1] });
      if (Math.random() < 0.25) setTimeout(() => animate(blink, [1, 0.08, 1], { duration: 0.2 }), 260);
      blinkTimer = setTimeout(doBlink, 2800 + Math.random() * 3200);
    };
    blinkTimer = setTimeout(doBlink, 1800);

    // The thinking brow: lifts, holds, settles.
    const browLoop = setInterval(() => {
      animate(brow, [0, -1.6, -1.6, 0], { duration: 2.2, times: [0, 0.15, 0.8, 1], ease: 'easeInOut' });
    }, 6500);

    return () => {
      window.removeEventListener('pointermove', onMove);
      clearInterval(wander);
      clearInterval(browLoop);
      clearTimeout(blinkTimer);
    };
  }, [reduce, ex, ey, tilt, blink, brow]);

  return (
    <motion.svg
      ref={ref}
      viewBox={MARK_VIEWBOX}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      className={cn('size-32', className)}
      style={{ rotate: tilt }}
    >
      {title && <title>{title}</title>}
      <defs><MarkDefs id={id} /></defs>

      {/* The idea spark breathes: the glow swells and the star turns a little. */}
      <motion.circle
        cx={g.spark.cx} cy={g.spark.cy} r="8" fill={`url(#${id}-glow)`}
        animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <motion.path
        d={g.spark.d} fill={GOLD}
        animate={reduce ? undefined : { rotate: [0, 18, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <MarkHead id={id} />

      {/* Eyes stay inside their sockets; the face-coloured lid flattens their tops for a focused look. */}
      {g.sockets.map((c, i) => (
        <g key={c.cx} clipPath={`url(#${id}-socket-${i})`}>
          <motion.g style={{ x: ex, y: ey }}>
            <motion.g style={{ scaleY: blink, transformBox: 'fill-box', transformOrigin: 'center' }}>
              <ellipse cx={c.cx} {...g.pupil} fill={INK} />
              <circle cx={c.cx + 0.95} cy={26.9} r="0.8" fill={FACE} />
            </motion.g>
          </motion.g>
          <rect x={c.cx - 5} y={20} width="10" height="5.3" fill={FACE} />
        </g>
      ))}

      {/* Brows: the left one level and intent, the right one raised and ready to lift further. */}
      <g stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d={g.browLeft} />
        <motion.path style={{ y: brow }} d={g.browRight} />
      </g>

      {/* A knowing half-smile, higher on one side. */}
      <g stroke={INK} strokeLinecap="round" fill="none">
        <path d={g.smile} strokeWidth="1.6" />
        <path d={g.dimple} strokeWidth="1.2" />
      </g>
    </motion.svg>
  );
}
