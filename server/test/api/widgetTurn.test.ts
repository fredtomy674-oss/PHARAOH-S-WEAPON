import { beforeAll, describe, expect, it } from "vitest";
import {
  csrfHeaders,
  makeApp,
  registerStudent,
  seedMiniCorpus,
  type AuthSession,
  type MiniCorpus,
  type TestApi,
} from "../helpers.js";
import {
  WIDGET_PIN_LEFT_MARKER,
  WIDGET_PIN_OK_MARKER,
  WIDGET_PIN_RIGHT_MARKER,
} from "../../src/modules/ai/providers/mock.js";

/**
 * PHASE 51 — «خط الأعداد»: the full loop with zero keys.
 *
 * Ask for a number line → the tutor draws one (stored with its key, sent
 * without it) → the student places the pin → the tutor verifies against the
 * *stored* key. The contract worth protecting: the browser never sees the
 * answer, and the verdict comes from the transcript, not from the client's
 * echo of it.
 */
describe("number-line widget — API", () => {
  let api!: TestApi;
  let corpus!: MiniCorpus;
  let s!: AuthSession;
  let sessionId!: string;

  beforeAll(async () => {
    api = await makeApp();
    corpus = await seedMiniCorpus(api);
    s = await registerStudent(api.app, "widget-turn@test.local");
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
  });

  const ask = (payload: Record<string, unknown>) =>
    api.app.inject({
      method: "POST",
      url: `/api/sessions/${sessionId}/messages`,
      headers: csrfHeaders(s),
      payload,
    });

  interface WireWidget {
    kind: string;
    from: number;
    to: number;
    step: number;
    question?: string;
    answer?: number;
  }

  it("draws a number line on demand, stored with its key but sent without it", async () => {
    const res = await ask({ content: "ارسم لي خط الأعداد من فضلك" });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { widgets?: WireWidget[] } };
    expect(turn.tutorMessage.widgets).toHaveLength(1);
    const line = turn.tutorMessage.widgets![0]!;
    expect(line).toMatchObject({ kind: "numberline", from: 0, to: 10, step: 1 });
    // The exercise must not answer itself in devtools.
    expect(line).not.toHaveProperty("answer");
  });

  it("praises a pin placed exactly on the key", async () => {
    const res = await ask({ content: "وضعت الدبوس عند 7", widget: { value: 7 } });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { content: string } };
    expect(turn.tutorMessage.content).toContain(WIDGET_PIN_OK_MARKER);
  });

  it("guides a low pin rightward without naming the key", async () => {
    const res = await ask({ content: "وضعت الدبوس عند 4", widget: { value: 4 } });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { content: string } };
    expect(turn.tutorMessage.content).toContain(WIDGET_PIN_RIGHT_MARKER);
    expect(turn.tutorMessage.content).not.toContain("7");
  });

  it("guides a high pin leftward", async () => {
    const res = await ask({ content: "وضعت الدبوس عند 9", widget: { value: 9 } });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { content: string } };
    expect(turn.tutorMessage.content).toContain(WIDGET_PIN_LEFT_MARKER);
  });

  it("snaps an off-step pin to the line before verifying", async () => {
    // 7.4 is not on the 0..10 × 1 line; the server snaps it to 7, a hit.
    const res = await ask({ content: "وضعت الدبوس", widget: { value: 7.4 } });
    expect(res.statusCode).toBe(200);
    const turn = res.json() as { tutorMessage: { content: string } };
    expect(turn.tutorMessage.content).toContain(WIDGET_PIN_OK_MARKER);
  });

  it("re-reading the session still shows the line (without its key)", async () => {
    const history = await api.app.inject({
      method: "GET",
      url: `/api/sessions/${sessionId}`,
      headers: { cookie: s.cookie },
    });
    expect(history.statusCode).toBe(200);
    const messages = history.json().messages as Array<{ role: string; widgets?: WireWidget[] }>;
    const lines = messages.filter((m) => m.role === "tutor").flatMap((m) => m.widgets ?? []);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).not.toHaveProperty("answer");
  });
});
