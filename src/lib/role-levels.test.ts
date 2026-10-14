import { describe, expect, test } from 'vitest';
import { poolForRole } from './role-levels';
import { shortlist, type InterviewPrompt } from './interview-prompts';

const item = (id: string, roleLevel: number | null, asked = false) => ({ id, roleLevel, asked });

describe('poolForRole', () => {
  const pool = [item('a', 1, true), item('b', 2), item('c', 3, true), item('d', 4), item('e', 5), item('f', null)];

  test('keeps questions up to the target role, plus untagged ones', () => {
    expect(poolForRole(pool, 2, 1).map((q) => q.id)).toEqual(['a', 'b', 'f']);
  });

  test('lets the next level in when a mock needs more questions', () => {
    expect(poolForRole(pool, 2, 4).map((q) => q.id)).toEqual(['a', 'b', 'c', 'f']);
    expect(poolForRole(pool, 1, 99)).toHaveLength(pool.length);
  });

  test('no target keeps everything; askedOnly keeps reported questions', () => {
    expect(poolForRole(pool, null, 10)).toHaveLength(pool.length);
    expect(poolForRole(pool, 3, 1, true).map((q) => q.id)).toEqual(['a', 'c']);
  });
});

describe('interview shortlist', () => {
  const bank: InterviewPrompt[] = Array.from({ length: 40 }, (_, i) => ({
    id: `p${i}`, subject: 'javascript', q: `Question ${i}`, topic: `t${i % 20}`,
    roleLevel: ((i % 5) + 1) as InterviewPrompt['roleLevel'], frequency: i % 3 ? 'common' : 'very-common', format: 'concept',
  }));

  test('stays inside the level, one question per topic, and is stable for a seed', () => {
    const a = shortlist(bank, 'junior', 6, 42);
    expect(a).toHaveLength(6);
    for (const p of a) expect([1, 2]).toContain(p.roleLevel);
    expect(new Set(a.map((p) => p.topic)).size).toBe(a.length);
    expect(shortlist(bank, 'junior', 6, 42)).toEqual(a);
  });

  test('senior sessions draw from L3 to L5', () => {
    for (const p of shortlist(bank, 'senior', 8, 7)) expect(p.roleLevel).toBeGreaterThanOrEqual(3);
  });
});
