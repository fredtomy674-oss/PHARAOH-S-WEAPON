import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";
import { publicUserFor } from "../auth/present.js";
import type { G12ChoiceInput } from "../curriculum/g12Selection.js";

const studentParams = {
  type: "object",
  required: ["studentId"],
  additionalProperties: false,
  properties: { studentId: { type: "string", minLength: 1, maxLength: 64 } },
};

const choiceProperties = {
  studyLanguage: { type: "string", enum: ["ar", "en", "fr"] },
  firstForeignLanguage: { type: "string", enum: ["en", "fr"] },
  secondForeignLanguage: { type: "string", enum: ["en", "fr", "de", "it", "es"] },
  religion: { type: "string", enum: ["islamic", "christian"] },
};

const studentBody = {
  type: "object",
  required: ["displayName", "gradeId"],
  additionalProperties: false,
  properties: {
    displayName: { type: "string", minLength: 2, maxLength: 80 },
    gradeId: { type: "string", minLength: 1, maxLength: 64 },
    // PHASE 185 — optional on track-free grades; validated against the grade's
    // actual track curricula on the server, never trusted from the client.
    track: { type: "string", minLength: 1, maxLength: 64 },
    // PHASE 192 — required only for grade-12; the service validates the
    // first/second-language combination and the religion.
    ...choiceProperties,
  },
};

const renameBody = {
  type: "object",
  required: ["displayName"],
  additionalProperties: false,
  properties: { displayName: { type: "string", minLength: 2, maxLength: 80 } },
};

const choicesBody = {
  type: "object",
  additionalProperties: false,
  properties: choiceProperties,
};

const gradeBody = {
  type: "object",
  required: ["gradeId", "confirmReset"],
  additionalProperties: false,
  properties: {
    gradeId: { type: "string", minLength: 1, maxLength: 64 },
    track: { type: "string", minLength: 1, maxLength: 64 },
    confirmReset: { type: "boolean" },
    ...choiceProperties,
  },
};

function requireStudentAccount(request: FastifyRequest): { userId: string; sessionId: string; activeId?: string } {
  const auth = request.auth!;
  if (auth.user.role !== "student") throw Errors.forbidden("هذا الإجراء لحسابات الطلاب فقط");
  return { userId: auth.user.id, sessionId: request.authSessionId!, activeId: auth.student?.id };
}

/**
 * PHASE 180 — multiple children per account.
 *
 * A login session's active child is chosen here and nowhere else. Existing
 * student-scoped routes keep reading `request.auth.student`, so switching or
 * adding a child changes every screen's scope without touching each route.
 */
