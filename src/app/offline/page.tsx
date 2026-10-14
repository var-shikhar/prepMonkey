import type { Metadata } from 'next';
import { LogoMark } from '@/components/brand/logo';

export const metadata: Metadata = { title: 'Offline', robots: { index: false, follow: false } };

// Cached by the service worker and shown when a page can't load without a
// network. It must work with no JavaScript, so the buttons are plain links.
export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto size-16" />
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">You&apos;re offline</h1>
        <p className="mt-2 text-muted-foreground">
          PrepMonkey needs a connection to load questions and save your answers. Answers that were already saved are
          kept, and a timed mock&apos;s clock keeps running while you&apos;re away.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <a href="" className="inline-flex h-10 items-center rounded-full bg-gradient-brand px-5 text-sm font-semibold text-white">
            Try again
          </a>
          <a href="/dashboard" className="inline-flex h-10 items-center rounded-full border px-5 text-sm font-semibold">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
