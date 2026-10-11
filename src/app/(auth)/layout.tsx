import { BookOpenCheck, Gauge, Timer } from 'lucide-react';
import { MascotFace } from '@/components/brand/mascot-face';
import { Logo } from '@/components/brand/logo';
import { serif } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const POINTS = [
  { icon: Timer, text: 'Mocks with the official blueprint, timer and scoring' },
  { icon: BookOpenCheck, text: 'An explanation for every option, right or wrong' },
  { icon: Gauge, text: 'A readiness score that tells you when to book' },
];

/**
 * Sign in and sign up. Phones get the form alone; from lg a brand panel sits
 * beside it, with the guide following the pointer and what you get for signing up.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent 75%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-12 px-4 pt-4 pb-16 sm:px-6 sm:pt-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-0">
        <section aria-hidden className="hidden lg:block">
          <MascotFace className="size-28" />
          <p className="mt-8 text-5xl leading-[1.02] font-semibold tracking-[-0.045em]">
            Prep like it&apos;s
            <br />
            <span className={cn(serif.className, 'text-ember pr-2 text-[1.08em] font-normal tracking-[-0.02em]')}>exam day.</span>
          </p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-muted-foreground">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><p.icon className="size-4" /></span>
                {p.text}
              </li>
            ))}
          </ul>
        </section>
        <div className="flex justify-center lg:justify-end">{children}</div>
      </main>
    </div>
  );
}
