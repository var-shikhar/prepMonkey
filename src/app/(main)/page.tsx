import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { MascotFace } from '@/components/brand/mascot-face';
import { Reveal } from '@/components/common/reveal';
import { ExamFaq } from '@/components/exam-hub/exam-faq';
import { ExamCatalog } from '@/components/marketing/exam-catalog';
import { FeatureStories } from '@/components/marketing/feature-stories';
import { HeroBackdrop } from '@/components/marketing/hero-backdrop';
import { MarkConstruction } from '@/components/marketing/mark-construction';
import { ScrollProgress } from '@/components/marketing/scroll-progress';
import { ProductSequence } from '@/components/marketing/product-sequence';
import { SubjectMarquee } from '@/components/marketing/subject-marquee';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { LANDING_FAQ } from '@/lib/landing-faq';
import { FREE_FEATURES, PRO_FEATURES } from '@/lib/plans';
import { examListLd, faqLd, graph } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { getProPrice } from '@/server/billing';
import { listExams } from '@/server/exams';
import { getUser } from '@/server/session';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// The serif accent is only used on this page, so only this page loads it.
const CATEGORY_LABEL = { certification: 'Certifications', quiz: 'Subject quizzes', interview: 'Interview prep' } as const;

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic' });

export default async function LandingPage() {
  const user = await getUser();
  if (user) redirect('/dashboard');
  const [exams, proPrice] = await Promise.all([listExams(), getProPrice()]);
  const totalQuestions = exams.reduce((a, e) => a + e.questionCount, 0);

  return (
    // data-surface switches the whole document, header and footer included, to the cocoa palette.
    <div data-surface="cocoa" className="relative overflow-x-clip">
      <ScrollProgress />
      <JsonLd data={graph(examListLd(exams), faqLd(LANDING_FAQ))} />
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[60] opacity-[0.06] mix-blend-overlay" />

      {/* Hero */}
      <section className="relative">
        <HeroBackdrop />

        <div className="relative mx-auto max-w-5xl px-4 pt-20 text-center sm:px-6 sm:pt-28">
          <Reveal className="relative inline-block">
            {/* The pill is the lamp: a warm cone of light falls from it over the headline. */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="animate-beam absolute origin-top top-1/2 left-1/2 h-[44rem] w-[min(76rem,200vw)] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_36%,oklch(0.86_0.12_72/0.2)_50%,transparent_64%)] [mask-image:radial-gradient(farthest-side_at_50%_0%,black_30%,transparent)]" />
              <div className="animate-beam absolute origin-top top-1/2 left-1/2 h-[30rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side_at_50%_0%,oklch(0.75_0.17_58/0.35),transparent)]" />
              <div className="absolute -inset-x-8 -inset-y-4 rounded-full bg-primary/35 blur-2xl" />
              <div className="absolute top-full left-1/2 h-px w-56 -translate-x-1/2 bg-gradient-to-r from-transparent via-[oklch(0.9_0.1_75)] to-transparent" />
            </div>
            <Link href="#how-it-works" className="glass relative inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs font-medium text-muted-foreground transition hover:text-foreground">
              <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">New</span>
              AI mock interviews, scored against a rubric
              <ArrowRight className="size-3" />
            </Link>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-8 text-[3.2rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-7xl lg:text-[6.75rem]">
              Prep like it&apos;s
              <br />
              <span className={cn(serif.className, 'text-ember pr-3 text-[1.08em] font-normal tracking-[-0.02em]')}>exam day.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Mocks that follow the official blueprint, an explanation for every option, and a readiness score that tells you when to book.
              For certifications, technical subjects and interviews.
            </p>
          </Reveal>
          <Reveal delay={0.18} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="premium" size="xl" className="px-7">
              <Link href="/sign-up">Start practising free <ArrowRight data-icon="inline-end" /></Link>
            </Button>
            <Button asChild variant="ghost" size="xl" className="glass px-7">
              <Link href="#catalogue">Explore exams</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mt-6 text-sm text-muted-foreground/80">
              Free to start · no card needed{totalQuestions > 0 && ` · ${totalQuestions.toLocaleString('en-IN')} questions`}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 sm:mt-20">
          <ProductSequence />
        </div>
      </section>

      {/* Everything you can practise */}
      {exams.length > 0 && (
        <section aria-labelledby="practise-for" className="pt-24 pb-12 sm:pt-32 lg:pt-40">
          <div className="mx-auto mb-12 flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 sm:px-6">
            <Reveal>
              <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Practise for</p>
              <h2 id="practise-for" className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                {exams.length} exams and subjects, <span className="text-muted-foreground">one place.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((c) => {
                const n = exams.filter((e) => e.category === c).length;
                return n > 0 && (
                  <span key={c} className="glass rounded-full px-3.5 py-1.5 text-sm">
                    <span className="font-semibold">{n}</span> <span className="text-muted-foreground">{CATEGORY_LABEL[c]}</span>
                  </span>
                );
              })}
            </Reveal>
          </div>
          <SubjectMarquee
            items={exams.map((e) => ({ href: `/exams/${e.id}`, label: e.title, code: e.code, kind: { certification: 'Certification', quiz: 'Quiz', interview: 'Interview prep' }[e.category], accent: e.meta.accent }))}
          />
        </section>
      )}


      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 py-28 sm:py-36 lg:py-44">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="How it works" title="From first question to exam day." className="mb-10 lg:mb-0">
            PrepMonkey always shows you one next step, so your time goes into practising, not planning.
          </SectionHeading>
        </div>
        {/* Full width on desktop: the pinned track slides edge to edge. */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:max-w-none lg:px-0">
          <FeatureStories />
        </div>
      </section>

      {/* The guide */}
      <section id="guide" className="relative scroll-mt-16 border-y bg-section-alt py-28 sm:py-36 lg:py-44">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 sm:px-6 md:grid-cols-2 lg:gap-24">
          <MarkConstruction className="mx-auto w-full max-w-sm" />
          <div>
            <SectionHeading eyebrow="Your guide" title="A tutor on every question." align="left">
              Stuck on a question? Ask the PrepMonkey tutor about the exact one in front of you. It explains the idea behind it and what each option misses, then gets out of the way.
            </SectionHeading>
            <ul className="mt-8 divide-y border-y">
              {[
                ['Explains the reasoning', 'Not just the answer key: why the right option is right and why the others fall short.'],
                ['Knows your blueprint', 'Answers in terms of the exam and skill you are studying, at your level.'],
                ['Stays out of mocks', 'Timed mocks run like the real exam, with no hints, so your score means something.'],
              ].map(([t, d], i) => (
                <Reveal key={t} delay={i * 0.08} className="flex gap-4 py-4">
                  <span className="mt-0.5 font-mono text-xs text-primary">0{i + 1}</span>
                  <div>
                    <div className="font-medium">{t}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{d}</div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      {exams.length > 0 && (
        <section id="catalogue" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-28 sm:py-36 lg:py-44 sm:px-6">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Catalogue" title="What will you prep today?" align="left">
              Every exam starts with a free diagnostic.
            </SectionHeading>
          </div>
          <ExamCatalog exams={exams} />
        </section>
      )}

      {/* Plans */}
      <section id="plans" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-28 sm:py-36 lg:py-44 sm:px-6">
        <SectionHeading eyebrow="Pricing" title="Free to start. Pro when it counts." className="mb-14 sm:mb-16">
          Every exam, drill and explanation is free. Upgrade for unlimited full mocks and more AI coaching.
        </SectionHeading>
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal className="glass flex flex-col rounded-3xl p-8">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to practise properly.</p>
            <ul className="mt-7 flex-1 space-y-3 text-sm">
              {FREE_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{f}</li>)}
            </ul>
            <Button asChild variant="ghost" size="xl" className="glass mt-8 w-full"><Link href="/sign-up">Start free</Link></Button>
          </Reveal>
          <Reveal delay={0.1} className="ring-spin relative rounded-[1.5rem] p-px">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-raised p-8">
              <div aria-hidden className="absolute -top-24 -right-24 size-64 rounded-full bg-primary/20 blur-3xl" />
              <h3 className="relative flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-4 text-primary" /> Pro</h3>
              <p className="relative mt-1 text-sm text-muted-foreground">Practise without limits.</p>
              {proPrice && (
                <p className="relative mt-5 font-heading text-4xl font-semibold tracking-[-0.03em]">
                  {formatPrice(proPrice)}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {proPrice.interval}</span>
                </p>
              )}
              <ul className="relative mt-7 flex-1 space-y-3 text-sm">
                {PRO_FEATURES.map((f) => <li key={f} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{f}</li>)}
              </ul>
              <Button asChild variant="premium" size="xl" className="relative mt-8 w-full"><Link href="/sign-up?next=/pricing">Start free, upgrade any time <ArrowRight data-icon="inline-end" /></Link></Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-28 sm:py-36 lg:py-44 sm:px-6">
        <Reveal>
          <ExamFaq faqs={LANDING_FAQ} id="landing-faq" title="Questions, answered honestly." titleClassName="mb-12 text-center text-4xl tracking-[-0.04em] text-balance sm:text-5xl" />
        </Reveal>
      </section>

      {/* Final CTA. The negative bottom margin cancels the footer's top margin, so the glow runs into it. */}
      <section id="start" className="relative -mb-24 overflow-hidden pt-36 pb-32 sm:pt-44 lg:pt-52">
        <div aria-hidden className="absolute top-1/2 left-1/2 h-[36rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.72_0.17_55/0.22),transparent)]" />
        <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="relative mx-auto size-36 sm:size-44">
            <div aria-hidden className="ring-spin absolute inset-2 rounded-full opacity-60 blur-2xl" />
            <div aria-hidden className="absolute inset-3 rounded-full border border-primary/25 bg-background/60 backdrop-blur" />
            <MascotFace className="relative size-full p-4" title="The PrepMonkey guide" />
          </div>
          <h2 className="mt-8 text-5xl leading-[0.95] font-semibold tracking-[-0.045em] sm:text-7xl">
            Walk in <span className={cn(serif.className, 'text-ember pr-2 font-normal tracking-[-0.02em]')}>ready.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">Create a free account in seconds, or try it as a guest. Your progress follows you when you sign up.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="premium" size="xl" className="px-7"><Link href="/sign-up">Create free account <ArrowRight data-icon="inline-end" /></Link></Button>
            <Button asChild variant="ghost" size="xl" className="glass px-7"><Link href="/sign-in">Sign in</Link></Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

const formatPrice = (p: { amount: number; currency: string }) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: p.currency, maximumFractionDigits: p.amount % 1 ? 2 : 0 }).format(p.amount);

function SectionHeading({ eyebrow, title, children, align = 'center', className }: {
  eyebrow: string; title: string; children?: React.ReactNode; align?: 'center' | 'left'; className?: string;
}) {
  return (
    <Reveal className={cn(align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl', className)}>
      <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-4 text-4xl leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-5xl">{title}</h2>
      {children && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{children}</p>}
    </Reveal>
  );
}
