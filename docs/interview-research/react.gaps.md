# React: interview gap analysis and writing plan

Sources: `react-firsthand.json` (195 entries) and `react-lists.json` (249 entries), merged into `react.catalog.json`. Bank: `content/exams/react/` (489 questions). Role levels for the bank are in `react.tags.json`.

Frequency follows GAP-BRIEF. Evidence typed `company-tagged` or `company-list` counts as list (tier 2) evidence. Duplicate URLs across merged entries count once.

## 1. Totals

Catalog size: **223** distinct interview questions (444 raw entries merged). Covered **79**, partial **52**, missing **92**.

### By role level

| Level | Covered | Partial | Missing | Total |
|---|---|---|---|---|
| L1 | 10 | 13 | 7 | 30 |
| L2 | 33 | 15 | 27 | 75 |
| L3 | 25 | 17 | 31 | 73 |
| L4 | 10 | 7 | 17 | 34 |
| L5 | 1 | 0 | 10 | 11 |

### By frequency

| Frequency | Covered | Partial | Missing | Total |
|---|---|---|---|---|
| very-common | 49 | 34 | 27 | 110 |
| common | 25 | 13 | 43 | 81 |
| occasional | 5 | 5 | 22 | 32 |

Machine-coding rounds are the biggest single gap. 47 catalog entries are machine-coding builds (todo, typeahead, file explorer, carousel, progress bars and so on), and only a few (the todo key bug, the typeahead race, the interval timer) are touched by the bank. 35 have no bank question at all. Frontend system design (18 entries) is the second gap.

## 2. Role-level distribution of the existing bank

| Level | Questions | Share | Matched to a real interview ask |
|---|---|---|---|
| L1 | 21 | 4% | 21 |
| L2 | 98 | 20% | 97 |
| L3 | 196 | 40% | 187 |
| L4 | 130 | 27% | 115 |
| L5 | 44 | 9% | 21 |
| Total | 489 | 100% | 441 |

Rule used: a question that matches a catalog entry gets the higher of the entry's role level and its own difficulty (difficulty 4 on an L4+ topic goes to L5). A question with no interview match goes one level above its difficulty, so unasked deep questions land at L4 or L5. 38 bank questions sit at L4 or L5 with no matching interview ask: effect ordering with insertion effects, `<Activity>`, React 19 stylesheet precedence and custom elements, Next.js caching and `revalidateTag` details, user-event internals, Profiler arguments and similar. The bank is thin at L1 (21 questions) and heavy at L3 to L4, while interviews for freshers and SDE-1 roles lean on machine-coding builds and fundamentals. Most of the writing plan targets L1 to L3 machine-coding logic.

## 3. Writing plan

Planned questions per entry, very-common first, then by level. Formats: output, debug, implementation choice, true statement, scenario. Machine-coding entries (`rx-mc-*`) are planned as MCQs about the core logic or the classic bug of that build, not as the build itself.

### very-common

