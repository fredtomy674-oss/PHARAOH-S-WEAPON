import { describe, expect, it } from "vitest";
import { cyrb128, newId, randomToken, safeEqual, sha256Hex } from "../../src/utils/ids.js";

describe("ids", () => {
  it("newId prefixes and is unique", () => {
    const a = newId("usr");
    const b = newId("usr");
    expect(a.startsWith("usr_")).toBe(true);
    expect(a).not.toBe(b);
  });

  it("randomToken returns hex of requested byte length", () => {
    const t = randomToken(16);
    expect(t).toMatch(/^[0-9a-f]{32}$/);
  });

  it("sha256Hex is deterministic and 64 hex chars", () => {
    expect(sha256Hex("abc")).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex("abc")).toBe(sha256Hex("abc"));
    expect(sha256Hex("abc")).not.toBe(sha256Hex("abd"));
  });

  it("safeEqual compares constant-time style and rejects mismatches", () => {
    expect(safeEqual("same", "same")).toBe(true);
    expect(safeEqual("same", "different")).toBe(false);
    expect(safeEqual("a", "aa")).toBe(false);
  });

  it("cyrb128 is deterministic", () => {
    expect(cyrb128("كلمة")).toEqual(cyrb128("كلمة"));
  });
});