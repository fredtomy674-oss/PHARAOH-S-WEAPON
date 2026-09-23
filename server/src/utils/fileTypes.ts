/**
 * File-type sniffing by MAGIC bytes (PHASE 15 hardening).
 *
 * The MIME in a client-built data-URL is self-declared, so a caller can label
 * one thing and send another (a text file renamed to "*.pdf", a plain ZIP
 * labelled DOCX, …). Before any extraction or storage we sniff the actual
 * bytes and require them to agree with the declared type — mismatches are
 * rejected with `FILE_TYPE_MISMATCH` (a spoofed extension, or a confused
 * client) instead of being processed as the wrong file.
 *
 * Pure function module: no I/O, no parser imports — trivially unit-testable.
 */

export type DetectedFileKind = "pdf" | "docx" | "text";

/** Canonical MIME for each detected kind (used wherever the stored type matters). */
export const KIND_MIME: Record<DetectedFileKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  text: "text/plain",
};

// PDF spec: the "%PDF-" header may legally be preceded by junk, but must
// appear within the first 1024 bytes of the file.
const PDF_HEADER = Buffer.from("%PDF-", "ascii");
const PDF_HEADER_SCAN_LIMIT = 1024;

// OOXML (*.docx) files are ZIP archives that must start with the local-file
// header "PK\x03\x04"; the OPC part name "[Content_Types].xml" appears in
// plaintext near the archive start (its entry's local header).
const ZIP_LOCAL_FILE_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OOXML_CONTENT_TYPES = "[Content_Types].xml";
const OOXML_SCAN_LIMIT = 64 * 1024;

/**
 * Detects the actual file kind from raw bytes.
 *  - pdf:   "%PDF-" header within the first 1024 bytes.
 *  - docx:  ZIP local-file header + "[Content_Types].xml" present.
 *  - text:  everything else — including empty buffers and generic ZIP archives
 *           (a plain archive is NOT a Word document; the declared-MIME
 *           comparison then rejects it as `docx`).
 */
export function detectFileKind(bytes: Buffer): DetectedFileKind {
  if (bytes.length === 0) return "text";

  const head = bytes.subarray(0, Math.min(bytes.length, PDF_HEADER_SCAN_LIMIT));
  if (head.includes(PDF_HEADER)) return "pdf";

  if (bytes.length >= 4 && bytes.subarray(0, 4).equals(ZIP_LOCAL_FILE_HEADER)) {
    const zipHead = bytes.subarray(0, Math.min(bytes.length, OOXML_SCAN_LIMIT));
    if (zipHead.includes(OOXML_CONTENT_TYPES)) return "docx";
    return "text";
  }

  return "text";
}

/**
 * The kind a client-declared MIME claims to be (whitelist-only), or null when
 * the MIME is not a document type at all (never the case past the data-URL
 * whitelist check, but kept total for safety).
 */
export function kindForDeclaredMime(mimeType: string): DetectedFileKind | null {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "text/plain":
    case "text/markdown":
      return "text";
    default:
      return null;
  }
}