| Key | Level | Skill | Coverage | Format | New Qs | Angle |
|---|---|---|---|---|---|---|
| `rx-what-is-react` | L1 | jsx-components | missing | true statement | 2 | React is a UI library (not a framework): declarative components, one-way data flow, what it does not provide (routing, data fetching) |
| `rx-function-vs-class-components` | L1 | jsx-components | missing | true statement | 2 | Hooks vs lifecycle methods, `this` binding bugs in classes, what still needs a class (error boundaries) |
| `rx-mc-accordion` | L1 | state-updates | missing | implementation choice | 3 | Single-open via openIndex vs multi-open via a Set (new Set on update); aria-expanded and aria-controls |
| `rx-mc-star-rating` | L1 | state-updates | missing | implementation choice | 3 | Filled stars derived from hover ?? rating; controlled value/onChange API for forms; keyboard and radio-group semantics |
| `rx-virtual-dom` | L1 | rendering | partial | true statement | 3 | What the virtual DOM really is (a tree of plain objects), why it is not automatically faster than direct DOM updates, and where diffing happens vs DOM writes |
| `rx-state-vs-props` | L1 | state-updates | partial | true statement | 2 | Who owns and may change props vs state; what happens when a child mutates a prop |
| `rx-one-way-data-flow` | L1 | state-updates | partial | implementation choice | 2 | Child-to-parent via callback prop; sibling sharing by lifting state to the common parent |
| `rx-api-calls-loading-error` | L1 | effects | partial | debug | 3 | async function passed straight to useEffect; loading flag never reset on error (use finally); fetch does not reject on 404 |
| `rx-mc-todo` | L1 | rendering | partial | debug | 3 | Index keys with editable rows; ids generated with Date.now collisions vs crypto.randomUUID; filtered view derived instead of stored; toggle done immutably |
| `rx-mc-counters-shared` | L1 | state-updates | partial | implementation choice | 2 | N buttons with own counts plus a global total: one array of counts in the parent, total derived not stored |
| `rx-mc-tabs` | L1 | patterns-testing | partial | implementation choice | 2 | Active tab state and role=tablist/tab/tabpanel; syncing the active tab with the URL search param |
| `rx-react-router-basics` | L1 | patterns-testing | partial | implementation choice | 2 | Route params with useParams, programmatic navigate, catch-all 404 route |
| `rx-children-composition` | L1 | jsx-components | partial | implementation choice | 2 | Pass content as children / element props instead of extra props or inheritance; slots pattern |
| `rx-promise-all-in-react` | L2 | effects | missing | scenario | 2 | Dashboard loading several APIs: Promise.all fail-fast vs Promise.allSettled for partial UI; sequential awaits create a waterfall |
| `rx-mc-carousel` | L2 | effects | missing | debug | 3 | Wrap-around index with modulo (including negative); autoplay interval restarted after manual navigation; interval cleared on unmount |
| `rx-mc-tic-tac-toe` | L2 | state-updates | missing | implementation choice | 3 | Winner derived from the board (not stored in state); copy the board before writing a move; generalised N x N win check |
| `rx-component-design-from-figma` | L2 | jsx-components | missing | scenario | 2 | Pick which card values are props, which are local state and which are callbacks |
| `rx-mc-pagination` | L2 | state-updates | missing | implementation choice | 3 | Slice math for the current page; page-number range with ellipsis; reset to page 1 when the filter changes |
| `rx-window-resize` | L2 | hooks-advanced | missing | implementation choice | 2 | useWindowSize with listener cleanup and throttling; SSR-safe initial value |
| `rx-mc-otp-input` | L2 | effects | missing | implementation choice | 3 | Array of refs for auto-focus to the next box; backspace moves back; paste splits digits across boxes |
| `rx-prop-drilling` | L2 | state-management | partial | scenario | 2 | Fix drilling with composition (pass the element down) before reaching for Context |
| `rx-lifecycle-hooks-mapping` | L2 | effects | partial | true statement | 2 | componentDidMount/DidUpdate/WillUnmount to useEffect; useEffect([]) is not exactly componentDidMount (runs after paint, StrictMode double-run) |
| `rx-usefetch-hook` | L2 | hooks-advanced | partial | implementation choice | 3 | useFetch with ignore flag / AbortController; options object in deps refetch loop; returning data, loading, error consistently |
| `rx-debounce-implement` | L2 | performance | partial | debug | 3 | Debounce created inside the component body is recreated every render (fix with useMemo/useRef); clearing the timer on unmount; pick the correct debounce implementation |
| `rx-redux-data-flow` | L2 | state-management | partial | output | 2 | Order of action, dispatch, reducer, store update and subscriber re-render; reducer must be pure |
| `rx-mc-stopwatch-timer` | L2 | effects | partial | debug | 3 | Interval drift (derive elapsed from Date.now); keep the interval id in a ref and clear on pause/unmount; HH:MM:SS formatting with padStart |
| `rx-mc-interdependent-fields` | L2 | state-updates | partial | scenario | 2 | Store the one source value and derive the others (currency converter) instead of syncing fields with effects |
| `rx-forms-validation` | L2 | state-management | partial | implementation choice | 3 | Validate on submit vs on blur with touched state; showing errors accessibly (aria-invalid, aria-describedby); controlled vs React Hook Form trade-off |
| `rx-protected-routes-rbac` | L2 | patterns-testing | partial | implementation choice | 3 | ProtectedRoute redirect with return location; client-side guards are UX not security; where to keep tokens (httpOnly cookie vs localStorage) |
| `rx-mc-modal` | L2 | patterns-testing | partial | debug | 2 | Close on Escape listener cleanup; backdrop click closes but clicks inside do not (target vs currentTarget); return focus to the trigger |
| `rx-mc-infinite-scroll` | L3 | effects | missing | implementation choice | 3 | IntersectionObserver on a sentinel element; guard against duplicate fetches while loading; disconnect on cleanup and stale page closures |
| `rx-mc-data-table` | L3 | state-updates | missing | debug | 3 | Array.prototype.sort mutates state; derive filtered+sorted rows with useMemo; sort stability and toggling direction |
| `rx-mc-progress-bars` | L3 | effects | missing | implementation choice | 3 | Animate width with a CSS transition vs an interval; queue that runs at most K bars at once; starting the next bar when one finishes |
| `rx-mc-drag-drop-kanban` | L3 | state-updates | missing | implementation choice | 2 | Immutable reorder helper (remove then insert at index, across columns); keyboard alternative for drag and drop |
| `rx-mc-config-driven-form` | L3 | jsx-components | missing | implementation choice | 2 | Map from field type to component; values keyed by field name; conditional fields from schema rules |
| `rx-mc-board-games` | L3 | state-updates | missing | debug | 3 | Fast double clicks with stale state (use functional updates); Connect Four drop to the lowest empty row; Wordle colouring with repeated letters |
| `rx-web-vitals` | L3 | performance | missing | true statement | 3 | What LCP, CLS and INP measure; CLS from images without dimensions; improving INP by splitting long tasks and transitions |
| `rx-memoize-function-cache` | L3 | performance | missing | implementation choice | 2 | Memoise by a serialised argument key; cache the promise (not the result) to dedupe concurrent API calls |
| `rx-optimise-large-app` | L3 | performance | partial | scenario | 2 | Measure first (Profiler, field data) and fix the biggest cost before memoising everything |
| `rx-large-lists-virtualization` | L3 | performance | partial | implementation choice | 3 | Windowing maths (startIndex from scrollTop / rowHeight, overscan); variable row heights need measurement; pagination vs infinite scroll vs virtualization |
| `rx-fiber` | L3 | rendering | partial | true statement | 2 | What Fiber enabled: incremental, interruptible rendering and priorities, not a faster diff |
| `rx-react-query-server-state` | L3 | state-management | partial | scenario | 2 | Why API data does not belong in Redux; a minimal query cache keyed by queryKey with dedupe and staleTime |
| `rx-pubsub-store` | L3 | state-management | partial | implementation choice | 3 | createStore with subscribe returning unsubscribe; connecting it with useSyncExternalStore; notify only on change |
| `rx-mc-typeahead` | L3 | effects | partial | debug | 3 | Stale response overwrites newer results (ignore flag / AbortController / latest-request id); cache results in a Map by query; keyboard highlight index bounds and reset on new results |
| `rx-mc-file-explorer` | L3 | rendering | partial | implementation choice | 3 | Recursive Folder component with stable keys; expanded state per node id; adding a node immutably deep in the tree vs a normalised map |
| `rx-mc-nested-comments` | L3 | state-updates | partial | implementation choice | 3 | Recursive Comment rendering; immutable insert of a reply at depth; normalised comments by id with parentId |
| `rx-page-load-performance` | L3 | performance | partial | scenario | 2 | Slow first load: bundle analysis, route splitting, image sizing/lazy loading, CDN caching |
| `rx-csr-ssr-ssg` | L3 | server-components | partial | scenario | 3 | Choose CSR, SSR, SSG or ISR for a dashboard, a product page and a blog; why SSR helps first paint and SEO |
| `rx-bundlers-tooling` | L3 | performance | partial | true statement | 2 | What Babel, Webpack and Vite each do; why tree shaking needs ES modules |
| `rx-sd-chat` | L4 | state-management | missing | scenario | 3 | WebSocket with reconnect and backoff; messages normalised by id with optimistic pending sends; virtualised message list |
| `rx-sd-news-feed` | L4 | performance | missing | scenario | 3 | Cursor pagination with infinite scroll; virtualising a long feed; optimistic likes and new-post banner instead of jumping |
| `rx-hooks-order-internals` | L4 | hooks-advanced | partial | implementation choice | 3 | A tiny useState built on an array plus a cursor; why a hook inside an if shifts every later slot |
| `rx-design-system` | L4 | patterns-testing | partial | scenario | 2 | Theming via CSS variables / tokens, accessible headless primitives, semver for breaking prop changes |
| `rx-sd-typeahead` | L4 | performance | partial | scenario | 2 | Debounce + cache + race handling + combobox ARIA for a search component |
| `rx-web-service-workers` | L4 | performance | partial | true statement | 2 | Web worker for CPU work vs service worker for caching/offline; neither can touch the DOM |
| `rx-micro-frontends` | L5 | patterns-testing | missing | scenario | 3 | Module Federation shared React as a singleton; two copies of React break hooks; when micro-frontends are not worth it |
| `rx-sd-collab-editor` | L5 | state-management | missing | true statement | 2 | OT vs CRDT for concurrent edits; batching operations and presence |

