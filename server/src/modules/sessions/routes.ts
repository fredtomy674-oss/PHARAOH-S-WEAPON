import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../plugins/auth.js";

const startBodySchema = {
  type: "object",
  required: ["curriculumId", "gradeId", "subjectId"],
  additionalProperties: false,
  properties: {
    curriculumId: { type: "string", maxLength: 64 },
    gradeId: { type: "string", maxLength: 64 },
    subjectId: { type: "string", maxLength: 64 },
    lessonId: { type: "string", maxLength: 64 },
  },
};

const messageBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    content: { type: "string", minLength: 0, maxLength: 4000 },
    image: {
      type: "object",
      additionalProperties: false,
      required: ["dataUrl"],
      properties: {
        dataUrl: { type: "string", minLength: 1, maxLength: 7_000_000 },
        fileName: { type: "string", maxLength: 255 },
      },
    },
    document: {
      type: "object",
      additionalProperties: false,
      required: ["dataUrl"],
      properties: {
        // base64 of up to MAX_FILE_KB (10 MB default) ≈ 13.4M chars + JSON overhead.
        dataUrl: { type: "string", minLength: 1, maxLength: 14_000_000 },
        fileName: { type: "string", maxLength: 255 },
      },
    },
    // PHASE 48 — the printed book page currently open on the room's stage.
    // A plain integer, bounded: the service re-checks it against the lesson's
    // own range, so this bound is only the first line of defence.
    bookPage: { type: "integer", minimum: 0, maximum: 500 },
    // PHASE 50 — «لوح الحبر»: the page as the student marked it (page + his own
    // strokes). The page claim is re-checked against the lesson's own range by
    // the service; the stroke count is clamped there too, so this bound is only
    // the first line of defence. Same 7M-char ceiling as a photo: it is one.
    ink: {
      type: "object",
      additionalProperties: false,
      required: ["dataUrl"],
      properties: {
        dataUrl: { type: "string", minLength: 1, maxLength: 7_000_000 },
        page: { type: "integer", minimum: 0, maximum: 500 },
        strokes: { type: "integer", minimum: 0, maximum: 10000 },
      },
    },
    // PHASE 51 — the pin the student placed on the number line. Just the value:
    // the line and its key are resolved server-side from the transcript.
    widget: {
      type: "object",
      additionalProperties: false,
      required: ["value"],
      properties: {
        value: { type: "number" },
      },
    },
  },
};

/**
 * Learning sessions: the vertical slice. Start a session on a lesson, then
 * chat with the tutor; ownership is enforced server-side on every call.
 */
