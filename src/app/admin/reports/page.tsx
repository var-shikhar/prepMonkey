import { ReportsQueue } from '@/components/admin/reports-queue';

export const metadata = { title: 'Reports' };

export default function AdminReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Reports</h1>
        <p className="text-sm text-muted-foreground">Questions learners flagged, oldest first. Fix the question in the editor, then resolve the report.</p>
      </div>
      <ReportsQueue />
    </div>
  );
}
