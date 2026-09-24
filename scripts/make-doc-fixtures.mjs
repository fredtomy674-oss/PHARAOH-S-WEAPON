// Generates the tiny binary test fixtures used by server unit/API tests and E2E:
//
//   e2e/fixtures/question.pdf     — minimal one-page PDF containing "TutorFixturePDF 123"
//   e2e/fixtures/question.docx    — minimal DOCX (OPC zip) containing "TutorFixtureDOCX 456"
//   e2e/fixtures/curriculum.pdf   — same PDF builder, longer realistic lesson text (> 40 chars)
//   e2e/fixtures/curriculum.docx  — same DOCX builder, longer realistic lesson text (> 40 chars)
//
// The question.* pair feeds the STUDENT-document path (Path A); the curriculum.*
// pair feeds the admin curriculum-import path (Path B). Both PDFs/docs are built
// with the same byte-accurate techniques:
//   - The PDF uses a hand-written xref table (offsets computed from the exact
//     ASCII byte positions, incl. the 9-byte "%PDF-1.4\n" header).
//   - The DOCX is a hand-written ZIP (STORED method + CRC-32) of the minimal
//     OOXML parts. PowerShell's Compress-Archive / .NET Framework zip writers
//     store backslash entry names on Windows, which OPC readers reject; a
//     hand-built archive keeps forward-slash names deterministically.
//
// Run:      node scripts/make-doc-fixtures.mjs
// Re-run:   safe — all fixtures are overwritten (deterministic output).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = path.join(root, "e2e", "fixtures");
mkdirSync(fixturesDir, { recursive: true });

// --- PDF -------------------------------------------------------------------
// Minimal single-page PDF: catalog → pages → one page → one content stream
// (a Helvetica text line) → font. The xref table offsets are computed from the
// exact ASCII byte positions so any PDF reader (incl. pdf.js) can locate every
// object. Text must stay ASCII (Helvetica/WinAnsiEncoding). The MediaBox is
// extra-wide (1500 units) so pdf.js extracts the WHOLE line: without the
// standard font metrics it clips a text run at the page width, so the line
// must fit on a single visual row.
function minimalPdf(text) {
  const content = `BT /F1 24 Tf 40 80 Td (${text}) Tj ET`;
  const objects = [
    ["1 0 obj", "<< /Type /Catalog /Pages 2 0 R >>", "endobj"],
    ["2 0 obj", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "endobj"],
    ["3 0 obj", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1500 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>", "endobj"],
    ["4 0 obj", `<< /Length ${Buffer.byteLength(content, "ascii")} >>`, "stream", content, "endstream", "endobj"],
    ["5 0 obj", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "endobj"],
  ];

  const out = [];
  const offsets = [];
  // Offsets are measured from the start of the FILE, so the 9-byte ASCII
  // header ("%PDF-1.4\n") is part of every object's position.
  let size = Buffer.byteLength("%PDF-1.4\n", "ascii");
  for (const body of objects) {
    offsets.push(size);
    for (const line of body) {
      out.push(line, "\n");
      size += Buffer.byteLength(line, "ascii") + 1;
    }
  }

  // xref entries are exactly 20 bytes each (pdf spec requirement).
  const xrefStart = size;
  let xref = `xref\n0 ${objects.length + 1}\n${"0000000000 65535 f \n"}`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(`%PDF-1.4\n${out.join("")}${xref}${trailer}`, "ascii");
}

/**
 * A VALID one-page PDF whose content stream is EMPTY — the exact shape a
 * scanned page has from the text layer's point of view: nothing extractable,
 * so pdf.js yields "" and the OCR fallback (PHASE 19) takes over.
 */
function blankPdf() {
  const objects = [
    ["1 0 obj", "<< /Type /Catalog /Pages 2 0 R >>", "endobj"],
    ["2 0 obj", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "endobj"],
    ["3 0 obj", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>", "endobj"],
    ["4 0 obj", "<< /Length 0 >>", "stream", "", "endstream", "endobj"],
  ];

  const out = [];
  const offsets = [];
  let size = Buffer.byteLength("%PDF-1.4\n", "ascii");
  for (const body of objects) {
    offsets.push(size);
    for (const line of body) {
      out.push(line, "\n");
      size += Buffer.byteLength(line, "ascii") + 1;
    }
  }

  const xrefStart = size;
  let xref = `xref\n0 ${objects.length + 1}\n${"0000000000 65535 f \n"}`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(`%PDF-1.4\n${out.join("")}${xref}${trailer}`, "ascii");
}

// --- ZIP (STORED method, forward-slash names, UTF-8 flag) --------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Builds a minimal ZIP archive from [{ name, data(Buffer) }] without compression. */
function makeZip(files) {
  const body = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    local.writeUInt16LE(0, 8); // method: stored
    local.writeUInt16LE(0, 10); // mod time / date
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra
    body.push(local, nameBuf, data);

    const cent = Buffer.alloc(46);
    cent.writeUInt32LE(0x02014b50, 0);
    cent.writeUInt16LE(20, 4);
    cent.writeUInt16LE(20, 6);
    cent.writeUInt16LE(0x0800, 8);
    cent.writeUInt16LE(0, 10);
    cent.writeUInt16LE(0, 12);
    cent.writeUInt16LE(0, 14);
    cent.writeUInt32LE(crc, 16);
    cent.writeUInt32LE(data.length, 20);
    cent.writeUInt32LE(data.length, 24);
    cent.writeUInt16LE(nameBuf.length, 28);
    cent.writeUInt16LE(0, 30);
    cent.writeUInt16LE(0, 32);
    cent.writeUInt16LE(0, 34);
    cent.writeUInt16LE(0, 36);
    cent.writeUInt32LE(0, 38);
    cent.writeUInt32LE(offset, 42);
    central.push(cent, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const centralSize = central.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...body, ...central, eocd]);
}

// --- DOCX --------------------------------------------------------------------
function makeDocxParts(markerText) {
  return [
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          "</Types>\n",
        "utf8",
      ),
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
          "</Relationships>\n",
        "utf8",
      ),
    },
    {
      name: "word/document.xml",
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
          '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
          `<w:body><w:p><w:r><w:t>${markerText}</w:t></w:r></w:p></w:body>` +
          "</w:document>\n",
        "utf8",
      ),
    },
  ];
}

