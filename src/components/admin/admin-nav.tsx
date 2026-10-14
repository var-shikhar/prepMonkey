'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileQuestion, Flag, LayoutDashboard, Sparkles, Upload, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/questions', label: 'Questions', icon: FileQuestion },
  { href: '/admin/generate', label: 'AI drafts', icon: Sparkles },
  { href: '/admin/reports', label: 'Reports', icon: Flag, badge: 'reports' as const },
  { href: '/admin/import', label: 'Import & export', icon: Upload },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
];

/** A sidebar from lg up; below that a tab strip that scrolls sideways inside itself. */
export function AdminNav({ openReports, isAdmin }: { openReports: number; isAdmin: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const exam = params.get('exam');
  const navRef = useRef<HTMLElement>(null);

  // On the narrow strip the current tab can sit off-screen (Users, Import), so bring it into view.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const offset = active.getBoundingClientRect().left - nav.getBoundingClientRect().left;
    nav.scrollTo({ left: nav.scrollLeft + offset - (nav.clientWidth - active.offsetWidth) / 2 });
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      aria-label="Admin"
      className={cn(
        'scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:px-0',
        // Soft edges hint that the strip scrolls; the sidebar needs none.
        'max-lg:[mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)]',
      )}
    >
      {ITEMS.filter((i) => !i.adminOnly || isAdmin).map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={exam ? `${item.href}?exam=${exam}` : item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors lg:min-h-0',
              active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-wash hover:text-foreground',
            )}
          >
            <item.icon className={cn('size-4', active && 'text-primary')} />
            {item.label}
            {item.badge === 'reports' && openReports > 0 && (
              <span className="ml-auto rounded-full bg-primary px-1.5 py-px text-[0.65rem] font-semibold text-primary-foreground tabular-nums">{openReports}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
