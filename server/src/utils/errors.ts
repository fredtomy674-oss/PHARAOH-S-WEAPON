/**
 * Domain error types. Routes map them to safe HTTP responses — never leak
 * internal details or stack traces to clients.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly expose: boolean;

  constructor(statusCode: number, code: string, message: string, expose = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.expose = expose;
  }
}

export const Errors = {
  badRequest(message = "طلب غير صالح", code = "BAD_REQUEST") {
    return new AppError(400, code, message);
  },
  unauthorized(message = "يجب تسجيل الدخول", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  },
  forbidden(message = "لا تملك صلاحية لهذا الإجراء", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  },
  notFound(message = "العنصر غير موجود", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  },
  conflict(message = "تعارض في البيانات", code = "CONFLICT") {
    return new AppError(409, code, message);
  },
  tooMany(message = "تجاوزت الحد المسموح، حاول لاحقًا", code = "RATE_LIMITED") {
    return new AppError(429, code, message);
  },
  /** Not user-triggered: hidden details, returned with generic message. */
  internal(message = "حدث خطأ داخلي، حاول مرة أخرى", code = "INTERNAL") {
    return new AppError(500, code, message, false);
  },
};

/** Marks a feature as deliberately unsupported with a documented reason. */
export class UnsupportedSourceError extends AppError {
  constructor(message: string) {
    super(501, "UNSUPPORTED_SOURCE", message, true);
  }
}