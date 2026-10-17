import { planStateSchema } from '@/lib/validators';
import { dropPlan, pausePlan, resumePlan } from '@/server/goal-plan';
import { parseBody, route } from '@/server/http';

/** Pause (optionally until a date), resume or drop a plan. */
export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  const { action, until } = await parseBody(req, planStateSchema);
  if (action === 'pause') return pausePlan(user.id, params.id, until ?? null);
  if (action === 'resume') return resumePlan(user.id, params.id);
  return dropPlan(user.id, params.id);
});
