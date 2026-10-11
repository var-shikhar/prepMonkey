# PrepMonkey redesign: page-by-page tracker

Branch `website-redesign`. Pages are redesigned one at a time in the cocoa look (light and dark).
The next page starts only after the current one is approved.

Status: ⏳ in review · ✅ approved · ⬜ not started

| # | Page | Route | Who sees it | Status |
|---|------|-------|-------------|--------|
| 1 | Landing (the whole public site: how it works, exams, pricing, FAQ) | `/` | Visitors | ✅ |
| 2 | Sign in / Sign up | `/sign-in`, `/sign-up` | Visitors | ✅ |
| 3 | Explore (catalogue) | `/explore` | Learners (visitors → `/#catalogue`) | ✅ |
| 4 | Exam hub | `/exams/[examId]` | Everyone | ✅ |
| 5 | Sample questions | `/exams/[examId]/sample-questions` | Everyone | ⬜ |
| 6 | Pricing / upgrade | `/pricing` | Learners (visitors → `/#plans`) | ✅ |
| 7 | Onboarding | `/onboarding` | New learners | ✅ |
| 8 | Dashboard | `/dashboard` | Learners | ✅ |
| 9 | Exam player | `/attempt/[id]` | Learners | ✅ |
| 10 | Results | `/attempt/[id]/result` | Learners | ✅ |
| 11 | Study a skill | `/exams/[examId]/study/[skillId]` | Learners | ✅ |
| 12 | Progress | `/progress` | Learners | ✅ |
| 13 | Mock interviews (list + room) | `/interviews`, `/interviews/[id]` | Learners (visitors → `/#how-it-works`) | ✅ |
| 14 | Saved questions | `/saved` | Learners | ✅ |
| 15 | Settings | `/settings` | Learners | ✅ |
| 16 | Teams (list, team, join) | `/teams`, `/teams/[id]`, `/teams/join/[code]` | Learners | ⬜ |
| 17 | Challenge | `/challenge/[code]` | Everyone | ⬜ |
| 18 | Certificate + verify | `/certificates/[id]`, `/verify`, `/verify/[code]` | Everyone | ⬜ |
| 19 | About (scoring, privacy, terms) | `/about/*` | Everyone | ⬜ |
| 20 | 404 and error | `not-found`, `error` | Everyone | ⬜ |
| 21 | Admin (questions, import, generate, reports, users) | `/admin/*` | Admins | ⬜ |

Visitors get a single page: the header and footer link to landing sections, and Explore, Pricing and Interviews redirect visitors there.
Shared pieces such as the header, footer, buttons, cards and tokens change with whichever page first needs them.
