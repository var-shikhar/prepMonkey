import { dismissNotice } from '@/server/goal-plan';
import { route } from '@/server/http';

export const DELETE = route<{ id: string }>(async ({ user, params }) => dismissNotice(user.id, params.id));
