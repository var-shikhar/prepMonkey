import { completeTask } from '@/server/goal-plan';
import { route } from '@/server/http';

/** Tick off a reading task, or a review when nothing is due. */
export const POST = route<{ id: string }>(async ({ user, params }) => completeTask(user.id, params.id));