### common

| Key | Level | Skill | Coverage | Format | New Qs | Angle |
|---|---|---|---|---|---|---|
| `rx-lifting-state-up` | L1 | state-updates | partial | scenario | 1 | Two inputs that must stay in sync: pick where the state lives |
| `rx-mc-like-button` | L1 | hooks-advanced | partial | debug | 2 | Double-click sends two requests (disable while pending); optimistic toggle rolled back on error |
| `rx-styling-approaches` | L1 | jsx-components | partial | true statement | 1 | CSS Modules scoping vs global CSS vs utility classes vs runtime CSS-in-JS |
| `rx-usethrottle-hook` | L2 | hooks-advanced | missing | implementation choice | 2 | Throttle a scroll handler: leading call then ignore until the window passes; trailing call behaviour |
| `rx-mc-multistep-form` | L2 | state-updates | missing | implementation choice | 2 | Keep all steps' data in one parent state so going back keeps values; per-step validation before next |
| `rx-mc-shopping-cart` | L2 | state-updates | missing | implementation choice | 2 | Cart totals derived from items; quantity update by id immutably; floating-point money in paise/cents |
| `rx-mc-nested-checkboxes` | L2 | state-updates | missing | implementation choice | 2 | Parent checked state derived from children; indeterminate must be set through a ref (not an attribute) |
| `rx-mc-color-picker` | L2 | jsx-components | missing | implementation choice | 1 | Controlled swatch selection with the preview derived from the selected value |
| `rx-mc-poll-widget` | L2 | state-updates | missing | implementation choice | 1 | Percentages derived from vote counts; vote once guarded by state and persisted |
| `rx-react-vs-nextjs` | L2 | server-components | missing | true statement | 1 | What Next.js adds on top of React (routing, server rendering, bundling) and why that helps SEO |
| `rx-vdom-vs-shadow-dom` | L2 | rendering | missing | true statement | 1 | Virtual DOM is React's in-memory diffing; Shadow DOM is a browser encapsulation feature for web components |
| `rx-useclickoutside` | L2 | hooks-advanced | missing | debug | 2 | ref.current.contains(event.target) check; listener cleanup; clicks inside a portal count as outside |
| `rx-usehover-keypress` | L2 | hooks-advanced | missing | implementation choice | 1 | useKeyPress listener with cleanup and correct dependency on the target key |
| `rx-mc-traffic-light` | L2 | effects | missing | implementation choice | 2 | Config of {colour, duration, next} driving a chained setTimeout in an effect with cleanup |
| `rx-mc-calculator` | L2 | state-updates | missing | debug | 1 | Avoid eval; keep display and pending operator as state; chained operations |
| `rx-mc-transfer-list` | L2 | state-updates | missing | implementation choice | 2 | Moving selected items between lists immutably; selection stored as ids in a Set |
| `rx-pure-component-shallow-compare` | L2 | performance | partial | output | 1 | PureComponent / shallow compare with a mutated array prop: no re-render |
| `rx-mc-dropdown-select` | L2 | patterns-testing | partial | debug | 2 | Close on outside click and Escape; keyboard highlight and aria-activedescendant; controlled value API |
| `rx-container-presentational` | L2 | patterns-testing | partial | true statement | 1 | Container/presentational split today: custom hooks take over the container role |
| `rx-router-modes-nested` | L2 | patterns-testing | partial | true statement | 2 | BrowserRouter vs HashRouter on static hosting; nested layout routes need an Outlet |
| `rx-usetoggle-usearray` | L2 | hooks-advanced | partial | implementation choice | 1 | useArray helpers must return new arrays (push via spread, remove via filter) and stable callbacks |
| `rx-intersection-observer-visibility` | L3 | effects | missing | implementation choice | 2 | Lazy-render or log impressions with IntersectionObserver thresholds; unobserve after first sight |
| `rx-redux-middleware-thunk` | L3 | state-management | missing | implementation choice | 2 | Thunk receives dispatch and getState; dispatching pending/fulfilled/rejected around an async call |
| `rx-cursor-vs-offset-pagination` | L3 | state-management | missing | true statement | 1 | Why offset pagination duplicates or skips items in a live feed and cursors do not |
| `rx-mc-grid-lights` | L3 | effects | missing | implementation choice | 2 | Store activation order in an array; deactivate in reverse with timeouts and clear them on unmount |
| `rx-mc-calendar` | L3 | state-updates | missing | implementation choice | 1 | Laying out overlapping events in columns; computing week days from a date |
| `rx-mc-chat-ui` | L3 | effects | missing | implementation choice | 2 | Auto-scroll to the bottom after new messages commit (ref + layout effect, only when already at bottom); appending streamed tokens with functional updates |
| `rx-mc-live-feed` | L3 | state-updates | missing | implementation choice | 1 | Re-sort by score with pinned posts first, without mutating the source array |
| `rx-mc-notifications-panel` | L3 | state-management | missing | scenario | 1 | Unread count derived from the list; mark-as-read optimistic update; live updates via WebSocket subscription cleanup |
| `rx-mc-load-more-pagination` | L3 | effects | missing | implementation choice | 2 | Load more with a nextPageToken / ID list: append pages, stop when no token, avoid double appends in StrictMode |
| `rx-undo-redo` | L3 | state-updates | missing | implementation choice | 2 | past/present/future history in a reducer; a new edit clears the redo stack |
| `rx-retry-helper` | L3 | effects | missing | implementation choice | 1 | Retry with exponential backoff that stops on abort and only retries retryable errors |
| `rx-mc-crud` | L3 | state-updates | missing | implementation choice | 1 | Update/delete by id immutably; optimistic delete with rollback |
| `rx-i18n` | L3 | patterns-testing | missing | true statement | 1 | Locale-aware formatting with Intl and loading translation bundles lazily |
| `rx-sd-reusable-widget` | L3 | patterns-testing | missing | scenario | 1 | Embeddable widget: iframe vs script with Shadow DOM for style isolation |
| `rx-test-hooks-context` | L3 | patterns-testing | partial | implementation choice | 1 | renderHook with a wrapper that supplies the Provider or store |
| `rx-skip-first-render-ismounted` | L3 | hooks-advanced | partial | true statement | 1 | useUpdateEffect with a ref flag; why an isMounted check before setState is a smell (cancel instead) |
| `rx-sd-ecommerce` | L4 | state-management | missing | scenario | 2 | SSG/ISR product pages for SEO with client-side cart; cart persistence across sessions |
| `rx-sd-kanban` | L4 | state-management | missing | scenario | 2 | Normalised board state (columns hold card ids); optimistic move with rollback |
| `rx-sd-ai-chat-streaming` | L4 | effects | missing | implementation choice | 2 | Read a fetch ReadableStream and append chunks with a functional update; cancel with AbortController |
| `rx-analytics-sdk-batching` | L4 | patterns-testing | missing | implementation choice | 2 | Queue events in a module singleton, flush by size or time, and send on pagehide with sendBeacon |
| `rx-dom-tree-matching` | L4 | rendering | missing | implementation choice | 2 | Record the child-index path from the node up to the root, then replay it down the other tree |
| `rx-sd-video-streaming` | L4 | performance | missing | scenario | 1 | Adaptive bitrate streaming and preloading the next item without blocking the main UI |
| `rx-sd-email-client` | L4 | state-management | missing | scenario | 1 | Normalised threads and messages with a virtualised list and optimistic read state |
| `rx-expensive-computation-responsive` | L4 | performance | partial | scenario | 1 | Move heavy work to a Web Worker or chunk it; transitions only help rendering work |
| `rx-reflow-repaint` | L4 | performance | partial | true statement | 1 | Layout thrash from reading layout after writes; transform/opacity skip layout |
| `rx-config-driven-ui` | L5 | patterns-testing | missing | scenario | 1 | Registry mapping server-sent component types to client components with a safe fallback |
| `rx-sd-calendar` | L5 | state-management | missing | scenario | 2 | Overlapping event layout; storing recurrence rules and expanding them per visible range |
| `rx-sd-drawing-tool` | L5 | performance | missing | scenario | 1 | Canvas vs DOM/SVG rendering for thousands of shapes |
| `rx-perf-budgets-monitoring` | L5 | performance | missing | true statement | 1 | Lab (Lighthouse) vs field (RUM) data and enforcing bundle budgets in CI |

