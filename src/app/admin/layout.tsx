import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AdminNav } from '@/components/admin/admin-nav';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { openReportCount } from '@/server/admin/moderation';
import { requireRole } from '@/server/session';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · PrepMonkey admin' } };

/**
 * Below md the admin is used by thumb, so every control in it is at least 40px tall (icon
 * buttons 40px wide too). A min-height wins over the controls' compact heights without a
 * specificity fight, and desktop keeps the dense sizes. Inline link buttons are left alone.
 * Sheets and popovers render in a portal outside this tree and size their own controls.
 */
const TOUCH_TARGETS = [
  'max-md:[&_:is([data-slot=button],[data-slot=select-trigger],[data-slot=toggle-group-item],[data-slot=input]):not([data-variant=link])]:min-h-10',
  'max-md:[&_[data-slot=button][data-size^=icon]]:min-w-10',
].join(' ');

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The count reveals nothing on its own and is only rendered once the role check passes, so both share a round trip.
  const [user, openReports] = await Promise.all([requireRole('author', 'admin'), openReportCount()]);
  return (
    <div className={`min-h-dvh ${TOUCH_TARGETS}`}>
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Logo href="/admin" />
          <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white uppercase">Admin</span>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            {/* Icon-only on phones, so the header never outgrows a 360px screen. */}
            <Button asChild variant="ghost" size="sm" className="max-sm:min-w-10 max-sm:px-0">
              <Link href="/dashboard"><ArrowLeft /><span className="max-sm:sr-only">Back to app</span></Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[13rem_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <Suspense><AdminNav openReports={openReports} isAdmin={user.role === 'admin'} /></Suspense>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
