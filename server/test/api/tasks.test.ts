import { beforeAll, describe, expect, it } from "vitest";
import { csrfHeaders, headers, makeApp, registerParent, registerStudent, type AuthSession, type TestApi } from "../helpers.js";

let seq = 0;
const nth = (name: string) => `${name}-${Date.now()}-${seq++}@test.local`;

interface TaskRow {
  id: string;
  studentId: string;
  title: string;
  kind: "homework" | "exam";
  subjectId: string | null;
  dueDate: string;
  notes: string | null;
  done: boolean;
}

/**
 * PHASE 182 — «مهامي» is child-scoped: two siblings on one account never see
 * each other's rows, a parent cannot read them, and dates stay plain calendar
 * days (no UTC shifting).
 */
describe("student tasks API (PHASE 182)", () => {
  let api!: TestApi;
  let a!: AuthSession;
  let b!: AuthSession;
  let parent!: AuthSession;

  beforeAll(async () => {
    api = await makeApp();
    a = await registerStudent(api.app, nth("tasks-a"), "password-123", "سلمى");
    b = await registerStudent(api.app, nth("tasks-b"), "password-123", "يوسف");
    parent = await registerParent(api.app, nth("tasks-parent"));
  });

  it("creates a homework row for the active child and lists it back", async () => {
    const created = await api.app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: csrfHeaders(a),
      payload: { title: "حل تمارين صفحة ٤٢", kind: "homework", dueDate: "2026-10-20" },
    });
    expect(created.statusCode).toBe(201);
    const task = (created.json() as { task: TaskRow }).task;
    expect(task.title).toBe("حل تمارين صفحة ٤٢");
    expect(task.dueDate).toBe("2026-10-20");
    expect(task.done).toBe(false);
    expect(task.studentId).toBe(a.studentId);

    const list = await api.app.inject({ method: "GET", url: "/api/tasks", headers: headers(a) });
    expect(list.statusCode).toBe(200);
    expect((list.json() as { tasks: TaskRow[] }).tasks.map((t) => t.id)).toContain(task.id);
  });

  it("isolates the list between two children on the same account shape", async () => {
    const listA = await api.app.inject({ method: "GET", url: "/api/tasks", headers: headers(a) });
    const listB = await api.app.inject({ method: "GET", url: "/api/tasks", headers: headers(b) });
    expect((listB.json() as { tasks: TaskRow[] }).tasks).toEqual([]);
    expect((listA.json() as { tasks: TaskRow[] }).tasks.length).toBeGreaterThan(0);
  });

  it("marks done, filters pending, and refuses a sibling's row", async () => {
    const created = await api.app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: csrfHeaders(a),
      payload: { title: "مراجعة الوحدة الأولى", kind: "exam", dueDate: "2026-10-25" },
    });
    const task = (created.json() as { task: TaskRow }).task;

    const patched = await api.app.inject({
      method: "PATCH",
      url: `/api/tasks/${task.id}`,
      headers: csrfHeaders(a),
      payload: { done: true },
    });
    expect(patched.statusCode).toBe(200);
    expect((patched.json() as { task: TaskRow }).task.done).toBe(true);

    const pending = await api.app.inject({ method: "GET", url: "/api/tasks?pending=1", headers: headers(a) });
    expect((pending.json() as { tasks: TaskRow[] }).tasks.map((t) => t.id)).not.toContain(task.id);

    const cross = await api.app.inject({
      method: "PATCH",
      url: `/api/tasks/${task.id}`,
      headers: csrfHeaders(b),
      payload: { done: false },
    });
    expect(cross.statusCode).toBe(404);
  });

  it("rejects a malformed calendar date", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: csrfHeaders(a),
      payload: { title: "واجب", kind: "homework", dueDate: "2026-02-31" },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("INVALID_DATE");
  });

  it("rejects a title that is only whitespace", async () => {
    const res = await api.app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: csrfHeaders(a),
      payload: { title: "  ", kind: "homework", dueDate: "2026-10-20" },
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("INVALID_TITLE");
  });

  it("keeps parents out of the child's task list", async () => {
    const res = await api.app.inject({ method: "GET", url: "/api/tasks", headers: headers(parent) });
    expect(res.statusCode).toBe(403);
  });

  it("deletes only the child's own row", async () => {
    const created = await api.app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: csrfHeaders(a),
      payload: { title: "مهمة للحذف", kind: "homework", dueDate: "2026-10-27" },
    });
    const task = (created.json() as { task: TaskRow }).task;

    const cross = await api.app.inject({ method: "DELETE", url: `/api/tasks/${task.id}`, headers: csrfHeaders(b) });
    expect(cross.statusCode).toBe(404);

    const own = await api.app.inject({ method: "DELETE", url: `/api/tasks/${task.id}`, headers: csrfHeaders(a) });
    expect(own.statusCode).toBe(200);
    const list = await api.app.inject({ method: "GET", url: "/api/tasks", headers: headers(a) });
    expect((list.json() as { tasks: TaskRow[] }).tasks.map((t) => t.id)).not.toContain(task.id);
  });
});
