'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { useReducedMotionSafe } from '@/lib/use-reduced-motion';
import { MARK_GEOMETRY, MARK_VIEWBOX } from '@/components/brand/mascot';
import { MascotFace } from '@/components/brand/mascot-face';

/**
 * The mark drawn from its own construction: guide lines fade in, the circles it
 * is built from trace themselves as you scroll, then the solid mark settles on
 * top. Everything is driven by scroll position, so it plays at the reader's pace
 * and runs backwards when they scroll back up.
 */
export function MarkConstruction({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'center 0.45'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });
  const draw = useTransform(p, [0, 0.65], [0, 1]);
  const guides = useTransform(p, [0, 0.3, 1], [0, 0.5, 0.25]);
  const lines = useTransform(p, [0.6, 1], [1, 0.35]);
  const fill = useTransform(p, [0.55, 0.9], [0, 1]);
  const fillScale = useTransform(p, [0.55, 0.95], [0.94, 1]);
  const g = MARK_GEOMETRY;

  return (
    <div ref={ref} className={className}>
      <div className="relative aspect-square">
        <div aria-hidden className="absolute inset-[18%] rounded-full bg-primary/25 blur-[90px]" />
        <motion.svg viewBox={MARK_VIEWBOX} aria-hidden className="absolute inset-0 size-full overflow-visible" style={reduce ? { opacity: 0.35 } : { opacity: lines }}>
          <motion.g style={reduce ? undefined : { opacity: guides }} className="stroke-foreground/35" strokeWidth="0.12" strokeDasharray="0.6 0.8">
            <line x1="-3.5" x2="67.5" y1="30" y2="30" />
            <line x1="-3.5" x2="67.5" y1="27" y2="27" />
            <line x1="-3.5" x2="67.5" y1="40" y2="40" />
            <line x1="32" x2="32" y1="-7" y2="64" />
            <line x1="12" x2="12" y1="-7" y2="64" />
            <line x1="52" x2="52" y1="-7" y2="64" />
            <line x1="-3.5" x2="67.5" y1="-7" y2="64" />
            <line x1="67.5" x2="-3.5" y1="-7" y2="64" />
          </motion.g>
          {/* motion's pathLength traces circles and ellipses as well as paths */}
          <g fill="none" className="stroke-primary" strokeWidth="0.22">
            {[...g.ears, g.head, ...g.sockets, ...g.innerEars].map((c, i) => (
              <motion.circle key={i} cx={c.cx} cy={c.cy} r={c.r} style={reduce ? undefined : { pathLength: draw }} />
            ))}
            <motion.ellipse {...g.muzzle} style={reduce ? undefined : { pathLength: draw }} />
          </g>
          <g className="fill-primary">
            {[[32, 30], [25, 27], [39, 27], [12, 30], [52, 30], [32, 40]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" />)}
          </g>
        </motion.svg>
        <motion.div className="absolute inset-0" style={reduce ? undefined : { opacity: fill, scale: fillScale }}>
          <MascotFace className="size-full drop-shadow-[0_30px_60px_oklch(0.6_0.18_45/0.35)]" title="The PrepMonkey guide" />
        </motion.div>
      </div>
    </div>
  );
}

