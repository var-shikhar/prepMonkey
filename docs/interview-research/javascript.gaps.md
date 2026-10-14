# JavaScript: interview gap analysis and writing plan

Inputs: `javascript-firsthand.json` (175 entries) and `javascript-lists.json` (217 entries), merged into `javascript.catalog.json`. Bank: `content/exams/javascript` (498 questions). Evidence of type `company-list` counts as a list.

## 1. Catalog totals

Catalog size: **263** distinct questions. Covered **130**, partial **43**, missing **90**.

| Role level | Entries | Covered | Partial | Missing |
|---|---|---|---|---|
| L1 | 37 | 21 | 10 | 6 |
| L2 | 98 | 57 | 13 | 28 |
| L3 | 85 | 43 | 11 | 31 |
| L4 | 38 | 8 | 7 | 23 |
| L5 | 5 | 1 | 2 | 2 |

| Frequency | Entries | Covered | Partial | Missing |
|---|---|---|---|---|
| very-common | 86 | 61 | 14 | 11 |
| common | 114 | 57 | 16 | 41 |
| occasional | 63 | 12 | 13 | 38 |

## 2. Role-level distribution of the existing bank

| Role level | Questions | Share | of which `asked` |
|---|---|---|---|
| L1 | 32 | 6% | 27 |
| L2 | 99 | 20% | 81 |
| L3 | 137 | 28% | 107 |
| L4 | 146 | 29% | 90 |
| L5 | 84 | 17% | 33 |

338 of 498 bank questions (68%) map to a real interview question (`asked` set). 107 questions sit at L4 or L5 with `asked: null`: they test spec edge cases, engine internals or subtle runtime ordering rather than something interviewers actually ask.

Role level by skill:

| Skill | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| types-coercion | 10 | 13 | 14 | 15 | 5 |
| objects-prototypes | 2 | 10 | 9 | 14 | 11 |
| functions-closures | 11 | 11 | 14 | 13 | 13 |
| collections | 4 | 12 | 15 | 13 | 6 |
| async-promises | 2 | 11 | 16 | 12 | 6 |
| event-loop | 0 | 8 | 11 | 14 | 12 |
| modern-features | 1 | 9 | 11 | 12 | 14 |
| performance-memory | 0 | 4 | 12 | 22 | 10 |
| dom-browser | 1 | 11 | 15 | 14 | 7 |
| coding-patterns | 1 | 10 | 20 | 17 | 0 |

## 3. Writing plan

Every `missing` or `partial` catalog entry, most-asked first. `n` is the number of new questions to write. Formats: output, debug, implementation choice, true statement, scenario. Entries marked `interview-room-only` cannot become a fair multiple-choice question and are skipped.

