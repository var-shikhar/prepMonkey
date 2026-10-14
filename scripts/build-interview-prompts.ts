// Builds the AI interview room's bank of real interview questions from the
// research catalogs in docs/interview-research/.
//
//   npx tsx scripts/build-interview-prompts.ts
//
// Writes content/interview-prompts/frontend.json. Output-prediction and
// debugging entries are left out: they need a code snippet on screen, which
// the multiple-choice banks already cover.

import fs from 'node:fs';
import path from 'node:path';
import type { InterviewPrompt } from '../src/lib/interview-prompts';

const SUBJECTS = ['javascript', 'typescript', 'react'] as const;
const SPOKEN_FORMATS = new Set(['concept', 'comparison', 'design', 'coding', 'machine-coding']);

interface CatalogEntry { key: string; q: string; topic?: string; roleLevel: number; frequency: InterviewPrompt['frequency']; format: string }

const out: InterviewPrompt[] = [];
for (const subject of SUBJECTS) {
  const file = path.join('docs', 'interview-research', `${subject}.catalog.json`);
  if (!fs.existsSync(file)) { console.warn(`skipping ${subject}: no catalog yet`); continue; }
  const catalog: CatalogEntry[] = JSON.parse(fs.readFileSync(file, 'utf8'));
  const kept = catalog.filter((c) => SPOKEN_FORMATS.has(c.format) && c.roleLevel >= 1 && c.roleLevel <= 5);
  for (const c of kept) {
    out.push({ id: c.key, subject, q: c.q.trim(), topic: c.topic ?? c.key, roleLevel: c.roleLevel as InterviewPrompt['roleLevel'], frequency: c.frequency, format: c.format });
  }
  console.log(`${subject}: ${kept.length} of ${catalog.length} catalog entries`);
}

const dest = path.join('content', 'interview-prompts', 'frontend.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.length} prompts to ${dest}`);
