import Link from 'next/link';
import { MascotMark } from '@/components/brand/mascot';
import { cn } from '@/lib/utils';

/** The PrepMonkey mark, at logo size. */
export function LogoMark({ className }: { className?: string }) {
  return <MascotMark className={cn('size-8', className)} />;
}

export function Logo({ className, href = '/', compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight', className)} aria-label="PrepMonkey home">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      {!compact && (
        <span>
          Prep<span className="text-primary">Monkey</span>
        </span>
      )}
    </Link>
  );
}
