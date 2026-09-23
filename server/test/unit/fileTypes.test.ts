import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { detectFileKind, kindForDeclaredMime } from "../../src/utils/fileTypes.js";

const fixturesDir = new URL("../../../e2e/fixtures/", import.meta.url);
const readFixture = (name: string): Buffer => readFileSync(fileURLToPath(new URL(name, fixturesDir)));

describe("file-type sniffing (PHASE 15 MAGIC bytes)", () => {
  it("detects a real PDF by its %PDF- header", () => {
    expect(detectFileKind(readFixture("question.pdf"))).toBe("pdf");
  });

  it("detects a PDF whose header sits after a legal junk prefix (within 1024 bytes)", () => {
    const junked = Buffer.concat([Buffer.from("\u0000\u0001 binary junk\n", "latin1"), Buffer.from("%PDF-1.4\n", "latin1")]);
    expect(detectFileKind(junked)).toBe("pdf");
  });

  it("detects a DOCX by its ZIP local-file header + [Content_Types].xml", () => {
    expect(detectFileKind(readFixture("curriculum.docx"))).toBe("docx");
  });

  it("treats a generic ZIP without the OOXML content-types part as NOT docx", () => {
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("some random archive payload", "latin1")]);
    expect(detectFileKind(zip)).toBe("text");
  });

  it("treats UTF-8 text bytes (with or without BOM) as text", () => {
    expect(detectFileKind(Buffer.from("مرحبا بك في درس الجمع", "utf8"))).toBe("text");
    expect(detectFileKind(Buffer.from("\uFEFFمرحبا", "utf8"))).toBe("text");
  });

  it("treats an empty buffer as text (no signature)", () => {
    expect(detectFileKind(Buffer.alloc(0))).toBe("text");
  });

  it("maps declared document MIME types to their expected kind", () => {
    expect(kindForDeclaredMime("application/pdf")).toBe("pdf");
    expect(kindForDeclaredMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("docx");
    expect(kindForDeclaredMime("text/plain")).toBe("text");
    expect(kindForDeclaredMime("text/markdown")).toBe("text");
    expect(kindForDeclaredMime("application/zip")).toBeNull();
    expect(kindForDeclaredMime("image/png")).toBeNull();
  });
});