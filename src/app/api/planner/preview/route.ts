import { planSetupSchema } from '@/lib/validators';
import { previewPlan } from '@/server/goal-plan';
import { parseBody, route } from '@/server/http';

/** What a plan with these settings would look like: finish date, sprints, and whether it fits. */
export const POST = route(async ({ req, user }) => previewPlan(user.id, await parseBody(req, planSetupSchema)));
