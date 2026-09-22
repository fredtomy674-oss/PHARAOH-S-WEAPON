import { createHash } from "node:crypto";
import { Errors } from "../../utils/errors.js";

/**
 * Vision upload: parsing/validation for photos attached to a tutor message.
 * MVP accepts PNG/JPEG/WebP data-URLs up to a size cap; bytes are stored as
 * BLOB on the message and shipped to multimodal providers.
 */

export const ALLOWED_IMAGE_MIMES: ReadonlySet<string> = new Set(["image/png", "image/jpeg", "image/webp"]);

export interface ParsedImage {
  mimeType: string;
  fileName: string | null;
  base64: string;
  bytes: Buffer;
  sizeBytes: number;
  sha256: string;
}

export interface ParseImageOptions {
  maxBytes: number;
  fileName?: string;
}

const DATA_URL_RE = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.+)$/is;

/** Parse + validate a base64 data-URL for an image. Throws a 400 on any problem. */
export function parseImageDataUrl(dataUrl: string, opts: ParseImageOptions): ParsedImage {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    throw Errors.badRequest("صيغة الصورة غير صالحة — أرسل صورة بصيغة data-URL", "INVALID_IMAGE_FORMAT");
  }
  const mimeType = match[1]!.toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
    throw Errors.badRequest("صيغة الصورة غير مدعومة (PNG أو JPEG أو WebP فقط)", "UNSUPPORTED_IMAGE_TYPE");
  }
  const base64 = match[2]!;
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    throw Errors.badRequest("البيانات المرفقة غير صالحة", "INVALID_IMAGE_DATA");
  }
  if (bytes.length === 0) {
    throw Errors.badRequest("الصورة المرفقة فارغة", "EMPTY_IMAGE");
  }
  if (bytes.length > opts.maxBytes) {
    throw Errors.badRequest(
      `الصورة كبيرة جدًا — الحد الأقصى ${Math.round(opts.maxBytes / 1024)} كيلوبايت`,
      "IMAGE_TOO_LARGE",
    );
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const fileName = opts.fileName?.trim().slice(0, 255) || null;
  return { mimeType, fileName, base64, bytes, sizeBytes: bytes.length, sha256 };
}