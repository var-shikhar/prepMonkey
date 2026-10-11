import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { SavedList } from '@/components/saved/saved-list';
import { aiEnabled } from '@/server/ai/client';
import { listBookmarks } from '@/server/library';
import { requireUser } from '@/server/session';

export const metadata: Metadata = { title: 'Saved questions' };

export default async function SavedPage() {
  const user = await requireUser('/saved');
  const items = await listBookmarks(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pt-6 pb-12 sm:space-y-10 sm:px-6 sm:pt-10">
      <PageHeader eyebrow="Library" title="Saved" accent="questions." description="Your personal revision list, with your own notes. Practise them any time." />
      <SavedList initial={items} aiTutor={aiEnabled()} />
    </div>
  );
}
