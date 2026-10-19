import { asc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Db } from "../../db/index.js";
import { parents, profiles, sessions, students, users } from "../../db/schema.js";
import { newId, parentLinkCode, randomToken, safeEqual, sha256Hex } from "../../utils/ids.js";
import { Errors } from "../../utils/errors.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type RegisterRole = "student" | "parent";

export interface AuthUser {
  user: typeof users.$inferSelect;
  /** The child this login is teaching. Undefined until a family account picks one. */
  student?: typeof students.$inferSelect;
  /** Every child profile owned by the account (empty for parents/admins). */
  students: Array<typeof students.$inferSelect>;
  parent?: typeof parents.$inferSelect;
}

export interface CreatedSession {
  token: string;
  csrfToken: string;
  expiresAt: Date;
}

export class AuthService {
  constructor(private readonly db: Db) {}

  async register(input: { email: string; password: string; displayName: string; gradeId?: string; role?: RegisterRole }): Promise<{ user: AuthUser; session: CreatedSession }> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.db.db.select().from(users).where(eq(users.email, email)).get();
    if (existing) throw Errors.conflict("هذا البريد مسجل بالفعل");

    if (input.password.length < 8) throw Errors.badRequest("كلمة المرور يجب ألا تقل عن 8 أحرف");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const now = new Date();

    const role: RegisterRole = input.role === "parent" ? "parent" : "student";
    const userId = newId("usr");
    await this.db.db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    let studentId: string | undefined;
    if (role === "parent") {
      await this.db.db.insert(parents).values({ id: newId("par"), userId });
    } else {
      studentId = newId("stu");
      await this.db.db.insert(students).values({
        id: studentId,
        userId,
        displayName: input.displayName.trim().slice(0, 80),
        gradeId: input.gradeId ?? null,
        // A sharing code a parent enters to link/observe this child (PHASE 18).
        parentLinkCode: parentLinkCode(),
        createdAt: now,
        updatedAt: now,
      });
    }
    await this.db.db.insert(profiles).values({ id: newId("prf"), userId, locale: "ar-EG", uiTheme: "light" });

    const session = await this.createSession(userId, studentId);
    const built = await this.buildAuthUser(userId, studentId);
    return { user: built, session };
  }

  async login(input: { email: string; password: string }): Promise<{ user: AuthUser; session: CreatedSession }> {
    const email = input.email.trim().toLowerCase();
    const user = await this.db.db.select().from(users).where(eq(users.email, email)).get();
    if (!user) throw Errors.unauthorized("البريد أو كلمة المرور غير صحيحة");
    if (user.status !== "active") throw Errors.forbidden("الحساب موقوف");
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw Errors.unauthorized("البريد أو كلمة المرور غير صحيحة");

    // PHASE 180 — one child is chosen automatically; a family with several
    // children starts on the picker and picks for this device/session.
    const studentId = await this.defaultStudentId(user.id);
    const session = await this.createSession(user.id, studentId);
    const built = await this.buildAuthUser(user.id, studentId);
    return { user: built, session };
  }

  async logout(sessionId: string): Promise<void> {
    await this.db.db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
  }

  /** Validate a raw cookie token → active session + user. */
  async validateToken(token: string): Promise<{ userId: string; sessionId: string; csrfToken: string; studentId?: string } | null> {
    const hash = sha256Hex(token);
    const row = await this.db.db.select().from(sessions).where(eq(sessions.tokenHash, hash)).get();
    if (!row) return null;
    if (row.revokedAt) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    return { userId: row.userId, sessionId: row.id, csrfToken: row.csrfToken, studentId: row.studentId ?? undefined };
  }

  async buildAuthUser(userId: string, activeStudentId?: string): Promise<AuthUser> {
    const user = await this.db.db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) throw Errors.internal("المستخدم غير موجود");
    if (user.role === "parent") {
      const parent = await this.db.db.select().from(parents).where(eq(parents.userId, userId)).get();
      return { user, students: [], parent: parent ?? undefined };
    }
    const children = await this.db.db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .orderBy(asc(students.createdAt), asc(students.id));
    const selected =
      (activeStudentId ? children.find((s) => s.id === activeStudentId) : undefined) ??
      (children.length === 1 ? children[0] : undefined);
    return { user, student: selected, students: children };
  }

  async getUserBySession(sessionId: string): Promise<AuthUser | null> {
    const row = await this.db.db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!row) return null;
    return this.buildAuthUser(row.userId, row.studentId ?? undefined);
  }

  /** The only child on an account is unambiguous; two or more require a pick. */
  private async defaultStudentId(userId: string): Promise<string | undefined> {
    const rows = await this.db.db.select({ id: students.id }).from(students).where(eq(students.userId, userId)).limit(2);
    return rows.length === 1 ? rows[0]?.id : undefined;
  }

  private async createSession(userId: string, studentId?: string): Promise<CreatedSession> {
    const token = randomToken(32);
    const csrfToken = randomToken(16);
    const now = new Date();
    await this.db.db.insert(sessions).values({
      id: newId("ses"),
      userId,
      studentId: studentId ?? null,
      tokenHash: sha256Hex(token),
      csrfToken,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      createdAt: now,
    });
    return { token, csrfToken, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) };
  }
}

export { safeEqual };
