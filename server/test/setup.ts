// Test bootstrap: force test mode BEFORE any module import reads env.
process.env.NODE_ENV = "test";

/**
 * PHASE 42 — the suite must be hermetic by construction, not by accident.
 *
 * Turning the local `server/.env` to a real provider (the point of this phase)
 * turned four OCR cases red for a reason no one in the suite caused: the tests
 * inherited `AI_OCR_PROVIDER=gemini` from a git-ignored file and called the
 * live API, expecting the mock's canned "نص الصفحة الممسوحة ضوئيًا" back. The
 * file is invisible to `git status`, so this class of breakage is invisible
 * too — on CI it would depend on whether that file happened to exist.
 *
 * dotenv never overwrites a real env var, so assigning here wins over any
 * `.env`. Provider selection is therefore pinned to the offline providers for
 * the whole run; a test that wants a specific provider passes `forceProvider`
 * / `forceSpeechProvider` explicitly, and the opt-in live tests are gated by
 * RUN_LIVE_TESTS on purpose.
 */
process.env.AI_LLM_PROVIDER = "mock";
process.env.AI_EMBEDDING_PROVIDER = "mock";
process.env.AI_OCR_PROVIDER = "mock";
process.env.SPEECH_PROVIDER = "none";
