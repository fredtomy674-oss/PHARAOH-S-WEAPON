# CHANGELOG.md

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

