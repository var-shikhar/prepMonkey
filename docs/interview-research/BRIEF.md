# Real interview question research: brief

PrepMonkey (prepmonkey.in) is a mock-interview and quiz platform for IT jobs, used mostly by people in India and also globally. Our JavaScript, TypeScript and React banks are accurate, but they test *knowledge*. They are not the questions interviewers actually ask. Your job is to find what is **actually asked** in real interviews in 2023–2026, by role level, with evidence.

## Role levels

| Level | Role | Experience |
|---|---|---|
| 1 (L1) | Fresher, intern or campus hire | 0–1 years |
| 2 (L2) | Junior, SDE-1 | 1–3 years |
| 3 (L3) | Mid-level, SDE-2 | 3–5 years |
| 4 (L4) | Senior, SDE-3 | 5–8 years |
| 5 (L5) | Staff, lead or principal frontend | 8+ years |

When a source names the role or years of experience, use it. Otherwise judge from the depth of the question.

## Evidence (strongest first)

1. **First-hand interview experiences.** GeeksforGeeks "interview experience" posts, LeetCode Discuss interview posts, Glassdoor interview reviews, AmbitionBox interview questions, Reddit (r/reactjs, r/javascript, r/typescript, r/developersIndia, r/cscareerquestions, r/Frontend), Blind, Medium or dev.to posts that say "I was asked…", YouTube interview-experience descriptions.
2. **Company-tagged lists.** Questions tied to specific companies, for example Flipkart, Swiggy, Zomato, Razorpay, PhonePe, Atlassian, Microsoft, Amazon, Google, Uber, Meesho, Paytm, CRED, TCS, Infosys, Wipro, Accenture, startups.
3. **Curated lists.** GreatFrontEnd, frontendinterviewhandbook.com, BigFrontEnd.dev, InterviewBit, and popular GitHub lists (for example sudheerj/*-interview-questions, yangshun/front-end-interview-handbook). These are weaker evidence. Count them, but mark them `"list"`.

A question is **very common** if it shows up in 3 or more independent first-hand sources, or across many lists. It is **common** with 2 sources, and **occasional** with 1.

## Rules

- **Paraphrase every question in your own words.** Never copy answers or long text, because they may be copyrighted.
- Include machine-coding and "implement X" questions (debounce, throttle, `Promise.all` polyfill, deep clone, an infinite-scroll component, and so on), output-prediction snippets (write your own short snippet that captures the trick), debugging questions and frontend system-design questions. Keep them at the level where they are asked.
- Prefer questions asked from 2023 to 2026. Flag dated topics (class-component lifecycle, `var` hoisting trivia) only if they are still being asked.
- Merge duplicates. One entry per distinct question, with all its evidence attached.
- Aim for **150–250 distinct questions** in your file, covering every level from L1 to L5. If evidence for L5 is thin, give fewer L5 entries rather than invented ones.

## Output

Save a single JSON array, valid JSON, to the path you were given:

```json
[
  {
    "q": "Explain how closures work and give a practical use case.",
    "topic": "closures",
    "roleLevel": 2,
    "frequency": "very-common",
    "format": "concept",
    "evidence": [
      { "type": "first-hand", "url": "https://...", "note": "Flipkart SDE-1 2025, round 2" },
      { "type": "list", "url": "https://..." }
    ],
    "companies": ["Flipkart"],
    "mcqAngle": "Predict the output of a loop that creates closures over let vs var; or pick the use case that needs a closure."
  }
]
```

- `format` is one of `concept`, `output`, `coding`, `machine-coding`, `debug`, `design`, `comparison`.
- `mcqAngle` is one line on how this could be tested as a multiple-choice question: predict the output, spot the bug, pick the correct implementation, or pick the true statement.

When you finish, reply with a short summary: how many questions there are, the split by level and by frequency, your 15 most-asked topics, and which sources gave the most.
