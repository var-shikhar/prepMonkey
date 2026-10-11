# Website redesign ideas (reference: prepmonkey.com)

Branch: `website-redesign` · Drafted 2026-10-11

## What PrepMonkey does well

| Pattern | How they use it | Fit for quizzMonkey |
|---|---|---|
| **Mascot as the product's voice** | "Monk" introduces itself in first person: *"I guide you through practice, clarify doubts, generate flashcards…"*, with a different pose per section (sitting, thrilled, lightning) | Strong. We already have a monkey logo (`components/brand/logo.tsx`) and an AI tutor (`components/tutor/tutor-sheet.tsx`) that has no personality yet |
| **Specific headline** | "UPSC and APPSC Preparation, structured around you." Names the audience | Our "Practise like it's exam day." is good but doesn't say *what* we cover |
| **Subject grid with icons** | 10 subject tiles show coverage at a glance | Strong. Lets us show certs, quizzes and interview tracks as one catalogue |
| **One section per feature** | Five features, each with copy and a visual or GIF (e.g. the momentum tracker) | Medium. Our bento grid is denser; real product loops would make it more convincing |
| **Premium block** | "Prepare without limits", with a mascot pose and a benefit list | Strong. `/pricing` exists, but the landing page doesn't sell it |
| **Honest FAQ** | "No platform can guarantee selection" | Strong trust signal. `exam-faq.tsx` exists only on exam pages |
| **Large footer** | Links, legal, contact and 5 social icons | Medium. Our footer is minimal |

Not worth copying: app-store buttons (we're web-only) and stock photos of students. Illustrations suit our warm theme better.

---

## Idea 1: Give the mascot a name and a role ("Bodhi" / "Momo", placeholder names)

- Build `components/brand/mascot.tsx` from the existing `LogoMark` SVG paths, with 4–5 poses as props: `wave`, `thinking`, `celebrate`, `focus`, `sleepy`. The same cocoa and banana gradients keep it on brand.
- Landing page: add a "Meet your study buddy" section after the hero, written in the first person like Monk:
  > "I build your plan, explain every option, and tell you honestly when you're ready."
- Reuse the mascot across the app: empty states (`saved`, `progress`), the result page (`celebrate` for a pass, `thinking` for a near miss), the tutor sheet header, and the 404 page (`sleepy`).
- **Effort:** M · **Impact:** High (gives the brand a personality and a consistent look across the app)

## Idea 2: Hero that names who it's for

- Headline option: **"Certifications, quizzes and interviews, practised the way the real exam works."** Keep "exam day" in the gradient.
- Add a rotating audience word: "Built for **cloud engineers** / **Claude developers** / **job seekers**" (a CSS-only fade using the existing `--animate-reveal`).
- Keep `HeroPreview` on the right, with the mascot peeking from its corner (using the existing `animate-float`).
- Add a trust row under the CTAs with question count, exam count and "every option explained". The data already exists in `page.tsx`.

## Idea 3: "What can you prep?" subject/exam grid

- Replace the "Popular exams" cards with a dense **icon grid** grouped by category tabs: *Certifications · Subject quizzes · Interviews*.
- Each tile shows an icon, the name, the question count and a small "Free diagnostic" badge.
- This works well for SEO: each tile links to `/exams/[id]` and `/exams/[id]/sample-questions`.
- It grows naturally as the subject banks from the roadmap ship.

## Idea 4: Alternating feature stories instead of only a bento grid

Turn 4 key loops into **left/right alternating rows** (text on one side, a live-looking UI snippet on the other):

1. **Diagnostic, then a plan:** an animated readiness gauge (reuse `exam-hub/readiness-gauge.tsx`).
2. **Drills that explain:** a question card that flips to the explanation of each option.
3. **Timed mock:** a timer counting down with a blueprint bar.
4. **Spaced review / streak:** a streak calendar (reuse `layout/streak-chip.tsx` styling). This is our version of their "momentum" GIF.

Use real components with fake data rather than GIFs, so they stay sharp, can follow the theme and stay light to load. We could keep a smaller bento grid underneath for secondary features (certificates, teams, challenges).

## Idea 5: Landing-page pricing teaser ("Practise without limits")

- Add a two-column card: Free vs Pro, with 4–5 checkmarks each, the mascot in its `celebrate` pose, and a CTA to `/pricing`.
- Show the guest/free path just as clearly, to keep the "no card needed" promise visible.

## Idea 6: Honest FAQ on the landing page

- Generalise `exam-hub/exam-faq.tsx` into a shared `marketing/faq.tsx`.
- Questions: *How is this different from free dumps?*, *Are these real exam questions?* (answer: no, they're original and blueprint-aligned), *Do I need an account?*, *Can you guarantee I'll pass?* (answer honestly, like PrepMonkey does).
- Add `FAQPage` JSON-LD to support the SEO work.

## Idea 7: Richer footer

- Four columns: **Product** (Explore, Pricing, Interviews, Teams), **Exams** (top 6, as now), **Resources** (Scoring, Sample questions, Verify certificate), **Company** (About, Privacy, Terms, Contact).
- Contact email and social icons, with a small mascot sign-off: "Happy practising! 🍌"

## Idea 8: Visual polish on the existing theme (keep warm brown/orange)

- **Section rhythm:** alternate `bg-background` and a soft `bg-secondary` band so long pages scan more easily (PrepMonkey uses neutral backgrounds with bright accents).
- **Illustrated section dividers:** a subtle wavy SVG edge or vine line between bands, a monkey/jungle motif in `--cocoa` at low opacity.
- **Banana accent:** use the unused `--banana` token for highlights, such as "New" chips, streak flames and the correct-answer glow.
- **Typography:** keep Bricolage Grotesque for display, and increase the H2 size and tracking a little on marketing pages only.

## Idea 9: Logged-in dashboard touches (follow-up phase)

- Mascot greeting by time of day plus one next step ("Morning! 12 cards due — 5 min").
- Progress cards per subject, in the same icon style as the landing grid, so the marketing site and app look like one product.

---

## Suggested implementation order

| Phase | Items | Files touched |
|---|---|---|
| 1 | Mascot component (Idea 1) | `components/brand/mascot.tsx` (new) |
| 2 | Hero + exam grid + FAQ (Ideas 2, 3, 6) | `app/(main)/page.tsx`, `components/marketing/*` |
| 3 | Feature stories + pricing teaser (Ideas 4, 5) | `components/marketing/feature-story.tsx`, `pricing-teaser.tsx` |
| 4 | Footer + visual polish (Ideas 7, 8) | `layout/site-footer.tsx`, `globals.css` |
| 5 | In-app mascot moments (Ideas 1, 9) | dashboard, results, empty states, `not-found.tsx` |

## Open decisions

1. Mascot name: is the mascot just "quizzMonkey", or does it get its own name, as Monk does at PrepMonkey?
2. Hand-drawn SVG poses in code, or commissioned illustrations?
3. Should the pricing teaser show actual prices, or only "Free vs Pro"?
