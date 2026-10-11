// Shooting stars: where each starts (as a share of the backdrop), its delay, and
// its cycle. Long, staggered cycles mean one streak at a time, every few seconds.
const STARS = [
  { top: '8%', left: '78%', delay: '0.8s', cycle: '9s' },
  { top: '22%', left: '96%', delay: '5s', cycle: '11s' },
  { top: '4%', left: '52%', delay: '8.5s', cycle: '13s' },
  { top: '30%', left: '70%', delay: '12s', cycle: '10s' },
  { top: '14%', left: '34%', delay: '16s', cycle: '14s' },
];

/**
 * The texture behind the hero: a fine grid that fades out from the headline,
 * a few glinting grid crossings, scattered still stars, and now and then a
 * shooting star. CSS only and purely decorative. Under reduced motion the
 * streaks never appear.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[62rem] overflow-hidden">
      {/* A fine grid, visible only in a soft pool around the headline. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--hairline-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline-strong) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          backgroundPosition: 'center top',
          maskImage: 'radial-gradient(ellipse 55% 42% at 50% 30%, black 0%, transparent 80%)',
        }}
      />
      {/* A few grid crossings glint, out of step with each other. */}
      {[[-6, 2], [5, 1], [-7, 6], [6, 4], [-4, 9], [7, 8]].map(([col, row], i) => (
        <span
          key={`g${i}`}
          className="animate-glint absolute size-[5px] rounded-full bg-primary shadow-[0_0_10px_2px_var(--primary)]"
          style={{ left: `calc(50% + ${col * 72}px)`, top: `${row * 72}px`, animationDelay: `${i * 1.3}s` }}
        />
      ))}

      {/* Still stars: a few faint points, hand-placed so they never look like a pattern. */}
      {[[12, 18], [20, 62], [9, 88], [34, 8], [41, 93], [28, 40], [16, 74], [46, 26], [6, 30], [37, 70]].map(([top, left], i) => (
        <span
          key={i}
          className="absolute size-[2px] rounded-full bg-foreground"
          style={{ top: `${top}%`, left: `${left}%`, opacity: 0.2 + (i % 4) * 0.12 }}
        />
      ))}

      {STARS.map((s, i) => (
        <span
          key={i}
          className="animate-shoot absolute h-px w-36 rounded-full bg-[linear-gradient(90deg,var(--ember-a),transparent)] opacity-0 shadow-[0_0_8px_var(--ember-b)]"
          style={{ top: s.top, left: s.left, animationDelay: s.delay, animationDuration: s.cycle }}
        />
      ))}
    </div>
  );
}
