import type { AiService } from "../ai/aiService.js";

/**
 * OCR (PHASE 19): recognizes text on scanned files whose normal text layer
 * yielded nothing (PDF/DOCX — Path A chat attachments + Path B curriculum
 * import). The actual reading is delegated to the AI OCR provider
 * (MockOcrProvider offline / GeminiOcrProvider in production) through
 * `AiService.ocr`, which also records the cost usage.
 *
 * Security posture:
 *  - OCR runs ONLY when the ordinary extractor produced no text AND the MIME is
 *    a scanned-capable document type (PDF/DOCX). Plain text uploads are never
 *    OCR'd — a too-short TXT stays a hard EMPTY_DOCUMENT error.
 *  - The recognized text is UNTRUSTED file content. Downstream it travels
 *    exactly like extracted PDF text: Path A re-scans it with the prompt-
 *    injection tripwire before the tutor model sees it; Path B lands it in the
 *    RAG <context> block (content, never system instructions).
 *  - A failing OCR provider never crashes the turn/import: it degrades to the
 *    empty-text semantics the scanned-file path already had.
 */

/** Scanned-capable MIME types: OCR reads these when their text layer is empty. */
export const OCR_ELIGIBLE_MIMES: ReadonlySet<string> = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export interface OcrRecognizeInput {
  mimeType: string;
  base64: string;
  fileName?: string | null;
  /** Output bound; the recognized text is cut to this budget. */
  maxChars: number;
  contextUserId?: string;
  contextSessionId?: string;
}

export interface OcrRecognizeResult {
  /** Recognized text ("" when OCR is ineligible or the provider yielded nothing). */
  text: string;
  /** True when `text` was cut to the maxChars budget. */
  truncated: boolean;
}

export class OcrService {
  constructor(private readonly ai: Pick<AiService, "ocr">) {}

  async recognize(input: OcrRecognizeInput): Promise<OcrRecognizeResult> {
    if (!OCR_ELIGIBLE_MIMES.has(input.mimeType)) return { text: "", truncated: false };

    try {
      const res = await this.ai.ocr({
        mimeType: input.mimeType,
        base64: input.base64,
        fileName: input.fileName,
        contextUserId: input.contextUserId,
        contextSessionId: input.contextSessionId,
      });
      const clean = (res.text ?? "").replace(/\u0000/g, " ").trim();
      if (clean.length === 0) return { text: "", truncated: false };
      if (clean.length <= input.maxChars) return { text: clean, truncated: false };
      return { text: `${clean.slice(0, input.maxChars).replace(/\s+$/u, "")}…`, truncated: true };
    } catch {
      // OCR failure keeps the "no text" semantics — never crashes the turn.
      return { text: "", truncated: false };
    }
  }
}