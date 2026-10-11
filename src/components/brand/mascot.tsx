import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The PrepMonkey mark: a flat, geometric monkey head built from a handful of
 * circles on a 64-unit grid (ears r9 at x12/x52, head r21, eye sockets r8.5, an
 * elliptical muzzle), with a sharp expression (focused eyes, one raised brow, a
 * half-smile) and a gold spark above it, the "lightbulb moment". No outlines, so
 * it holds up from a 16px favicon to a hero, on light and dark. MascotFace and
 * the construction animation draw from the same geometry and viewBox.
 */
export const MARK_VIEWBOX = '-3.5 -7 71 71';

export const MARK_GEOMETRY = {
  ears: [{ cx: 12, cy: 30, r: 9 }, { cx: 52, cy: 30, r: 9 }],
  innerEars: [{ cx: 12, cy: 30, r: 4.5 }, { cx: 52, cy: 30, r: 4.5 }],
  head: { cx: 32, cy: 30, r: 21 },
  sockets: [{ cx: 25, cy: 27, r: 8.5 }, { cx: 39, cy: 27, r: 8.5 }],
  muzzle: { cx: 32, cy: 40, rx: 13, ry: 9.5 },
  // Pupils sit low in the sockets; a face-coloured lid flattens their tops for a focused look.
  pupil: { cy: 27.8, rx: 2.55, ry: 2.85 },
  browLeft: 'M20.2 19.6c1.9-1.3 4.6-1.6 7-.7',
  browRight: 'M36.8 17.8c2.3-1.3 5-1.1 7 .5',
  smile: 'M28.3 43.3c2.4 1.5 5.2 1.3 7.4-1',
  dimple: 'M35.5 42.1l1.2-.8',
  spark: { cx: 32, cy: 3, d: 'M32-2.6 33.7 1.3 37.6 3 33.7 4.7 32 8.6 30.3 4.7 26.4 3 30.3 1.3Z' },
} as const;

export const INK = '#22140b';
export const FACE = '#fbe8cc';
export const GOLD = '#f7c948';

/** Gradients and clip paths both mark components need, namespaced by `id`. */
export function MarkDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-fur`} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#f6a142" />
        <stop offset="1" stopColor="#c4541b" />
      </linearGradient>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor="#ffd76a" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffd76a" stopOpacity="0" />
      </radialGradient>
      {MARK_GEOMETRY.sockets.map((c, i) => <clipPath key={c.cx} id={`${id}-socket-${i}`}><circle {...c} /></clipPath>)}
    </>
  );
}

/** Ears, head, sockets and muzzle: everything but the expression. */
export function MarkHead({ id }: { id: string }) {
  const fur = `url(#${id}-fur)`;
  const g = MARK_GEOMETRY;
  return (
    <>
      {g.ears.map((c) => <circle key={c.cx} {...c} fill={fur} />)}
      {g.innerEars.map((c) => <circle key={c.cx} {...c} fill={FACE} opacity="0.9" />)}
      <circle {...g.head} fill={fur} />
      {g.sockets.map((c) => <circle key={c.cx} {...c} fill={FACE} />)}
      <ellipse {...g.muzzle} fill={FACE} />
    </>
  );
}

export function MascotMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  const g = MARK_GEOMETRY;
  return (
    <svg viewBox={MARK_VIEWBOX} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} className={cn('size-8', className)}>
      {title && <title>{title}</title>}
      <defs><MarkDefs id={id} /></defs>
      <circle cx={g.spark.cx} cy={g.spark.cy} r="8" fill={`url(#${id}-glow)`} />
      <path d={g.spark.d} fill={GOLD} />
      <MarkHead id={id} />
      {g.sockets.map((c, i) => (
        <g key={c.cx} clipPath={`url(#${id}-socket-${i})`}>
          <ellipse cx={c.cx} {...g.pupil} fill={INK} />
          <circle cx={c.cx + 0.95} cy={26.9} r="0.8" fill={FACE} />
          <rect x={c.cx - 5} y={20} width="10" height="5.3" fill={FACE} />
        </g>
      ))}
      <g stroke={INK} strokeLinecap="round" fill="none">
        <path d={g.browLeft} strokeWidth="1.5" />
        <path d={g.browRight} strokeWidth="1.5" />
        <path d={g.smile} strokeWidth="1.6" />
        <path d={g.dimple} strokeWidth="1.2" />
      </g>
    </svg>
  );
}
