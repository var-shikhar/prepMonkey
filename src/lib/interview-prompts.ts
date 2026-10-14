// Real interview questions for the AI interview room, drawn from the
// research catalogs (see scripts/build-interview-prompts.ts). The interviewer
// is given a shortlist pitched at the candidate's level and asks from it in
// its own words, so sessions feel like the interviews people actually face.

import { mulberry32, shuffle } from '@/lib/engine/random';
import type { RoleLevel } from '@/lib/engine/types';

export interface InterviewPrompt {
  id: string;
  subject: string;
  q: string;
  topic: string;
  roleLevel: RoleLevel;
  frequency: 'very-common' | 'common' | 'occasional';
  format: string;
}

/** Interview-room levels mapped onto question role levels (L1–L5). */
export const LEVEL_ROLES: Record<string, RoleLevel[]> = {
  junior: [1, 2],
  mid: [2, 3],
  senior: [3, 4, 5],
};

const WEIGHT = { 'very-common': 3, common: 2, occasional: 1 } as const;

/** Stable 32-bit hash so one interview always gets the same shortlist. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Picks `n` questions for a level, favouring the most-asked ones, one per
 * topic, and leaning to the top of the level's range so a senior session
 * is not all fundamentals.
 */
export function shortlist(bank: InterviewPrompt[], level: string, n: number, seed: number): InterviewPrompt[] {
  const roles = LEVEL_ROLES[level] ?? [2, 3];
  const top = roles[roles.length - 1];
  const rand = mulberry32(seed);
  // Weighted shuffle: sort by a random key scaled by weight (Efraimidis–Spirakis).
  const ranked = shuffle(bank.filter((p) => roles.includes(p.roleLevel)), rand)
    .map((p) => ({ p, key: Math.pow(rand(), 1 / (WEIGHT[p.frequency] * (p.roleLevel === top ? 1.5 : 1))) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.p);
  const topics = new Set<string>();
  const out: InterviewPrompt[] = [];
  for (const p of ranked) {
    if (out.length >= n) break;
    if (topics.has(p.topic)) continue;
    topics.add(p.topic);
    out.push(p);
  }
  return out;
}
