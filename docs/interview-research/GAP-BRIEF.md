# Gap analysis and role-level tagging: brief

Context: read `BRIEF.md` in this folder first. It explains the role levels L1–L5 and the research files.

You work on one subject, `<subject>`. The bank lives at `content/exams/<examId>/` (`exam.json` and `questions/*.json`). The two research files are `docs/interview-research/<subject>-firsthand.json` and `<subject>-lists.json`.

## Step 1: Merge the research into one catalog

Merge the two research files into `docs/interview-research/<subject>.catalog.json`.

- Put duplicate and near-duplicate questions into one entry and union their evidence.
- Recompute `frequency` with the BRIEF rule:
  - **very-common:** 3 or more independent first-hand sources, or 1 first-hand source plus 3 or more lists, or 6 or more lists.
  - **common:** 2 or more sources.
  - **occasional:** only 1 source.
- Give each entry a stable `key` such as `"ts-any-vs-unknown"`.
- Keep all the other fields.
- Add three fields:
  - `"skill"`: the best-matching skill id from `exam.json`.
  - `"bankMatches"`: the ids of bank questions that test this interview question, or the exact concept or trick it probes.
  - `"coverage"`: `"covered"`, `"partial"` or `"missing"`. Use `"partial"` when the bank tests the topic but not the way interviewers ask it. For example, an interviewer asks you to implement a debounce, but the bank only asks what a debounce is.

## Step 2: Tag every existing bank question

Write `docs/interview-research/<subject>.tags.json`. It is an object with one entry per bank question id, covering **all of them**:

```json
{ "TS-GEN-001": { "roleLevel": 3, "asked": "ts-generic-constraints" } }
```

- **`roleLevel` (1–5)** is the role at which an interviewer would realistically expect a candidate to answer this question confidently. It is **not** the same as `difficulty`.
  - A pure-knowledge recall question that is rarely asked keeps a low level only if freshers really get asked it.
  - Questions that test deep understanding, such as spec edge cases, compiler internals or subtle runtime ordering, go to **L4 or L5**. The product owner explicitly asked for these to move up.
  - Spread should follow reality. Don't force an even split.
- **`asked`** is the catalog `key` when this bank question matches a catalog entry with coverage `covered` or `partial`. Otherwise it is `null`.

## Step 3: Writing plan

Write `docs/interview-research/<subject>.gaps.md`, a short Markdown report with these parts:

1. Totals: catalog size, and how many entries are covered, partial and missing, by level and by frequency.
2. The role-level distribution of the existing bank after your tagging.
3. A writing plan. List every `missing` or `partial` catalog entry worth writing, giving its key, roleLevel, skill and suggested format (output, debug, implementation choice, true statement, or scenario). Put very-common and common entries first. Skip entries that can't become a fair multiple-choice question, and mark them `interview-room-only` instead.
4. The count of planned new questions per skill. Aim for **150–250 new questions** in total, with every very-common or common missing entry getting at least one question and the most-asked ones 2–3 from different angles.

## Rules

- Read the bank files directly. Write small Node or Python scripts in your temp dir if they help, then delete them.
- Do not edit any file under `content/` or `src/`. Your only outputs are the three files above.
- Check that both JSON files parse, and that `tags.json` has exactly one entry per bank question id.
- Finish with a 10-line summary covering the counts, the 10 biggest gaps, and how many bank questions you moved to L4 or L5 because they test understanding rather than real interview asks.