### occasional

| Key | Level | Skill | Coverage | Format | New Qs | Angle |
|---|---|---|---|---|---|---|
| `rx-mc-theme-toggle` | L1 | state-management | missing | debug | 1 | Persisting the theme in localStorage and the flash of the wrong theme on load (read before paint) |
| `rx-mc-mouse-follow` | L2 | performance | missing | implementation choice | 1 | Throttle pointer updates with requestAnimationFrame or update style via a ref instead of state |
| `rx-nextjs-routing` | L2 | server-components | missing | implementation choice | 1 | App Router folder conventions: page.tsx, layout.tsx, [id] dynamic segments |
| `rx-mc-click-limit-button` | L2 | effects | missing | debug | 1 | Click counter reset after a cooldown timeout; clearing the timeout on unmount |
| `rx-classnames-utility` | L2 | jsx-components | missing | implementation choice | 1 | Join truthy class names from strings, arrays and object maps |
| `rx-mc-toast` | L3 | effects | missing | implementation choice | 1 | Toast queue with auto-dismiss timers cleared on manual close/unmount |
| `rx-dynamic-field-arrays` | L3 | state-updates | missing | debug | 1 | Field arrays keyed by index lose input values on remove; use stable ids |
| `rx-phone-input-format` | L3 | jsx-components | missing | debug | 1 | Formatting a controlled input on change makes the caret jump to the end |
| `rx-useidle` | L3 | hooks-advanced | missing | implementation choice | 1 | Reset an inactivity timer on activity events, with listener and timer cleanup |
| `rx-write-tests-for-component` | L3 | patterns-testing | partial | implementation choice | 1 | Testing a typeahead: type with userEvent, wait with findBy, assert the request count |
| `rx-d3-integration` | L3 | effects | partial | implementation choice | 1 | Let D3 own a ref'd SVG node inside an effect with cleanup, or use D3 only for maths |
| `rx-mc-popover` | L3 | effects | partial | true statement | 1 | Measure the anchor in useLayoutEffect and render through a portal to escape overflow clipping |
| `rx-sd-book-reader` | L4 | performance | missing | scenario | 1 | Page cache with a bounded size and preloading neighbours |
| `rx-feature-flags` | L4 | patterns-testing | missing | implementation choice | 1 | Flag provider with defaults while loading, gate rendering without layout shift |
| `rx-redux-vs-zustand` | L4 | state-management | partial | true statement | 1 | Zustand selector subscriptions vs Redux Toolkit structure and devtools |
| `rx-sd-huge-dataset` | L5 | performance | missing | scenario | 1 | Canvas/WebGL plus aggregation instead of one DOM node per point |

