'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { APP_NAV, isActive } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** Desktop top navigation: four destinations with a sliding active pill. */
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {APP_NAV.map((item) => {
        const active = isActive(item, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="app-nav-pill"
                className="absolute inset-0 -z-10 rounded-full border border-hairline-strong bg-wash"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="inline-flex items-center gap-1.5">
              {item.label}
              {item.badge && (
                <span className="rounded-full bg-gradient-brand px-1.5 py-px text-[0.6rem] font-semibold tracking-wide text-white">{item.badge}</span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Phone navigation: the same four destinations in a floating glass dock that
 * sits clear of the screen edge (and the home indicator). A soft pill slides
 * behind whichever tab is active.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="pb-safe fixed inset-x-3 bottom-3 z-40 print:hidden md:hidden">
      <ul className="glass mx-auto grid max-w-md grid-cols-4 rounded-[1.6rem] p-1.5 backdrop-blur-2xl">
        {APP_NAV.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-[1.2rem] py-2 text-[0.68rem] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-[1.2rem] border border-primary/25 bg-primary/12"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative size-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className="relative">{item.label}</span>
                {item.badge && !active && <span className="absolute top-1.5 right-[calc(50%-1.1rem)] size-1.5 rounded-full bg-primary" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
