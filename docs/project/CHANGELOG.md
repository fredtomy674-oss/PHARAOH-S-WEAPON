# CHANGELOG.md

## 2026-10-11
- Recovery: the interrupted curriculum-prep work (Prep-1/G7 + Grade-8 import, PHASE 78, PHASE 87–92, OCR corpora, corrupted web orphans) was preserved intact on branch `wip/curriculum-prep1-g8` (commit 6d18b83). `master` was restored to the green committed baseline before building; the incomplete G7/G8 OCR import stays on that branch until a dedicated task completes it.
- PHASE 78 re-applied on master: AI tutor answers are grounded in the lesson book (`<lesson-book>` block in promptBuilder, rules 4/10/11), with `loadLessonBookText()` in `curriculum/bookStage.ts` and `TUTOR_LESSON_BOOK_CHARS` (default 12000) in `env.ts`. Uses the existing STAGE_BOOKS registry only — no dependency on the WIP curriculum trees.
- PHASE 87–92 actually applied on master (`web/src/Home.tsx`, `web/src/LessonRoom.tsx`, `web/src/styles.css`): the changelog documented these as done while the code existed only on the WIP branch; the code is now on master.
- PHASE 93 — Parent Weekly Digest (Faheem-inspired periodic parent update): pure deterministic builder `parent/weeklyReport.ts` (window totals, active days, streak, accuracy bands, Arabic headline/highlights/parent actions), `ParentService.weeklyReport()`, route `GET /api/parent/children/:studentId/weekly-report?days=` (1–31, default 7), web `getParentWeeklyReport()` + weekly card in `web/src/Parent.tsx`. Metadata-only: message content can never appear (asserted by tests).

## 2026-10-09
- Established project memory structure under docs/project
- Recorded CURRENT_STATE with pilot v2 results
- Copied core docs
- PHASE 87: Added clear "Next Best Action" to home screen using existing data (session status, practice plan). Improved mobile layout; TypeScript OK.
- PHASE 88: Added lesson context bar and quick "Home" actions in LessonRoom to strengthen Home→Lesson continuity; TypeScript OK.
- PHASE 89: Improved lesson start context clarity (breadcrumb display) and mobile responsive styles; TypeScript OK.
- PHASE 90: Added session-aware primary action in LessonRoom empty state; mobile responsive styling; TypeScript OK.
- PHASE 91: Reviewed AI tutor pipeline (promptBuilder, teachingStrategy, tutorEngine) to reinforce answer evaluation feedback and continuity; TypeScript/typecheck OK. No breaking API changes.
- PHASE 92: Made Home next best action context-aware (prefer active session, then practice plan, else start lesson) using existing data. TypeScript/typecheck OK.
- OPS FIX (2026-10-10): Fixed recurring dev-run confusion permanently. (1) Canonical health is GET /api/health; added GET /health + /health/ aliases so probes no longer get Fastify 404. (2) Pinned web dev server to host 127.0.0.1 + strictPort so URL is always exactly http://127.0.0.1:5173 (Vite no longer silently moves to 5174 when port is taken). Typecheck OK (web+server).

