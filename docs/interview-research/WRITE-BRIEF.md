# Writing new asked-in-interview questions: brief

Read `BRIEF.md` in this folder first; it defines the role levels L1–L5. You are writing new multiple-choice questions for `content/exams/<examId>/`. Every question must test a question that is **actually asked in interviews**, taken from `docs/interview-research/<subject>.catalog.json`. The writing plan is in `<subject>.gaps.md`. You were given a slice of that plan: specific skills or catalog keys and a target count. Write only that slice.

## Before writing

1. Read `content/question.schema.json` and `exam.json`, and read 10 or more existing questions in your skills. Match their quality, tone and markdown style: `inline code`, and fenced ```js / ```ts / ```tsx blocks.
2. Read the catalog entries in your slice: `q`, `mcqAngle`, `roleLevel`, `evidence`.
3. Grep the existing bank, including other writers' `interview-*.json` files if they exist, so you **don't duplicate** a question that already exists.

## What a good question looks like

The stem should feel like the interviewer's question, turned into something a learner can answer by picking options. Use one of these angles:

- **Output:** a short snippet; what does it log, or in what order?
- **Bug:** "This debounce/useEffect/generic has a bug. What is it?" or "Which fix is correct?"
- **Implementation choice:** two to four candidate implementations of the asked task (a debounce, a `Promise.all` polyfill, a `usePrevious` hook, a `DeepReadonly` type). Which one meets every requirement? The wrong ones should be the mistakes real candidates make.
- **Scenario or design:** an interviewer-style scenario, such as "your autocomplete shows stale results when typing fast…". Which approach fixes it, and why?
- **True statement / multi-select:** for concept questions such as "explain the event loop" or "type vs interface". Choose the statements an interviewer would want to hear.

The most-asked keys get 2–3 questions from **different angles**, for example implement, then debug, then extend with an edge case.

## Required fields on every item

- `id`: `<PREFIX>-IQ-<SKILLCODE>-NNN`, using the exam's prefix and the skill code from existing ids. For example, `JSM-IQ-PRM-001` is JavaScript with async-promises. Number from 001 within each file.
- `domain` and `skill`: must match `exam.json`.
- `difficulty`: 1–4, judged on its own merits.
- `roleLevel`: 1–5, taken from the catalog entry. Adjust it only with a reason.
- `type`: `single` (4 options, 1 correct) or `multi` (5–6 options, 2–3 correct, and the stem ends with "(Choose two.)" or "(Choose three.)"). Set `select` to match.
- `options`: each has `id` (A–F), `text`, `correct` and `why`, where `why` is a specific reason that option is right or wrong.
- `explanation`: the teaching point, plus what the interviewer is really probing.
- `reference`: the official docs page (MDN, typescriptlang.org, react.dev).
- `asked`: `{ "frequency", "evidence": [up to 5 URLs, first-hand first], "companies"?: [...] }`, copied from the catalog entry.
- `source`: `"interview:<catalog key>"`.

## Rules

- **Correctness is everything.** Run every snippet and check every claim.
  - **JS:** run it with `node`.
  - **TS:** check it with the repo's TypeScript (`npx tsc --noEmit --strict` on a temp file in your scratch dir).
  - **React:** if it's runnable, render with the repo's `react` / `react-dom/server`, or reason from react.dev and say which.
  - If you can't verify a question, don't write it.
- **Never refer to options by letter.** Options are shuffled. Also avoid "all of the above" and "none of the above".
- **Make distractors plausible.** No joke options, and the correct answer shouldn't always be the longest.
- **Paraphrase.** Never copy text from the sources.
- Target React 19, TypeScript 5.x and ES2024+, and mention older behaviour only when interviews still ask about it.
- Write your items to a **new** file: `content/exams/<examId>/questions/interview-<slice name>.json`. It is a JSON array formatted with 2-space indentation. Do not edit any other file.
- When you're done, run `npx tsx scripts/validate-bank.ts <examId>` and fix every error and warning from your file. The other writers' files may still be in progress, so ignore their errors.

Finish with a short summary: how many items, the split by roleLevel and difficulty, which catalog keys you covered, and any you skipped (with the reason).
