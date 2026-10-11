// Questions visitors ask before signing up. Shown on the landing page and
// published as FAQPage structured data, so keep the answers plain and honest.

import type { FaqEntry } from '@/lib/exam-faq';

export const LANDING_FAQ: FaqEntry[] = [
  {
    q: 'How is PrepMonkey different from free question dumps?',
    a: 'Every question is original and explains why each option is right or wrong. Mocks follow the official blueprint, timer and scoring, and your readiness score tells you which skills to work on next instead of leaving you to guess.',
  },
  {
    q: 'Are these the real exam questions?',
    a: 'No. Sharing real exam questions breaks the vendors\' rules, and memorising them doesn\'t teach you the skill. Our questions are written to test the same skills, at the same depth and in the same proportions as the official blueprint.',
  },
  {
    q: 'Do I need an account to start?',
    a: 'No. You can try any exam as a guest. If you create a free account later, your guest progress comes with you.',
  },
  {
    q: 'Can PrepMonkey guarantee that I pass?',
    a: 'No platform honestly can. What we can do is show you, with a score based on your recent answers, how close you are and what to practise next, so you book the exam when you are actually ready.',
    link: { href: '/about/scoring', label: 'How scoring works' },
  },
  {
    q: 'Is it free?',
    a: 'Yes. Every exam, drill and explanation is free. Pro adds unlimited full-length mocks and more AI coaching each day.',
    link: { href: '/#plans', label: 'Compare plans' },
  },
];