| # | Key | Freq | Coverage | Level | Skill | Format | n |
|---|---|---|---|---|---|---|---|
| 1 | `js-web-performance` | very-common | partial | L3 | performance-memory | true statement + output | 2 |
| 2 | `js-array-method-polyfills` | very-common | partial | L2 | coding-patterns | implementation choice + debug | 2 |
| 3 | `js-infinite-currying-sum` | very-common | missing | L3 | coding-patterns | implementation choice + debug | 3 |
| 4 | `js-mc-todo-app` | very-common | missing | L2 | dom-browser | implementation choice + debug | 3 |
| 5 | `js-promise-from-scratch` | very-common | partial | L4 | async-promises | implementation choice + debug | 2 |
| 6 | `js-dom-crud` | very-common | partial | L1 | dom-browser | true statement + output | 2 |
| 7 | `js-mc-infinite-scroll` | very-common | partial | L3 | dom-browser | implementation choice + debug | 2 |
| 8 | `js-critical-rendering-path` | very-common | partial | L3 | dom-browser | true statement + output | 2 |
| 9 | `js-map-filter-reduce` | very-common | partial | L1 | collections | true statement + output | 2 |
| 10 | `js-mc-typeahead` | very-common | partial | L2 | dom-browser | implementation choice + debug | 2 |
| 11 | `js-promise-combinator-polyfills` | very-common | partial | L3 | coding-patterns | implementation choice + debug | 2 |
| 12 | `js-inflight-dedupe-cache` | very-common | missing | L4 | coding-patterns | implementation choice + debug | 3 |
| 13 | `js-mc-carousel` | very-common | missing | L2 | dom-browser | implementation choice + debug | 3 |
| 14 | `js-get-elements-by-classname` | very-common | missing | L3 | dom-browser | implementation choice + debug | 3 |
| 15 | `js-sd-autocomplete` | very-common | partial | L4 | dom-browser | scenario + true statement | 2 |
| 16 | `js-recursion-basics` | very-common | partial | L1 | coding-patterns | implementation choice + debug | 2 |
| 17 | `js-debug-vanilla-code` | very-common | partial | L2 | coding-patterns | interview-room-only | 0 |
| 18 | `js-mc-accordion-tabs` | very-common | missing | L2 | dom-browser | implementation choice + debug | 3 |
| 19 | `js-hackerrank-oa` | very-common | missing | L2 | coding-patterns | interview-room-only | 0 |
| 20 | `js-sd-fast-secure-app` | very-common | missing | L5 | performance-memory | interview-room-only | 0 |
| 21 | `js-map-vs-foreach` | very-common | partial | L1 | collections | true statement + output | 2 |
| 22 | `js-mc-file-explorer` | very-common | missing | L2 | dom-browser | implementation choice + debug | 3 |
| 23 | `js-mc-progress-bar` | very-common | missing | L2 | dom-browser | implementation choice + debug | 3 |
| 24 | `js-mc-grid-game` | very-common | missing | L3 | coding-patterns | implementation choice + debug | 3 |
| 25 | `js-setinterval-via-settimeout` | very-common | partial | L3 | event-loop | implementation choice + debug | 2 |
| 26 | `js-palindrome` | common | missing | L1 | coding-patterns | implementation choice + debug | 2 |
| 27 | `js-flatten-object` | common | missing | L3 | coding-patterns | implementation choice + debug | 2 |
| 28 | `js-higher-order-functions` | common | partial | L1 | functions-closures | true statement | 1 |
| 29 | `js-object-creation-ways` | common | partial | L1 | objects-prototypes | true statement | 1 |
| 30 | `js-what-is-polyfill` | common | missing | L2 | coding-patterns | true statement + output | 2 |
| 31 | `js-mc-chat-ui` | common | missing | L2 | dom-browser | interview-room-only | 0 |
| 32 | `js-mc-star-rating` | common | missing | L2 | dom-browser | implementation choice + debug | 2 |
| 33 | `js-form-validation` | common | partial | L1 | dom-browser | implementation choice | 1 |
| 34 | `js-extend-array-prototype` | common | partial | L2 | objects-prototypes | implementation choice | 1 |
| 35 | `js-execution-context` | common | partial | L2 | functions-closures | true statement | 1 |
| 36 | `js-fetch-group-render` | common | missing | L2 | dom-browser | implementation choice + debug | 2 |
| 37 | `js-currying-vs-partial` | common | partial | L3 | functions-closures | true statement | 1 |
| 38 | `js-object-create-polyfill` | common | partial | L3 | objects-prototypes | implementation choice | 1 |
| 39 | `js-json-to-dom` | common | missing | L3 | dom-browser | implementation choice + debug | 2 |
| 40 | `js-clear-all-timeouts` | common | missing | L4 | event-loop | implementation choice + debug | 2 |
| 41 | `js-redux-store` | common | missing | L4 | coding-patterns | implementation choice + debug | 2 |
| 42 | `js-fizzbuzz` | common | missing | L1 | coding-patterns | implementation choice + debug | 2 |
| 43 | `js-what-is-javascript` | common | missing | L1 | dom-browser | interview-room-only | 0 |
| 44 | `js-classnames-helper` | common | missing | L2 | coding-patterns | implementation choice + debug | 2 |
| 45 | `js-mc-otp-input` | common | missing | L2 | dom-browser | implementation choice + debug | 2 |
| 46 | `js-mc-data-table` | common | missing | L2 | dom-browser | implementation choice + debug | 2 |
| 47 | `js-after-before-n-calls` | common | missing | L2 | coding-patterns | implementation choice + debug | 2 |
| 48 | `js-case-convert-keys` | common | missing | L3 | coding-patterns | implementation choice + debug | 2 |
| 49 | `js-paginated-fetch` | common | missing | L3 | async-promises | implementation choice + debug | 2 |
| 50 | `js-two-way-binding` | common | missing | L3 | modern-features | implementation choice + debug | 2 |
| 51 | `js-virtualized-list` | common | missing | L3 | performance-memory | true statement + output | 2 |
| 52 | `js-chainable-calculator` | common | missing | L3 | coding-patterns | implementation choice + debug | 2 |
| 53 | `js-dom-corresponding-node` | common | missing | L4 | dom-browser | implementation choice + debug | 2 |
| 54 | `js-sd-analytics-sdk` | common | partial | L4 | dom-browser | scenario | 1 |
| 55 | `js-clickjacking` | common | missing | L4 | dom-browser | true statement + output | 2 |
| 56 | `js-arch-large-codebase-perf` | common | partial | L5 | performance-memory | interview-room-only | 0 |
| 57 | `js-third-party-scripts` | common | missing | L5 | dom-browser | scenario + true statement | 2 |
| 58 | `js-pass-by-value` | common | missing | L1 | types-coercion | output + true statement | 2 |
| 59 | `js-mc-stopwatch` | common | missing | L1 | event-loop | implementation choice + debug | 2 |
| 60 | `js-at-concat-polyfill` | common | missing | L2 | coding-patterns | implementation choice + debug | 2 |
| 61 | `js-mouseenter-vs-mouseover` | common | missing | L2 | dom-browser | true statement + output | 2 |
| 62 | `js-mc-modal` | common | missing | L2 | dom-browser | implementation choice + debug | 2 |
| 63 | `js-precise-type` | common | partial | L2 | types-coercion | implementation choice | 1 |
| 64 | `js-url-query-params` | common | partial | L2 | dom-browser | implementation choice | 1 |
| 65 | `js-settimeout-call-vs-fn` | common | missing | L2 | event-loop | output + true statement | 2 |
| 66 | `js-template-interpolation` | common | missing | L2 | coding-patterns | implementation choice + debug | 2 |
| 67 | `js-service-worker` | common | partial | L3 | dom-browser | true statement | 1 |
| 68 | `js-finally-polyfill` | common | partial | L3 | async-promises | implementation choice | 1 |
| 69 | `js-mc-transfer-list` | common | missing | L3 | dom-browser | implementation choice + debug | 2 |
| 70 | `js-data-merge-utils` | common | missing | L3 | collections | implementation choice + debug | 2 |
| 71 | `js-browser-history-ds` | common | missing | L3 | coding-patterns | implementation choice + debug | 2 |
| 72 | `js-spa-seo` | common | missing | L3 | dom-browser | interview-room-only | 0 |
| 73 | `js-feature-detection` | common | missing | L3 | dom-browser | true statement + output | 2 |
| 74 | `js-websockets-sse` | common | missing | L3 | dom-browser | true statement + output | 2 |
| 75 | `js-priority-queue` | common | partial | L3 | coding-patterns | implementation choice | 1 |
| 76 | `js-get-elements-by-style` | common | missing | L4 | dom-browser | implementation choice + debug | 2 |
| 77 | `js-curry-placeholder` | common | missing | L4 | coding-patterns | implementation choice + debug | 2 |
| 78 | `js-json-stringify-impl` | common | missing | L4 | coding-patterns | implementation choice + debug | 2 |
| 79 | `js-race-conditions-stale` | common | partial | L4 | async-promises | debug | 1 |
| 80 | `js-lazyman-chain` | common | missing | L4 | async-promises | implementation choice + debug | 2 |
| 81 | `js-generators-as-coroutines` | common | partial | L4 | modern-features | true statement | 1 |
| 82 | `js-fake-timers-spy` | common | missing | L4 | coding-patterns | implementation choice + debug | 2 |
| 83 | `js-fibonacci-memo` | occasional | partial | L1 | coding-patterns | implementation choice | 1 |
| 84 | `js-window-vs-document` | occasional | missing | L1 | dom-browser | true statement | 1 |
| 85 | `js-freeze-nested` | occasional | partial | L2 | objects-prototypes | output | 1 |
| 86 | `js-groupby-implement` | occasional | partial | L2 | collections | implementation choice | 1 |
| 87 | `js-call-after-delay` | occasional | missing | L2 | coding-patterns | implementation choice | 1 |
| 88 | `js-mc-cursor-circle` | occasional | missing | L2 | dom-browser | implementation choice | 1 |
| 89 | `js-regex-string-problem` | occasional | partial | L2 | modern-features | implementation choice | 1 |
| 90 | `js-fetch-loading-error-states` | occasional | partial | L2 | dom-browser | debug | 1 |
| 91 | `js-max-consecutive-ones` | occasional | missing | L2 | coding-patterns | implementation choice | 1 |
| 92 | `js-resolve-function-values` | occasional | missing | L3 | coding-patterns | implementation choice | 1 |
| 93 | `js-call-until-non-function` | occasional | missing | L3 | coding-patterns | implementation choice | 1 |
| 94 | `js-dom-is-descendant` | occasional | missing | L3 | dom-browser | implementation choice | 1 |
| 95 | `js-dom-tree-height` | occasional | missing | L3 | dom-browser | implementation choice | 1 |
| 96 | `js-get-script` | occasional | missing | L3 | dom-browser | implementation choice | 1 |
| 97 | `js-key-sequence-detect` | occasional | missing | L3 | dom-browser | implementation choice | 1 |
| 98 | `js-shadow-dom` | occasional | partial | L3 | dom-browser | true statement | 1 |
| 99 | `js-bandwidth-latency` | occasional | missing | L3 | dom-browser | interview-room-only | 0 |
| 100 | `js-mc-calendar` | occasional | missing | L3 | dom-browser | implementation choice | 1 |
| 101 | `js-mc-poll-widget` | occasional | missing | L3 | dom-browser | interview-room-only | 0 |
| 102 | `js-mc-expense-tracker` | occasional | missing | L3 | dom-browser | interview-room-only | 0 |
| 103 | `js-rate-limiter` | occasional | missing | L4 | coding-patterns | implementation choice | 1 |
| 104 | `js-dom-lca` | occasional | missing | L4 | dom-browser | implementation choice | 1 |
| 105 | `js-css-selector-path` | occasional | missing | L4 | dom-browser | implementation choice | 1 |
| 106 | `js-min-html-tags` | occasional | missing | L4 | coding-patterns | implementation choice | 1 |
| 107 | `js-sd-calculator` | occasional | missing | L4 | coding-patterns | interview-room-only | 0 |
| 108 | `js-sd-api-contract` | occasional | missing | L4 | dom-browser | interview-room-only | 0 |
| 109 | `js-third-party-iframes` | occasional | partial | L5 | dom-browser | scenario | 1 |
| 110 | `js-slice-vs-splice` | occasional | partial | L1 | collections | true statement | 1 |
| 111 | `js-queryselector-vs-getelementbyid` | occasional | partial | L1 | dom-browser | true statement | 1 |
| 112 | `js-count-nested-comments` | occasional | missing | L2 | coding-patterns | implementation choice | 1 |
| 113 | `js-merge-intervals` | occasional | missing | L2 | coding-patterns | implementation choice | 1 |
| 114 | `js-pausable-timer` | occasional | missing | L2 | event-loop | implementation choice | 1 |
| 115 | `js-mc-traffic-light` | occasional | missing | L2 | event-loop | implementation choice | 1 |
| 116 | `js-big-number-add` | occasional | missing | L2 | coding-patterns | implementation choice | 1 |
| 117 | `js-number-format` | occasional | partial | L2 | coding-patterns | implementation choice | 1 |
| 118 | `js-semver-compare` | occasional | missing | L2 | coding-patterns | implementation choice | 1 |
| 119 | `js-chunk-shuffle` | occasional | partial | L2 | collections | implementation choice | 1 |
| 120 | `js-set-path` | occasional | missing | L3 | coding-patterns | implementation choice | 1 |
| 121 | `js-mc-lights-grid` | occasional | missing | L3 | dom-browser | implementation choice | 1 |
| 122 | `js-storage-expiry` | occasional | missing | L3 | dom-browser | implementation choice | 1 |
| 123 | `js-testing-async` | occasional | missing | L3 | async-promises | true statement | 1 |
| 124 | `js-highlight-keywords` | occasional | missing | L3 | coding-patterns | implementation choice | 1 |
| 125 | `js-console-log-intercept` | occasional | missing | L4 | functions-closures | implementation choice | 1 |
| 126 | `js-chainable-api-client` | occasional | missing | L4 | coding-patterns | implementation choice | 1 |
| 127 | `js-kv-transactions` | occasional | missing | L4 | coding-patterns | implementation choice | 1 |
| 128 | `js-sdk-throttle-retry` | occasional | partial | L4 | coding-patterns | implementation choice | 1 |
| 129 | `js-mc-nested-checkboxes` | occasional | missing | L4 | dom-browser | implementation choice | 1 |
| 130 | `js-observable-model` | occasional | missing | L4 | coding-patterns | implementation choice | 1 |
| 131 | `js-observable-impl` | occasional | missing | L4 | coding-patterns | implementation choice | 1 |
| 132 | `js-immutability-helper` | occasional | partial | L4 | collections | implementation choice | 1 |
| 133 | `js-trie` | occasional | missing | L4 | coding-patterns | implementation choice | 1 |

## 4. Planned new questions per skill

| Skill | New questions |
|---|---|
| types-coercion | 3 |
| objects-prototypes | 4 |
| functions-closures | 4 |
| collections | 10 |
| async-promises | 9 |
| event-loop | 10 |
| modern-features | 4 |
| performance-memory | 4 |
| dom-browser | 76 |
| coding-patterns | 66 |
| **Total** | **190** |

By role level: L1 23, L2 62, L3 61, L4 41, L5 3.

Allocation rule: very-common missing 3, very-common partial 2, common missing 2, common partial 1, occasional 1. Machine-coding entries become "pick the correct piece of the implementation" or "spot the bug" questions about one core part (for example, the carousel index wrap or the OTP backspace handler), not the whole app.
