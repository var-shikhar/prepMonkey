import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { FaqEntry } from '@/lib/exam-faq';
import { cn } from '@/lib/utils';

/**
 * Common questions about the exam. Native <details>, so every answer is in the
 * HTML (for crawlers and find-in-page) and opening one needs no JavaScript.
 */
export function ExamFaq({ faqs, title = 'Questions about this exam', id = 'exam-faq', titleClassName }: { faqs: FaqEntry[]; title?: string; id?: string; titleClassName?: string }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className={cn('text-xl font-semibold', titleClassName)}>{title}</h2>
      <div className="divide-y rounded-2xl border bg-card">
        {faqs.map((f) => (
          <details key={f.q} className="group px-4 sm:px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 text-sm text-muted-foreground animate-in fade-in">
              {f.a}
              {f.link && (
                <>
                  {' '}
                  {f.link.href.startsWith('/') ? (
                    <Link href={f.link.href} className="font-medium text-primary hover:underline">{f.link.label}</Link>
                  ) : (
                    <a href={f.link.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{f.link.label}</a>
                  )}
                </>
              )}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
