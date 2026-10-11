import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The ground rules for using PrepMonkey, an independent practice platform not affiliated with any exam vendor.',
  alternates: { canonical: '/about/terms' },
};

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-[2rem] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-5xl">Terms</h1>
        <p className="text-muted-foreground">The ground rules for using PrepMonkey.</p>
      </header>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Practice, not certification</h2>
        <p className="leading-relaxed text-muted-foreground">PrepMonkey is an independent practice platform. It is not affiliated with any exam vendor, and readiness certificates are not official credentials.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Fair use</h2>
        <p className="leading-relaxed text-muted-foreground">Use the questions for your own preparation. Do not scrape, resell or republish the question banks, and do not use AI features to generate harmful content.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Accuracy</h2>
        <p className="leading-relaxed text-muted-foreground">We work hard to keep questions correct and current, but mistakes happen. Use the Report button on any question and we will review it.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Accounts</h2>
        <p className="leading-relaxed text-muted-foreground">Keep your sign-in details safe. We may suspend accounts that abuse the service.</p>
      </section>
      <p className="text-xs text-muted-foreground">This summary is a starting template. Have it reviewed before you launch publicly.</p>
    </article>
  );
}
