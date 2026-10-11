import { Reveal } from '@/components/common/reveal';
import { serif } from '@/lib/fonts';
import { cn } from '@/lib/utils';

/**
 * The top of an app page: an optional small-caps eyebrow, a title whose last
 * words (`accent`) take the serif ember accent, an optional description, and
 * actions that sit to the right from sm and wrap below on phones.
 */
export function PageHeader({ eyebrow, title, accent, description, children, className }: {
  eyebrow?: string; title: string; accent?: string; description?: React.ReactNode; children?: React.ReactNode; className?: string;
}) {
  return (
    <Reveal className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className={cn('text-[2.1rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-5xl', eyebrow && 'mt-2')}>
          {title}
          {accent && <> <span className={cn(serif.className, 'text-ember pr-1 font-normal tracking-[-0.01em]')}>{accent}</span></>}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Reveal>
  );
}