### interview-room-only (not planned as MCQ)

These are open-ended experience, design or live-build prompts. A fair single-answer MCQ cannot capture them.

- `rx-codebase-extension` (L3, very-common): You get an existing React/Next.js codebase: read the data flow, then add filtering and sorting and fix a performance problem within the hour. *Reading an unfamiliar codebase within an hour; specific bugs are covered by other keys.*
- `rx-component-structure` (L1, very-common): How would you structure components in a project, and how do you create components in React (composition, reusable pieces)? *Folder and component organisation is a matter of team convention; no single correct answer.*
- `rx-project-deep-dive` (L3, very-common): Walk through a past React project: architecture, the hardest problem you solved, and what you would change. *About the candidate's own project.*
- `rx-mc-live-coding-general` (L2, very-common): Build a React component quickly in a CodeSandbox-style screen (mid-level, about an hour), then extend it as the interviewer adds requirements. *Open-ended live coding round; the concrete widgets are planned under their own keys.*
- `rx-hooks-used` (L1, common): Which React hooks have you used in your projects, and what does each one do? *About the candidate's own experience.*
- `rx-framework-migration` (L4, common): How would you plan a migration of a large app from Gatsby (or another framework) to plain React/Next.js? *Migration strategy for a specific legacy codebase; depends heavily on context.*
- `rx-mc-holy-grail-layout` (L1, common): Build a holy-grail layout (header, footer, two sidebars, main) with CSS. *Pure CSS layout task.*
- `rx-sd-travel-music` (L4, common): Frontend system design: design a travel booking site (Airbnb) or music streaming app (Spotify). *Broad product design with no single correct answer.*
- `rx-sd-video-conferencing` (L5, common): Frontend system design: design a video conferencing UI (Zoom). *Mostly WebRTC/media design beyond a fair React MCQ.*
- `rx-sd-radio-framework` (L4, common): What framework do you follow for frontend system design (for example RADIO: requirements, architecture, data model, interface, optimisations)? *About the candidate's interview method, not a fact.*
- `rx-mc-filter-cards` (L2, occasional): Build a two-panel UI: one panel creates coloured cards with title/subtitle (colours from an API), the other filters cards by colour and text. *Its filtering logic is covered by rx-mc-data-table; the rest is open-ended building.*
- `rx-merge-two-stores` (L4, occasional): You need to merge two React projects that each have their own store. How would you do it? *Open-ended architecture discussion.*
- `rx-reuse-web-in-mobile` (L3, occasional): A payment feature exists in a React web app. How would you reuse it in a mobile app without rewriting it? *Open-ended architecture discussion.*
- `rx-jsx-string-to-html` (L3, occasional): Convert a JSX-like string into valid HTML (className to class, htmlFor to for, and so on). *A string-manipulation puzzle; JSX attribute mapping is already covered (JSX-033).*
- `rx-react-versions` (L2, occasional): Which React version are you using, and what changed between the versions you have worked with? *About the candidate's own experience.*
- `rx-code-review-pr` (L5, occasional): Review a pull request from a junior developer (React front end plus API and data model) as a senior engineer. *Live review of a real PR.*
- `rx-mc-photo-album` (L3, occasional): Build a photo album app (albums grid, photo detail, lazy loading). *Generic CRUD/lazy-loading build; angles covered by infinite-scroll and image-loading keys.*
- `rx-reusable-utility-design` (L4, occasional): Design a performance benchmarking utility or a cookie-consent banner as a reusable piece across many apps. *Open-ended design prompt.*
- `rx-payment-sdk-integration` (L4, occasional): Design how you would integrate a third-party payment SDK (for example Stripe) into a React app. *Vendor-specific integration discussion.*
- `rx-sd-end-to-end-feature` (L3, occasional): Design a product feature end-to-end: frontend, backend APIs, HTTP verbs and request/response shapes. *Open-ended full-stack design.*
- `rx-monorepo-scaling` (L5, occasional): How do you scale state management and module boundaries in a React monorepo with several teams? *Organisation-specific architecture discussion.*

## 4. Planned new questions per skill

| Skill | New questions |
|---|---|
| state-updates | 48 |
| effects | 42 |
| performance | 33 |
| state-management | 30 |
| patterns-testing | 27 |
| hooks-advanced | 18 |
| jsx-components | 14 |
| rendering | 14 |
| server-components | 5 |
| **Total** | **231** |

By level: L1 36, L2 74, L3 78, L4 32, L5 11.

Every very-common and common missing or partial entry that can be a fair MCQ gets at least one question. The most-asked very-common entries get 3 from different angles (output, debug, implementation choice). Common entries get 1 or 2, occasional entries 0 or 1.
