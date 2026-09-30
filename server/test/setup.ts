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
// PHASE 53 — failover walks GEMINI_LLM_FALLBACKS, which now lives in the same
// git-ignored server/.env: without this pin a developer's local fallback list
// would change the retry budgets the resilience tests assert (4 calls became
// 10). A test that wants fallbacks sets config.GEMINI_LLM_FALLBACKS itself,
// exactly like the speech tests do with GEMINI_TTS_FALLBACKS. The primary is
// pinned for the same reason: the model name rides the request into every
// provider, and assertions on it must not depend on a git-ignored file.
process.env.GEMINI_LLM_FALLBACKS = "";
process.env.GEMINI_LLM_MODEL = "test-primary";
