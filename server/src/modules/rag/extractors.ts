import { createHash } from "node:crypto";
import { UnsupportedSourceError } from "../../utils/errors.js";

export type SourceKind = "text" | "pdf" | "docx" | "csv" | "image" | "structured";

export interface ExtractedContent {
  kind: SourceKind;
  /** Raw normalized text ready for chunking. */
  text: string;
}

/**
 * Extraction layer. MVP ships 'text'/'csv'; PDF, DOCX and image extraction are
 * ARCHITECTURALLY PLANNED but deliberately unsupported now (documented in
 * DECISIONS/README) to avoid heavy native dependencies. They raise a clear,
 * intentional error instead of silently producing garbage.
 */

export function extractText(kind: SourceKind, raw: string, _filename?: string): ExtractedContent {
  switch (kind) {
    case "text":
      return { kind, text: raw };
    case "csv": {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const header = lines[0] ?? "";
      const text = lines
        .slice(1)
        .map((line) => `$row$ ${header}\n${line}`)
        .join("\n\n");
      return { kind, text };
    }
    case "pdf":
      throw new UnsupportedSourceError(
        "استخراج PDF (خارج النص الخام) غير مفعّل في MVP — أرسل النص كملف txt/md أو استخدم واجهة ingest بالنص. السبب: تجنب اعتماديات أصلية ثقيلة الآن (DECISIONS.md D-009).",
      );
    case "docx":
      throw new UnsupportedSourceError("استخراج DOCX غير مفعّل في MVP — حوّله إلى نص txt/md أولًا (DECISIONS.md D-009).");
    case "image":
      throw new UnsupportedSourceError("استخراج الصور يتطلب مزود Vision — غير مفعّل في MVP (راجع UI_UX_SPEC خطة التوسع).");
    case "structured":
      // Structured content arrives as text (e.g. a lesson page). Same path.
      return { kind: "text", text: raw };
    default: {
      const never: never = kind;
      throw new UnsupportedSourceError(`نوع مصدر غير معروف: ${String(never)}`);
    }
  }
}

/** Light normalization: unify newlines, trim each line, collapse blank runs. */
export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Content-hash for deduplication. */
export function contentHash(content: string): string {
  // Inlined to avoid pulling the utils module across folders: SHA-256 hex.
  const buf = createHash("sha256").update(content).digest();
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}