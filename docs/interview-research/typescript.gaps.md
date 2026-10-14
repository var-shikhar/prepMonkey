# TypeScript: interview gap analysis and writing plan

Sources: `typescript-firsthand.json` (154 entries) and `typescript-lists.json` (181 entries), merged into `typescript.catalog.json`. Bank: `content/exams/typescript/` (479 questions). Role levels for the bank are in `typescript.tags.json`.

## 1. Totals

Catalog size: **195** distinct interview questions (335 raw entries merged). Covered **120**, partial **36**, missing **39**.

### By role level

| Level | Covered | Partial | Missing | Total |
|---|---|---|---|---|
| L1 | 22 | 7 | 3 | 32 |
| L2 | 34 | 6 | 11 | 51 |
| L3 | 38 | 13 | 12 | 63 |
| L4 | 18 | 8 | 7 | 33 |
| L5 | 8 | 2 | 6 | 16 |

### By frequency

| Frequency | Covered | Partial | Missing | Total |
|---|---|---|---|---|
| very-common | 48 | 6 | 6 | 60 |
| common | 61 | 21 | 13 | 95 |
| occasional | 11 | 9 | 20 | 40 |

## 2. Role-level distribution of the existing bank

| Level | Questions | Share | Matched to a real interview ask |
|---|---|---|---|
| L1 | 26 | 5% | 22 |
| L2 | 117 | 24% | 95 |
| L3 | 119 | 25% | 79 |
| L4 | 156 | 33% | 100 |
| L5 | 61 | 13% | 30 |
| Total | 479 | 100% | 326 |

87 bank questions sit at L4 or L5 with no matching interview ask. They test deep understanding: spec edge cases, compiler flags, inference internals, variance and class-field ordering. They were placed at L4/L5 on purpose rather than at the level their topic first appears. The bank is weak at L1 (26 questions), and React + TypeScript typing is missing entirely. Most of the writing plan targets these two gaps.

## 3. Writing plan

Planned questions per entry, very-common first. Formats: output, debug, implementation choice, true statement, scenario. There is no React skill in `exam.json`, so React typing goes under `applied-patterns`.

### very-common

| Key | Level | Skill | Coverage | Format | New Qs |
|---|---|---|---|---|---|
| `ts-what-is-typescript` | L1 | compiler-config | partial | true statement | 3 |
| `ts-typing-warmup` | L1 | everyday-types | missing | implementation choice | 3 |
| `ts-react-props-state` | L2 | applied-patterns | missing | implementation choice | 3 |
| `ts-interface-vs-abstract-class` | L2 | functions-classes | partial | scenario | 3 |
| `ts-ts-classes-vs-es6` | L2 | functions-classes | partial | output | 3 |
| `ts-react-hooks-typing` | L2 | applied-patterns | missing | implementation choice | 3 |
| `ts-react-event-handlers` | L2 | applied-patterns | missing | implementation choice | 3 |
| `ts-api-type-design` | L3 | applied-patterns | partial | scenario | 3 |
| `ts-implement-returntype` | L4 | conditional-types | partial | implementation choice | 3 |
| `ts-js-to-ts-migration` | L5 | applied-patterns | partial | scenario | 3 |

### common

| Key | Level | Skill | Coverage | Format | New Qs |
|---|---|---|---|---|---|
| `ts-pros-and-cons` | L1 | applied-patterns | missing | true statement | 3 |
| `ts-rest-destructured-params` | L1 | functions-classes | partial | implementation choice | 2 |
| `ts-optional-chaining-nullish` | L1 | everyday-types | partial | output | 3 |
| `ts-modules-vs-namespaces` | L1 | declarations-modules | partial | true statement | 2 |
| `ts-modules-import-export` | L1 | declarations-modules | partial | output | 2 |
| `ts-gradual-typing` | L1 | compiler-config | partial | true statement | 2 |
| `ts-loops-typing` | L1 | applied-patterns | partial | output | 2 |
| `ts-readonly-vs-const` | L2 | everyday-types | partial | true statement | 2 |
| `ts-generic-stack-class` | L2 | generics | partial | implementation choice | 2 |
| `ts-react-children-prop` | L2 | applied-patterns | missing | implementation choice | 3 |
| `ts-api-response-wrapper` | L2 | generics | partial | implementation choice | 3 |
| `ts-source-maps-debugging` | L2 | compiler-config | missing | true statement | 3 |
| `ts-implement-partial-readonly` | L3 | mapped-utility | partial | implementation choice | 3 |
| `ts-implement-pick` | L3 | mapped-utility | missing | implementation choice | 3 |
| `ts-decorators-usage` | L3 | functions-classes | partial | implementation choice | 2 |
| `ts-react-custom-hook-tuple` | L3 | applied-patterns | partial | output | 2 |
| `ts-react-generic-component` | L3 | applied-patterns | missing | implementation choice | 3 |
| `ts-trust-inferred-returntype` | L3 | mapped-utility | partial | scenario | 2 |
| `ts-partial-by-keys` | L3 | mapped-utility | missing | implementation choice | 3 |
| `ts-flatten-type` | L3 | conditional-types | missing | implementation choice | 3 |
| `ts-typed-fetch-client` | L3 | applied-patterns | partial | implementation choice | 3 |
| `ts-recursive-types` | L3 | conditional-types | partial | implementation choice | 3 |
| `ts-react-context-typing` | L3 | applied-patterns | missing | implementation choice | 3 |
| `ts-express-request-augmentation` | L3 | declarations-modules | partial | implementation choice | 2 |
| `ts-typed-deep-clone-equal` | L3 | applied-patterns | missing | implementation choice | 3 |
| `ts-any-when-acceptable` | L4 | applied-patterns | partial | scenario | 2 |
| `ts-string-manipulation-types` | L4 | conditional-types | partial | implementation choice | 3 |
| `ts-variadic-tuple-concat-push` | L4 | conditional-types | partial | implementation choice | 3 |
| `ts-tuple-last-pop-includes` | L4 | conditional-types | partial | implementation choice | 3 |
| `ts-merge-object-types` | L4 | mapped-utility | missing | implementation choice | 3 |
| `ts-typed-promise-all` | L5 | generics | partial | implementation choice | 3 |

