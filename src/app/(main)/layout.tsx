import { MobileTabBar } from '@/components/layout/app-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { InstallBanner } from '@/components/pwa/install-banner';
import { getUser } from '@/server/session';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className={user ? 'flex-1 pb-28 md:pb-0' : 'flex-1'}>{children}</main>
      {user ? <MobileTabBar /> : <SiteFooter />}
      <InstallBanner aboveTabBar={Boolean(user)} />
    </div>
  );
}
