import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { TeamsHome } from '@/components/teams/teams-home';
import { requireUser } from '@/server/session';
import { listMyTeams } from '@/server/teams';

export const metadata: Metadata = { title: 'Teams' };

export default async function TeamsPage() {
  const user = await requireUser('/teams');
  const teams = await listMyTeams(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pt-6 pb-12 sm:space-y-10 sm:px-6 sm:pt-10">
      <PageHeader eyebrow="Teams" title="Practise" accent="together." description="Shared assignments, due dates and a results view for instructors." />
      <TeamsHome teams={teams} />
    </div>
  );
}