### occasional

| Key | Level | Skill | Coverage | Format | New Qs |
|---|---|---|---|---|---|
| `ts-ts-vs-tsx` | L1 | compiler-config | missing | true statement | 2 |
| `ts-react-props-interface-or-type` | L2 | applied-patterns | missing | true statement | 2 |
| `ts-typeof-cannot-tell-shapes` | L2 | narrowing | partial | debug | 1 |
| `ts-react-element-vs-node` | L2 | applied-patterns | missing | true statement | 2 |
| `ts-react-optional-api-data` | L2 | applied-patterns | missing | debug | 2 |
| `ts-react-small-hooks` | L2 | applied-patterns | missing | implementation choice | 2 |
| `ts-const-enum` | L3 | everyday-types | partial | output | 1 |
| `ts-implement-record-nonnullable` | L3 | mapped-utility | partial | implementation choice | 1 |
| `ts-jsdoc-vs-typescript` | L3 | compiler-config | partial | true statement | 1 |
| `ts-async-function-typing` | L3 | generics | partial | output | 1 |
| `ts-if-and-tuple-to-object` | L3 | mapped-utility | missing | implementation choice | 2 |
| `ts-build-tools-eslint` | L3 | applied-patterns | partial | true statement | 1 |
| `ts-react-common-mistakes` | L3 | applied-patterns | missing | debug | 3 |
| `ts-react-typed-fetch-hook` | L3 | applied-patterns | missing | implementation choice | 3 |
| `ts-typed-classnames` | L3 | applied-patterns | missing | implementation choice | 2 |
| `ts-mutually-exclusive-props` | L4 | applied-patterns | missing | implementation choice | 3 |
| `ts-design-system-variant-map` | L4 | applied-patterns | partial | scenario | 1 |
| `ts-type-testing` | L4 | applied-patterns | partial | true statement | 1 |
| `ts-using-declaration` | L4 | functions-classes | missing | output | 2 |
| `ts-pick-by-type-readonly-by-keys` | L4 | mapped-utility | partial | implementation choice | 1 |
| `ts-compiler-pipeline` | L4 | compiler-config | missing | true statement | 2 |
| `ts-object-paths` | L5 | conditional-types | missing | implementation choice | 2 |
| `ts-chainable-options` | L5 | generics | missing | implementation choice | 2 |
| `ts-permutation-string-to-union` | L5 | conditional-types | missing | implementation choice | 2 |
| `ts-typed-curry` | L5 | generics | missing | implementation choice | 2 |

### interview-room-only (not planned as MCQ)

These are open-ended experience, design or live-coding prompts. A fair single-answer MCQ cannot capture them.

- `ts-react-machine-coding` (L2, very-common): Build a small React feature (for example a notes CRUD app) in a TypeScript boilerplate with every function and piece of state typed.
- `ts-hands-on-experience` (L2, very-common): When TypeScript is on your resume, explain how you have used it day to day and which compiler errors you hit most.
- `ts-in-memory-cache` (L3, occasional): Implement an in-memory cache in TypeScript and write tests for it.
- `ts-nestjs-vs-express` (L3, occasional): NestJS vs Express: how do TypeScript decorators and dependency injection (inversion of control) change the design?
- `ts-component-library-type-layer` (L5, occasional): Design the type layer of a shared component library or design system so invalid prop combinations and variants are impossible and refactors stay safe.
- `ts-type-architecture` (L4, common): How do you organise and share complex types across files and packages in a large codebase?
- `ts-ai-and-types` (L4, occasional): How do you think about types when using AI coding assistants?
- `ts-type-puzzles-under-pressure` (L4, common): Live coding: a senior frontend loop includes an optional, tricky TypeScript generics problem. How would you approach type-level puzzles under time pressure?
- `ts-json-parser-type` (L5, common): Type-level programming: can you write a type utility that parses a JSON string literal into a type?

## 4. Planned new questions per skill

| Skill | New questions |
|---|---|
| applied-patterns | 61 |
| conditional-types | 22 |
| mapped-utility | 18 |
| compiler-config | 13 |
| generics | 13 |
| functions-classes | 12 |
| everyday-types | 9 |
| declarations-modules | 6 |
| narrowing | 1 |
| **Total** | **155** |

Every very-common and common missing entry gets at least 3 questions. Every very-common partial entry gets 3. Common partial entries get 2 or 3, and occasional entries get 1 or 2.