// --- Fixture text ------------------------------------------------------------
// Path A (student chat attachments): short markers are enough (no KB minimum).
const QUESTION_PDF_TEXT = "TutorFixturePDF 123";
const QUESTION_DOCX_TEXT = "TutorFixtureDOCX 456";

// Path B (curriculum import): longer lesson-like text (> 40 chars) so the
// knowledge-base minimum ("cleaned text ≥ 40 chars") is satisfied for real.
const CURRICULUM_PDF_TEXT =
  "Curriculum sample: this lesson page is imported into the knowledge base for RAG retrieval tests. TutorFixturePDF 123.";
const CURRICULUM_DOCX_TEXT =
  "Curriculum sample: this lesson page is imported into the knowledge base for RAG retrieval tests. TutorFixtureDOCX 456.";

writeFileSync(path.join(fixturesDir, "question.pdf"), minimalPdf(QUESTION_PDF_TEXT));
writeFileSync(path.join(fixturesDir, "question.docx"), makeZip(makeDocxParts(QUESTION_DOCX_TEXT)));
writeFileSync(path.join(fixturesDir, "curriculum.pdf"), minimalPdf(CURRICULUM_PDF_TEXT));
writeFileSync(path.join(fixturesDir, "curriculum.docx"), makeZip(makeDocxParts(CURRICULUM_DOCX_TEXT)));
// Scanned fixture: a valid PDF with NO text layer (empty content stream) —
// exactly what an image-only scan looks like to the extractor.
writeFileSync(path.join(fixturesDir, "scanned.pdf"), blankPdf());

console.log(`fixtures written to ${fixturesDir}`);