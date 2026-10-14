// Gives a first-pass role level (L1–L5) to every question that has none yet,
// derived from its difficulty, so the "Preparing for" picker works on every
// IT subject before that subject gets its interview research (which replaces
// these with researched levels via apply-interview-tags.ts).
//
//   npx tsx scripts/provisional-role-levels.ts [examId ...]

import fs from 'node:fs';
import path from 'node:path';

// difficulty 1–4 -> role level. Senior-only tracks start one level up.
const DEFAULT_MAP = [0, 1, 2, 3, 4];
const SHIFTED_MAP = [0, 2, 3, 4, 5];
const SUBJECTS: Record<string, number[]> = {
  'system-design': SHIFTED_MAP,
  concurrency: SHIFTED_MAP,
  nodejs: DEFAULT_MAP,
  python: DEFAULT_MAP,
  nextjs: DEFAULT_MAP,
  docker: DEFAULT_MAP,
  sql: DEFAULT_MAP,
  kubernetes: DEFAULT_MAP,
  vcs: DEFAULT_MAP,
  dsa: DEFAULT_MAP,
};

const only = process.argv.slice(2);
for (const [examId, map] of Object.entries(SUBJECTS)) {
  if (only.length && !only.includes(examId)) continue;
  const dir = path.join('content', 'exams', examId, 'questions');
  const counts: Record<number, number> = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const items: Record<string, unknown>[] = JSON.parse(raw);
    let changed = false;
    for (const q of items) {
      if (q.roleLevel == null) { q.roleLevel = map[q.difficulty as number] ?? 2; changed = true; }
      counts[q.roleLevel as number] = (counts[q.roleLevel as number] ?? 0) + 1;
    }
    if (changed) fs.writeFileSync(full, JSON.stringify(items, null, 2).replace(/\n/g, eol) + eol);
  }
  console.log(`${examId.padEnd(14)} ${JSON.stringify(counts)}`);
}
