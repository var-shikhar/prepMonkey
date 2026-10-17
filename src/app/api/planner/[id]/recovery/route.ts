import { planRecoverySchema } from '@/lib/validators';
import { applyRecovery, getRecoveryOptions } from '@/server/goal-plan';
import { parseBody, route } from '@/server/http';

/** Previews of each way to get back on track. */
export const GET = route<{ id: string }>(async ({ user, params }) => ({ options: await getRecoveryOptions(user.id, params.id) }));

/** Apply the option the learner picked. */
export const POST = route<{ id: string }>(async ({ req, user, params }) => {
  const { option } = await parseBody(req, planRecoverySchema);
  return applyRecovery(user.id, params.id, option);
});