export const sessionsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", { preHandler: requireAuth, schema: { body: startBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    const body = request.body as { curriculumId: string; gradeId: string; subjectId: string; lessonId?: string };
    if (auth.user.role !== "student" || !auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const session = await app.sessions.start({
      studentId: auth.student.id,
      curriculumId: body.curriculumId,
      gradeId: body.gradeId,
      subjectId: body.subjectId,
      lessonId: body.lessonId,
    });
    return reply.code(201).send({ session });
  });

  app.get("/", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (!auth.student) {
      return { sessions: [] };
    }
    return { sessions: await app.sessions.list(auth.student.id) };
  });

  app.get("/:sessionId", { preHandler: requireAuth }, async (request) => {
    const auth = request.auth!;
    if (!auth.student) {
      return { session: null, messages: [] };
    }
    const { sessionId } = request.params as { sessionId: string };
    return app.sessions.getWithMessages(sessionId, auth.student.id);
  });

  app.post("/:sessionId/messages", { preHandler: requireAuth, schema: { body: messageBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId } = request.params as { sessionId: string };
    const body = request.body as { content?: string; image?: { dataUrl: string; fileName?: string }; document?: { dataUrl: string; fileName?: string }; bookPage?: number; ink?: { dataUrl: string; page?: number; strokes?: number }; widget?: { value: number } };
    const result = await app.sessions.sendMessage({
      sessionId,
      studentId: auth.student.id,
      content: body.content,
      image: body.image,
      document: body.document,
      bookPage: body.bookPage,
      ink: body.ink,
      widget: body.widget,
    });
    return reply.send(result);
  });

  /**
   * PHASE 49 — the same turn, streamed as it happens (NDJSON).
   *
   * The wire format is one JSON object per line rather than Server-Sent Events
   * for three reasons that matter to a classroom: it is a plain `fetch` body
   * (no EventSource, so auth cookies and the CSRF header behave normally); a
   * half-delivered line is a parse error the client can retry rather than a
   * silently dropped event; and a line is self-contained, so an event that
   * arrives late cannot corrupt the ones around it.
   *
   * `done` carries the buffered endpoint's exact payload, so the room can end
   * up in precisely the state it would have reached without streaming. The
   * deltas are a preview of a reply that is not yet trustworthy.
   */
  app.post("/:sessionId/messages/stream", { preHandler: requireAuth, schema: { body: messageBodySchema } }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId } = request.params as { sessionId: string };
    const body = request.body as { content?: string; image?: { dataUrl: string; fileName?: string }; document?: { dataUrl: string; fileName?: string }; bookPage?: number; ink?: { dataUrl: string; page?: number; strokes?: number }; widget?: { value: number } };

    reply.raw.writeHead(200, {
      "content-type": "application/x-ndjson; charset=utf-8",
      // A proxy that buffers this response would turn streaming back into the
      // eight-second wait it exists to remove, so say "do not buffer me".
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      connection: "keep-alive",
    });
    let open = true;
    // A student who navigates away mid-turn must not keep a generation running
    // forever; the abort below only stops the writes, and the turn finishes
    // server-side exactly as it would have (its work is already paid for).
    request.raw.on("close", () => {
      open = false;
    });
    const write = (line: unknown) => {
      if (!open) return;
      reply.raw.write(`${JSON.stringify(line)}\n`);
    };

    await app.sessions.streamMessage(
      {
        sessionId,
        studentId: auth.student.id,
        content: body.content,
        image: body.image,
        document: body.document,
        bookPage: body.bookPage,
        ink: body.ink,
        widget: body.widget,
      },
      write,
    );
    if (open) reply.raw.end();
    return reply;
  });

  app.get("/:sessionId/attachments/:attachmentId", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId, attachmentId } = request.params as { sessionId: string; attachmentId: string };
    const attachment = await app.sessions.getAttachment(sessionId, auth.student.id, attachmentId);
    // Viewer-safe image bytes only; served to the owning student's own browser.
    void reply.header("content-type", attachment.mimeType);
    void reply.header("content-length", String(attachment.sizeBytes));
    void reply.header("cache-control", "private, max-age=3600");
    void reply.header("x-content-type-options", "nosniff");
    void reply.header("content-security-policy", "default-src 'none'; sandbox");
    return reply.send(attachment.data);
  });

  /**
   * PHASE 40 (D-044) — read a tutor reply aloud: the server returns the audio
   * bytes, so the student needs no installed voice (and no settings change) to
   * hear Arabic. Ids only, never text (see speechForMessage). A 503 here is not
   * a failure the student sees: the client falls back to the browser voice.
   */
  app.post("/:sessionId/messages/:messageId/speech", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId, messageId } = request.params as { sessionId: string; messageId: string };
    const audio = await app.sessions.speechForMessage(sessionId, auth.student.id, messageId);
    void reply.header("content-type", audio.mimeType);
    void reply.header("content-length", String(audio.audio.length));
    // The audio is the student's own words from their own bubble: cacheable
    // privately for an hour so a second press does not even hit the network.
    void reply.header("cache-control", "private, max-age=3600");
    void reply.header("x-content-type-options", "nosniff");
    void reply.header("content-security-policy", "default-src 'none'; sandbox");
    return reply.send(audio.audio);
  });

  app.post("/:sessionId/end", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId } = request.params as { sessionId: string };
    await app.sessions.end(sessionId, auth.student.id, "user_request");
    return reply.send({ ok: true });
  });

  // PHASE 29 (D-027) — safe session recap: the student reads their own session's
  // metadata-only summary (never message content). Ownership is enforced inside
  // the service (404 for other students).
  app.get("/:sessionId/recap", { preHandler: requireAuth }, async (request, reply) => {
    const auth = request.auth!;
    if (!auth.student) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "الجلسات مخصصة لحسابات الطلاب" } });
    }
    const { sessionId } = request.params as { sessionId: string };
    return { recap: await app.sessions.recap(sessionId, auth.student.id, auth.user.id) };
  });
};