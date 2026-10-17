import { writeCoachReview } from '@/server/goal-plan';
import { route } from '@/server/http';

/** Writes the AI coach's pending sprint review (once) and returns it. */
export const POST = route<{ id: string }>(async ({ user, params }) => ({ coach: await writeCoachReview(user, params.id) }));
