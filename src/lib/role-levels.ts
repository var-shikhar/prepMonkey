// Role levels tag each question with the job level an interviewer would
// expect to answer it confidently. They are separate from difficulty: a
// hard trivia question can be a fresher question, and a "simple" design
// trade-off can be a senior one.

import type { RoleLevel } from '@/lib/engine/types';

export const ROLE_LEVELS: { level: RoleLevel; code: string; label: string; years: string }[] = [
  { level: 1, code: 'L1', label: 'Fresher', years: '0–1 yrs' },
  { level: 2, code: 'L2', label: 'Junior', years: '1–3 yrs' },
  { level: 3, code: 'L3', label: 'Mid-level', years: '3–5 yrs' },
  { level: 4, code: 'L4', label: 'Senior', years: '5–8 yrs' },
  { level: 5, code: 'L5', label: 'Staff / Lead', years: '8+ yrs' },
];

/** Reviewed-bank question counts per role level, and how many are reported as asked in real interviews. */
export interface RoleCounts { byLevel: Record<number, number>; asked: number }

export const roleLevel = (level: number | null | undefined) => ROLE_LEVELS.find((r) => r.level === level);

interface RoleTagged { roleLevel?: number | null; asked?: boolean | null }

/**
 * Narrows a pool to questions up to the target role (an L3 interview still
 * asks L1–L2 questions). Untagged questions always stay in. When that leaves
 * fewer than `need` items, the next level up is let in, so a mock is never
 * cut short by a thin level.
 */
export function poolForRole<T extends RoleTagged>(pool: T[], target: number | null | undefined, need: number, askedOnly = false): T[] {
  const base = askedOnly ? pool.filter((q) => q.asked) : pool;
  if (!target) return base;
  for (let cap = target; cap <= 5; cap++) {
    const within = base.filter((q) => q.roleLevel == null || q.roleLevel <= cap);
    if (within.length >= need || cap === 5) return within;
  }
  return base;
}
