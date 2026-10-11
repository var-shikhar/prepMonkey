import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Catalog } from '@/components/exams/catalog';
import { JsonLd } from '@/components/seo/json-ld';
import { examListLd, graph } from '@/lib/seo';
import { getMyExams } from '@/server/analytics';
import { listExams, type ExamCard } from '@/server/exams';
import { getUser } from '@/server/session';

export const metadata: Metadata = {
  title: 'Explore practice exams and mock interviews',
  description: 'Timed certification mocks, interview prep and quizzes: pick one to see its syllabus, take a free diagnostic and practise with an explanation for every option.',
  alternates: { canonical: '/explore' },
};

export default async function ExplorePage() {
  // Visitors browse the catalogue on the landing page.
  if (!(await getUser())) redirect('/#catalogue');
  const exams = await listExams(); // cached catalogue: the full list is in the first HTML
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6 pb-12 sm:space-y-10 sm:px-6 sm:pt-10">
      <JsonLd data={graph(examListLd(exams))} />
      <PageHeader
        eyebrow="Catalogue"
        title="Find your next"
        accent="exam."
        description="Pick an exam to see its syllabus, take a free diagnostic, and practise with explanations for every option."
      />
      {/* Without readiness first (what crawlers and visitors see), then with the learner's own scores. */}
      <Suspense fallback={<Catalog exams={exams} readiness={{}} />}>
        <CatalogWithReadiness exams={exams} />
      </Suspense>
    </div>
  );
}

async function CatalogWithReadiness({ exams }: { exams: ExamCard[] }) {
  const user = await getUser();
  const mine = user ? await getMyExams(user.id, 20) : [];
  const readiness = Object.fromEntries(mine.map((m) => [m.id, m.readiness?.readiness ?? null]));
  return <Catalog exams={exams} readiness={readiness} />;
}
