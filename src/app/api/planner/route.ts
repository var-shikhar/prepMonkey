import { planSetupSchema } from '@/lib/validators';
import { createPlan } from '@/server/goal-plan';
import { parseBody, route } from '@/server/http';

/** Create the learner's goal plan (Pro). */
export const POST = route(async ({ req, user }) => createPlan(user.id, await parseBody(req, planSetupSchema)));
