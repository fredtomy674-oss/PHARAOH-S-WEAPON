import { beforeAll, describe, expect, it, vi } from "vitest";
import { config } from "../../src/config/env.js";
import { MIRROR_TEST_TRIGGER, MockLLMProvider } from "../../src/modules/ai/providers/mock.js";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";

/**
 * PHASE 53 — a stuck model must yield the turn, not burn it.
 *
 * The offline tutor mirrors once on MIRROR_TEST_TRIGGER (a JSON envelope with
 * a bullet-list echo inside — the shape whose mid-line bullets the raw-text
 * check cannot see), then answers cleanly to the engine's nudge. The contract:
 * the student gets the clean reply, and the regen walked to the configured
 * fallback model instead of hammering the stuck one.
 */
describe("mirror recovery across models — API", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let s!: AuthSession;
  let sessionId!: string;
  const originalFallbacks = config.GEMINI_LLM_FALLBACKS;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, "mirror-recovery@test.local");
    const start = await api.app.inject({
      method: "POST",
      url: "/api/sessions",
      headers: csrfHeaders(s),
      payload: {
        curriculumId: corpus.curriculumId,
        gradeId: corpus.gradeId,
        subjectId: corpus.subjectId,
        lessonId: corpus.lessonA,
      },
    });
    expect(start.statusCode).toBe(201);
    sessionId = (start.json() as { session: { id: string } }).session.id;
    config.GEMINI_LLM_FALLBACKS = "fb-model-a, fb-model-b";
    return () => {
      config.GEMINI_LLM_FALLBACKS = originalFallbacks;
    };
  });

  it("recovers from a JSON-wrapped mirror and regens on the fallback model", async () => {
    // The app builds its own provider instances, so the spy goes on the
    // prototype — it observes every instance the container created.
    const seenModels: Array<string | undefined> = [];
    const original = MockLLMProvider.prototype.complete;
    const spy = vi.spyOn(MockLLMProvider.prototype, "complete").mockImplementation(async function (this: MockLLMProvider, req) {
      seenModels.push(req.model);
      return original.call(this, req);
    });
    try {
      const res = await api.app.inject({
        method: "POST",
        url: `/api/sessions/${sessionId}/messages`,
        headers: csrfHeaders(s),
        payload: { content: `هذا ${MIRROR_TEST_TRIGGER} من فضلك` },
      });
      expect(res.statusCode).toBe(200);
      const turn = res.json() as { tutorMessage: { content: string } };
      // The student never sees the mirror — the regen's clean reply is stored.
      expect(turn.tutorMessage.content).not.toContain("* Role:");
      expect(turn.tutorMessage.content).toContain("سؤال جيد");
      // Attempt 0 on the pinned default, the regen on the first fallback.
      expect(seenModels).toEqual(["test-primary", "fb-model-a"]);
    } finally {
      spy.mockRestore();
    }
  });
});
