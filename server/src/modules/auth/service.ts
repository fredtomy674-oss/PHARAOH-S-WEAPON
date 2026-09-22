import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Db } from "../../db/index.js";
import { profiles, sessions, students, users } from "../../db/schema.js";
import { newId, randomToken, safeEqual, sha256Hex } from "../../utils/ids.js";
import { Errors } from "../../utils/errors.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthUser {
  user: typeof users.$inferSelect;
  student?: typeof students.$inferSelect;
}

export interface CreatedSession {
  token: string;
  csrfToken: string;
  expiresAt: Date;
}

export class AuthService {
  constructor(private readonly db: Db) {}

  async register(input: { email: string; password: string; displayName: string; gradeId?: string }): Promise<{ user: AuthUser; session: CreatedSession }> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.db.db.select().from(users).where(eq(users.email, email)).get();
    if (existing) throw Errors.conflict("هذا البريد مسجل بالفعل");

    if (input.password.length < 8) throw Errors.badRequest("كلمة المرور يجب ألا تقل عن 8 أحرف");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const now = new Date();

    const userId = newId("usr");
    await this.db.db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      role: "student",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    const studentId = newId("stu");
    await this.db.db.insert(students).values({
      id: studentId,
      userId,
      displayName: input.displayName.trim().slice(0, 80),
      gradeId: input.gradeId ?? null,
      createdAt: now,
      updatedAt: now,
    });
    await this.db.db.insert(profiles).values({ id: newId("prf"), userId, locale: "ar-EG", uiTheme: "light" });

    const built = await this.buildAuthUser(userId);
    const session = await this.createSession(userId);
    return { user: built, session };
  }

  async login(input: { email: string; password: string }): Promise<{ user: AuthUser; session: CreatedSession }> {
    const email = input.email.trim().toLowerCase();
    const user = await this.db.db.select().from(users).where(eq(users.email, email)).get();
    if (!user) throw Errors.unauthorized("البريد أو كلمة المرور غير صحيحة");
    if (user.status !== "active") throw Errors.forbidden("الحساب موقوف");
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw Errors.unauthorized("البريد أو كلمة المرور غير صحيحة");

    const session = await this.createSession(user.id);
    const built = await this.buildAuthUser(user.id);
    return { user: built, session };
  }

  async logout(sessionId: string): Promise<void> {
    await this.db.db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
  }

  /** Validate a raw cookie token → active session + user. */
  async validateToken(token: string): Promise<{ userId: string; sessionId: string; csrfToken: string } | null> {
    const hash = sha256Hex(token);
    const row = await this.db.db.select().from(sessions).where(eq(sessions.tokenHash, hash)).get();
    if (!row) return null;
    if (row.revokedAt) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    return { userId: row.userId, sessionId: row.id, csrfToken: row.csrfToken };
  }

  async buildAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.db.db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) throw Errors.internal("المستخدم غير موجود");
    const student = await this.db.db.select().from(students).where(eq(students.userId, userId)).get();
    return { user, student: student ?? undefined };
  }

  async getUserBySession(sessionId: string): Promise<AuthUser | null> {
    const row = await this.db.db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!row) return null;
    return this.buildAuthUser(row.userId);
  }

  private async createSession(userId: string): Promise<CreatedSession> {
    const token = randomToken(32);
    const csrfToken = randomToken(16);
    const now = new Date();
    await this.db.db.insert(sessions).values({
      id: newId("ses"),
      userId,
      tokenHash: sha256Hex(token),
      csrfToken,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      createdAt: now,
    });
    return { token, csrfToken, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) };
  }
}

export { safeEqual };