export const studentsRoutes: FastifyPluginAsync = async (app) => {
  async function userPayload(userId: string, activeId?: string) {
    const authUser = await app.authService.buildAuthUser(userId, activeId);
    return publicUserFor(app.db, authUser);
  }

  app.get("/", { preHandler: requireAuth }, async (request) => {
    const { userId } = requireStudentAccount(request);
    return { user: await userPayload(userId, request.auth!.student?.id) };
  });

  app.post("/", { preHandler: requireAuth, schema: { body: studentBody } }, async (request, reply) => {
    const { userId, sessionId } = requireStudentAccount(request);
    const body = request.body as { displayName: string; gradeId: string; track?: string } & G12ChoiceInput;
    const student = await app.students.create(userId, body);
    await app.students.activate(sessionId, userId, student.id);
    await app.audit.record({
      actorUserId: userId,
      action: "student.create",
      entityType: "student",
      entityId: student.id,
      afterJson: JSON.stringify({
        gradeId: student.gradeId,
        track: student.track,
        studyLanguage: student.studyLanguage,
        firstForeignLanguage: student.firstForeignLanguage,
        secondForeignLanguage: student.secondForeignLanguage,
        religion: student.religion,
      }),
      ip: request.ip,
    });
    return reply.code(201).send({ user: await userPayload(userId, student.id) });
  });

  app.post("/:studentId/activate", { preHandler: requireAuth, schema: { params: studentParams } }, async (request) => {
    const { userId, sessionId } = requireStudentAccount(request);
    const { studentId } = request.params as { studentId: string };
    await app.students.activate(sessionId, userId, studentId);
    await app.audit.record({
      actorUserId: userId,
      action: "student.activate",
      entityType: "student",
      entityId: studentId,
      ip: request.ip,
    });
    return { user: await userPayload(userId, studentId) };
  });

  app.put("/:studentId/setup", { preHandler: requireAuth, schema: { params: studentParams, body: studentBody } }, async (request) => {
    const { userId, sessionId } = requireStudentAccount(request);
    const { studentId } = request.params as { studentId: string };
    const body = request.body as { displayName: string; gradeId: string; track?: string } & G12ChoiceInput;
    const student = await app.students.setup(userId, studentId, body);
    await app.students.activate(sessionId, userId, student.id);
    await app.audit.record({
      actorUserId: userId,
      action: "student.setup",
      entityType: "student",
      entityId: student.id,
      afterJson: JSON.stringify({
        gradeId: student.gradeId,
        track: student.track,
        studyLanguage: student.studyLanguage,
        firstForeignLanguage: student.firstForeignLanguage,
        secondForeignLanguage: student.secondForeignLanguage,
        religion: student.religion,
      }),
      ip: request.ip,
    });
    return { user: await userPayload(userId, student.id) };
  });

  app.put("/:studentId", { preHandler: requireAuth, schema: { params: studentParams, body: renameBody } }, async (request) => {
    const { userId, activeId } = requireStudentAccount(request);
    const { studentId } = request.params as { studentId: string };
    const body = request.body as { displayName: string };
    const student = await app.students.rename(userId, studentId, body.displayName);
    await app.audit.record({
      actorUserId: userId,
      action: "student.rename",
      entityType: "student",
      entityId: student.id,
      ip: request.ip,
    });
    return { user: await userPayload(userId, activeId) };
  });

  app.put("/:studentId/choices", { preHandler: requireAuth, schema: { params: studentParams, body: choicesBody } }, async (request) => {
    const { userId, activeId } = requireStudentAccount(request);
    const { studentId } = request.params as { studentId: string };
    const body = request.body as G12ChoiceInput;
    const before = await app.students.getOwned(userId, studentId);
    const student = await app.students.updateChoices(userId, studentId, body);
    await app.audit.record({
      actorUserId: userId,
      action: "student.choices_update",
      entityType: "student",
      entityId: student.id,
      beforeJson: JSON.stringify({
        studyLanguage: before.studyLanguage,
        firstForeignLanguage: before.firstForeignLanguage,
        secondForeignLanguage: before.secondForeignLanguage,
        religion: before.religion,
      }),
      afterJson: JSON.stringify({
        studyLanguage: student.studyLanguage,
        firstForeignLanguage: student.firstForeignLanguage,
        secondForeignLanguage: student.secondForeignLanguage,
        religion: student.religion,
      }),
      ip: request.ip,
    });
    return { user: await userPayload(userId, activeId ?? student.id) };
  });

  app.put("/:studentId/grade", { preHandler: requireAuth, schema: { params: studentParams, body: gradeBody } }, async (request) => {
    const { userId, sessionId } = requireStudentAccount(request);
    const { studentId } = request.params as { studentId: string };
    const body = request.body as { gradeId: string; track?: string; confirmReset: boolean } & G12ChoiceInput;
    if (body.confirmReset !== true) {
      throw Errors.badRequest("تغيير المنهج يمسح بيانات الطالب — يلزم تأكيد صريح", "RESET_CONFIRMATION_REQUIRED");
    }
    const before = await app.students.getOwned(userId, studentId);
    const result = await app.students.changeGrade(userId, studentId, body.gradeId, body.track, body);
    await app.students.activate(sessionId, userId, studentId);
    await app.audit.record({
      actorUserId: userId,
      action: "student.grade_change",
      entityType: "student",
      entityId: studentId,
      beforeJson: JSON.stringify({
        gradeId: before.gradeId,
        track: before.track,
        studyLanguage: before.studyLanguage,
        firstForeignLanguage: before.firstForeignLanguage,
        secondForeignLanguage: before.secondForeignLanguage,
        religion: before.religion,
      }),
      afterJson: JSON.stringify({
        gradeId: body.gradeId,
        track: body.track ?? null,
        studyLanguage: body.studyLanguage ?? null,
        firstForeignLanguage: body.firstForeignLanguage ?? null,
        secondForeignLanguage: body.secondForeignLanguage ?? null,
        religion: body.religion ?? null,
        deleted: result.deleted,
      }),
      ip: request.ip,
    });
    return { user: await userPayload(userId, studentId), changed: result.changed, deleted: result.deleted };
  });
};
