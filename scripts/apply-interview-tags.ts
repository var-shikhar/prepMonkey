// Writes role levels and asked-in-interviews evidence from the research
// catalog into an exam's question files.
//
//   npx tsx scripts/apply-interview-tags.ts <examId> <subject>
//
// Reads docs/interview-research/<subject>.tags.json ({ questionId: { roleLevel, asked } })
// and <subject>.catalog.json (entries keyed by `key` with frequency, evidence and companies).

import fs from 'node:fs';
import path from 'node:path';
import type { AskedInInterviews } from '../src/lib/engine/types';

interface CatalogEntry {
  key: string;
  coverage?: 'covered' | 'partial' | 'missing';
  frequency: AskedInInterviews['frequency'];
  evidence: { type: string; url: string }[];
  companies?: string[];
}
type Tags = Record<string, { roleLevel: number; asked?: string | null }>;

const [examId, subject] = process.argv.slice(2);
if (!examId || !subject) {
  console.error('usage: apply-interview-tags.ts <examId> <subject>');
  process.exit(1);
}

const research = path.join('docs', 'interview-research');
const tags: Tags = JSON.parse(fs.readFileSync(path.join(research, `${subject}.tags.json`), 'utf8'));
const catalog: CatalogEntry[] = JSON.parse(fs.readFileSync(path.join(research, `${subject}.catalog.json`), 'utf8'));
const byKey = new Map(catalog.map((c) => [c.key, c]));

/** First-hand reports first, then lists; at most five distinct URLs. */
function askedFor(key: string): AskedInInterviews | null {
  const c = byKey.get(key);
  if (!c) throw new Error(`unknown catalog key "${key}"`);
  // A partial match tests the topic but not the way interviewers ask it, so it does not count as asked.
  if (c.coverage === 'partial') return null;
  const urls = [...c.evidence].sort((a, b) => Number(b.type === 'first-hand') - Number(a.type === 'first-hand')).map((e) => e.url);
  const evidence = [...new Set(urls)].filter((u) => /^https?:\/\//.test(u)).slice(0, 5);
  if (!evidence.length) return null;
  const companies = [...new Set(c.companies ?? [])].filter(Boolean);
  return { frequency: c.frequency, evidence, ...(companies.length ? { companies } : {}) };
}

const dir = path.join('content', 'exams', examId, 'questions');
let tagged = 0;
let asked = 0;
const untagged: string[] = [];
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const full = path.join(dir, file);
  const raw = fs.readFileSync(full, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const items: Record<string, unknown>[] = JSON.parse(raw);
  for (const q of items) {
    const t = tags[q.id as string];
    if (!t) { if (q.roleLevel == null) untagged.push(q.id as string); continue; }
    q.roleLevel = t.roleLevel;
    tagged += 1;
    const a = t.asked ? askedFor(t.asked) : null;
    if (a) { q.asked = a; asked += 1; } else delete q.asked;
  }
  fs.writeFileSync(full, JSON.stringify(items, null, 2).replace(/\n/g, eol) + eol);
}
console.log(`${examId}: ${tagged} tagged with a role level, ${asked} marked as asked in interviews`);
if (untagged.length) console.log(`no tag for ${untagged.length} items: ${untagged.slice(0, 10).join(', ')}${untagged.length > 10 ? ' …' : ''}`);
