import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Item { href: string; label: string; code: string; kind: string; accent?: string }

/**
 * Everything you can practise, as two slow rows of exam tiles drifting in
 * opposite directions. CSS only: each track holds its row twice and slides by
 * half its width, so the loop is seamless. Hovering a row pauses it; the second
 * copy is hidden from assistive tech and the keyboard.
 */
export function SubjectMarquee({ items }: { items: Item[] }) {
  if (items.length === 0) return null;
  // Short catalogues are repeated so each row is always wider than the screen.
  const fill = Array.from({ length: Math.max(1, Math.ceil(12 / items.length)) }, () => items).flat();
  const half = Math.ceil(fill.length / 2);
  // The second row starts halfway through, so the rows never line up.
  const rows = [fill, [...fill.slice(half), ...fill.slice(0, half)]];

  return (
    <div className="mask-fade-x space-y-4 overflow-hidden py-2">
      {rows.map((row, r) => (
        <div
          key={r}
          className={cn('animate-marquee flex w-max hover:[animation-play-state:paused]', r === 1 && '[animation-direction:reverse]')}
          style={{ '--marquee-duration': `${row.length * 6}s` } as React.CSSProperties}
        >
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 gap-4 pr-4">
              {row.map((it, i) => (
                <li key={`${it.href}-${i}`}>
                  <Link
                    href={it.href}
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="glass group flex items-center gap-3.5 rounded-2xl py-3 pr-6 pl-3 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl font-mono text-[0.65rem] font-bold tracking-tight text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${it.accent ?? '#ea7a1f'}, oklch(0.42 0.09 45))` }}
                    >
                      {it.code.split('-')[0].slice(0, 4)}
                    </span>
                    <span className="leading-tight">
                      <span className="block font-heading text-base font-semibold whitespace-nowrap transition-colors group-hover:text-primary">{it.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{it.kind}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ))}
    </div>
  );
}
