'use client';

import { useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react';
import { ExamCard } from '@/components/exams/exam-card';
import { cn } from '@/lib/utils';
import type { ExamCard as ExamCardData } from '@/server/exams';

const TABS = [
  { id: 'all', label: 'Everything' },
  { id: 'certification', label: 'Certifications' },
  { id: 'quiz', label: 'Subject quizzes' },
  { id: 'interview', label: 'Interview prep' },
] as const;

type Tab = (typeof TABS)[number]['id'];

/** The landing page's catalogue: a sliding pill switches category, the cards reflow into place, and long lists fold. */
export function ExamCatalog({ exams, limit = 9 }: { exams: ExamCardData[]; limit?: number }) {
  const [tab, setTab] = useState<Tab>('all');
  const [expanded, setExpanded] = useState(false);
  const tabs = TABS.filter((t) => t.id === 'all' || exams.some((e) => e.category === t.id));
  const inTab = tab === 'all' ? exams : exams.filter((e) => e.category === tab);
  const shown = expanded ? inTab : inTab.slice(0, limit);

  return (
    <MotionConfig reducedMotion="user">
      {tabs.length > 2 && (
        <LayoutGroup id="catalog-tabs">
          <div role="tablist" aria-label="Exam categories" className="scrollbar-none mb-8 flex gap-1 overflow-x-auto rounded-full border bg-card p-1 sm:w-fit">
            {tabs.map((t) => {
              const count = t.id === 'all' ? exams.length : exams.filter((e) => e.category === t.id).length;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => { setTab(t.id); setExpanded(false); }}
                  className={cn('relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors', tab === t.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  {tab === t.id && <motion.span layoutId="pill" className="bg-gradient-brand absolute inset-0 rounded-full shadow-glow" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                  <span className="relative">{t.label} <span className="opacity-70">{count}</span></span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      )}
      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((exam, i) => (
            <motion.div
              key={exam.id}
              layout
              className="h-full"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26, delay: i * 0.04 }}
            >
              <ExamCard exam={exam} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {inTab.length > limit && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="glass rounded-full px-5 py-2.5 text-sm font-medium transition hover:border-primary/40"
          >
            {expanded ? 'Show fewer' : `Show all ${inTab.length} exams`}
          </button>
        </div>
      )}
    </MotionConfig>
  );
}
