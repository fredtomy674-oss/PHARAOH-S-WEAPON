import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import { studentTasks, subjects } from "../../db/schema.js";
import { requireAuth } from "../../plugins/auth.js";
import { Errors } from "../../utils/errors.js";
import { newId } from "../../utils/ids.js";

const taskParams = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: { id: { type: "string", minLength: 1, maxLength: 64 } },
};

const taskBody = {
  type: "object",
  required: ["title", "kind", "dueDate"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 2, maxLength: 120 },
    kind: { type: "string", enum: ["homework", "exam"] },
    dueDate: { type: "string", minLength: 10, maxLength: 10 },
    subjectId: { type: ["string", "null"], maxLength: 64 },
    notes: { type: ["string", "null"], maxLength: 500 },
  },
};

const patchBody = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title: { type: "string", minLength: 2, maxLength: 120 },
    kind: { type: "string", enum: ["homework", "exam"] },
    dueDate: { type: "string", minLength: 10, maxLength: 10 },
    subjectId: { type: ["string", "null"], maxLength: 64 },
    notes: { type: ["string", "null"], maxLength: 500 },
    done: { type: "boolean" },
  },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A calendar date the student can actually have (rejects 2026-02-31). */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function taskIdOf(request: FastifyRequest): string {
  return (request.params as { id: string }).id;
}

function studentOf(request: FastifyRequest): string {
  const auth = request.auth!;
  if (auth.user.role !== "student" || !auth.student) {
    throw Errors.forbidden("مهام الطالب متاحة لحسابات الطلاب فقط");
  }
  return auth.student.id;
}

/**
 * PHASE 182 — «مهامي»: homework and exams a child adds for themselves.
 *
 * Every query is scoped by `student_id` from the active login child, so two
 * siblings sharing one account can never read or edit each other's list. The
 * date is stored as a plain `YYYY-MM-DD` string, deliberately not a timestamp:
 * a homework due «يوم الأحد» must not move a day because a server runs in UTC.
 */
export const tasksRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: requireAuth }, async (request) => {
    const studentId = studentOf(request);
    const query = (request.query ?? {}) as {
      from?: unknown;
      to?: unknown;
      pending?: unknown;
      limit?: unknown;
    };
    if (query.from !== undefined && !isCalendarDate(query.from)) {
      throw Errors.badRequest("تاريخ البداية غير صحيح", "INVALID_DATE");
    }
    if (query.to !== undefined && !isCalendarDate(query.to)) {
      throw Errors.badRequest("تاريخ النهاية غير صحيح", "INVALID_DATE");
    }

    const where: SQL[] = [eq(studentTasks.studentId, studentId)];
    if (typeof query.from === "string") where.push(gte(studentTasks.dueDate, query.from));
    if (typeof query.to === "string") where.push(lte(studentTasks.dueDate, query.to));
    if (query.pending === "1" || query.pending === "true") where.push(eq(studentTasks.done, false));

    const all = await app.db.db
      .select()
      .from(studentTasks)
      .where(and(...where))
      .orderBy(asc(studentTasks.dueDate), asc(studentTasks.createdAt))
      .all();

    const rawLimit = typeof query.limit === "string" ? Number(query.limit) : NaN;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 0;
    return { tasks: limit > 0 ? all.slice(0, limit) : all, total: all.length };
  });

  app.post("/", { preHandler: requireAuth, schema: { body: taskBody } }, async (request, reply) => {
    const studentId = studentOf(request);
    const body = request.body as {
      title: string;
      kind: "homework" | "exam";
      dueDate: string;
      subjectId?: string | null;
      notes?: string | null;
    };
    if (!isCalendarDate(body.dueDate)) {
      throw Errors.badRequest("تاريخ المهمة غير صحيح", "INVALID_DATE");
    }
    const title = body.title.trim();
    if (title.length < 2) throw Errors.badRequest("اسم المهمة قصير جدًا", "INVALID_TITLE");
    if (body.subjectId) {
      const subject = await app.db.db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, body.subjectId)).get();
      if (!subject) throw Errors.badRequest("المادة غير موجودة", "INVALID_SUBJECT");
    }

    const now = new Date();
    const row = {
      id: newId("task"),
      studentId,
      title,
      kind: body.kind,
      subjectId: body.subjectId ?? null,
      dueDate: body.dueDate,
      notes: body.notes?.trim() || null,
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    await app.db.db.insert(studentTasks).values(row);
    return reply.code(201).send({ task: row });
  });

  app.patch("/:id", { preHandler: requireAuth, schema: { params: taskParams, body: patchBody } }, async (request) => {
    const studentId = studentOf(request);
    const id = taskIdOf(request);
    const body = request.body as {
      title?: string;
      kind?: "homework" | "exam";
      dueDate?: string;
      subjectId?: string | null;
      notes?: string | null;
      done?: boolean;
    };
    if (body.dueDate !== undefined && !isCalendarDate(body.dueDate)) {
      throw Errors.badRequest("تاريخ المهمة غير صحيح", "INVALID_DATE");
    }
    const title = body.title?.trim();
    if (body.title !== undefined && (!title || title.length < 2)) {
      throw Errors.badRequest("اسم المهمة قصير جدًا", "INVALID_TITLE");
    }
    if (body.subjectId) {
      const subject = await app.db.db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, body.subjectId)).get();
      if (!subject) throw Errors.badRequest("المادة غير موجودة", "INVALID_SUBJECT");
    }

    const current = await app.db.db
      .select()
      .from(studentTasks)
      .where(and(eq(studentTasks.id, id), eq(studentTasks.studentId, studentId)))
      .get();
    if (!current) throw Errors.notFound("المهمة غير موجودة");

    await app.db.db
      .update(studentTasks)
      .set({
        ...(title !== undefined ? { title } : {}),
        ...(body.kind !== undefined ? { kind: body.kind } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
        ...(body.subjectId !== undefined ? { subjectId: body.subjectId } : {}),
        ...(body.notes !== undefined ? { notes: body.notes?.trim() || null } : {}),
        ...(body.done !== undefined ? { done: body.done } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(studentTasks.id, id), eq(studentTasks.studentId, studentId)));

    const updated = await app.db.db
      .select()
      .from(studentTasks)
      .where(and(eq(studentTasks.id, id), eq(studentTasks.studentId, studentId)))
      .get();
    return { task: updated };
  });

  app.delete("/:id", { preHandler: requireAuth, schema: { params: taskParams } }, async (request) => {
    const studentId = studentOf(request);
    const id = taskIdOf(request);
    const current = await app.db.db
      .select({ id: studentTasks.id })
      .from(studentTasks)
      .where(and(eq(studentTasks.id, id), eq(studentTasks.studentId, studentId)))
      .get();
    if (!current) throw Errors.notFound("المهمة غير موجودة");
    await app.db.db.delete(studentTasks).where(and(eq(studentTasks.id, id), eq(studentTasks.studentId, studentId)));
    return { ok: true };
  });
};
