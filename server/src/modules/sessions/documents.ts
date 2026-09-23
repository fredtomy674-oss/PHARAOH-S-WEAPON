import { createHash } from "node:crypto";
import { Errors } from "../../utils/errors.js";
import { detectFileKind, kindForDeclaredMime } from "../../utils/fileTypes.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";

/**
 * Document upload (Path A, PHASE 12): parsing/validation + safe text extraction
 * for student-attached files inside the chat (PDF/DOCX/TXT/MD).
 *
 * Security posture:
 *  - Content is UNTRUSTED user data. It is never concatenated into the system
 *    prompt; it travels as document input (bounded by MAX_DOCUMENT_CHARS) and
 *    is wrapped/flagged as user-provided content. The prompt-injection tripwire
 *    re-scan runs over the extracted text server-side before the model is ever
 *    called.
 *  - Declared MIME must agree with MAGIC-byte sniffing (PHASE 15): a spoofed
 *    extension (text → .pdf, plain ZIP → .docx, …) is rejected with
 *    FILE_TYPE_MISMATCH before any extraction or storage.
 *  - Extraction runs against the in-memory buffer only (never the filesystem),
 *    pure-JS parsers: pdfjs-dist (pdf.js, legacy ESM build, no workers) and
 *    mammoth (DOCX via zip+OOXML). Scanned/OCR-needing files yield empty text —
 *    OCR is deferred to a later dedicated phase.
 */

export const ALLOWED_DOCUMENT_MIMES: ReadonlySet<string> = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

export interface ParsedDocument {
  mimeType: string;
  fileName: string | null;
  base64: string;
  bytes: Buffer;
  sizeBytes: number;
  sha256: string;
  /** Extracted plain text (empty for scanned/no-text files). */
  text: string;
  /** True when `text` was cut down to the MAX_DOCUMENT_CHARS budget. */
  truncated: boolean;
}

export interface ParseDocumentOptions {
  maxBytes: number;
  maxChars: number;
  fileName?: string;
}

const DATA_URL_RE = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.+)$/is;

/** Parse + validate a base64 data-URL for a document and extract its text. Throws 400 on any problem. */
export async function parseDocumentDataUrl(dataUrl: string, opts: ParseDocumentOptions): Promise<ParsedDocument> {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    throw Errors.badRequest("صيغة الملف غير صالحة — أرسل ملفًا بصيغة data-URL", "INVALID_DOCUMENT_FORMAT");
  }
  const mimeType = match[1]!.toLowerCase();
  if (!ALLOWED_DOCUMENT_MIMES.has(mimeType)) {
    throw Errors.badRequest("صيغة الملف غير مدعومة (PDF أو DOCX أو TXT أو MD فقط)", "UNSUPPORTED_DOCUMENT_TYPE");
  }
  const base64 = match[2]!;
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    throw Errors.badRequest("البيانات المرفقة غير صالحة", "INVALID_DOCUMENT_DATA");
  }
  if (bytes.length === 0) {
    throw Errors.badRequest("الملف المرفق فارغ", "EMPTY_DOCUMENT");
  }
  if (bytes.length > opts.maxBytes) {
    throw Errors.badRequest(
      `الملف كبير جدًا — الحد الأقصى ${Math.round(opts.maxBytes / 1024)} كيلوبايت`,
      "DOCUMENT_TOO_LARGE",
    );
  }

  // Magic-byte agreement (PHASE 15): the declared MIME must match what the
  // bytes actually are. A spoofed extension (text renamed to .pdf, a plain ZIP
  // claimed as .docx, …) is rejected up front — never extracted or stored.
  const declaredKind = kindForDeclaredMime(mimeType);
  const detectedKind = detectFileKind(bytes);
  if (declaredKind === null || detectedKind !== declaredKind) {
    throw Errors.badRequest(
      "محتوى الملف لا يطابق الصيغة المعلنة — تحقق من الامتداد أو نوع الملف",
      "FILE_TYPE_MISMATCH",
    );
  }

  const { text, truncated } = await extractDocumentText(bytes, mimeType, opts.maxChars);
  return {
    mimeType,
    fileName: opts.fileName ?? null,
    base64,
    bytes,
    sizeBytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    text,
    truncated,
  };
}

/**
 * Extracts plain text from a document buffer for a whitelisted mime type,
 * bounded to `maxChars`. Failures and no-text (scanned) files return empty —
 * they are never treated as a crash: the turn simply has no document text.
 */
export async function extractDocumentText(
  bytes: Buffer,
  mimeType: string,
  maxChars: number,
): Promise<{ text: string; truncated: boolean }> {
  let raw = "";
  if (mimeType === "application/pdf") {
    raw = await extractPdfText(bytes);
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    raw = await extractDocxText(bytes);
  } else if (mimeType === "text/plain" || mimeType === "text/markdown") {
    // Strip a UTF-8 BOM if present; text/* payloads are user bytes.
    raw = bytes.toString("utf8").replace(/^\uFEFF/, "");
  }

  // Replace NUL (some PDFs embed them) and collapse to a safe surface.
  const clean = raw.replace(/\u0000/g, " ").trim();
  if (clean.length === 0) return { text: "", truncated: false };
  if (clean.length <= maxChars) return { text: clean, truncated: false };
  return { text: `${clean.slice(0, maxChars).replace(/\s+$/u, "")}…`, truncated: true };
}

async function extractPdfText(bytes: Buffer): Promise<string> {
  try {
    // Legacy ESM build parses on the main thread (no worker/URL needed in Node).
    const doc = await getDocument({
      data: new Uint8Array(bytes),
      useSystemFonts: true,
    }).promise;
    try {
      let text = "";
      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const content = await page.getTextContent();
        text += content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .trim();
        text += "\n";
      }
      return text;
    } finally {
      await doc.destroy();
    }
  } catch {
    return "";
  }
}

async function extractDocxText(bytes: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return typeof result.value === "string" ? result.value : "";
  } catch {
    return "";
  }
}