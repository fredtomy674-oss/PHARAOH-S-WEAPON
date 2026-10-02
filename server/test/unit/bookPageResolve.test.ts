import { describe, expect, it } from "vitest";
import { resolveBookPage } from "../../src/modules/sessions/service.js";

/**
 * PHASE 75 — the one rule for "is this a page of the lesson?". A lesson can now
 * reach beyond its own printed range (the Arabic listening appendix), so the
 * page set is the truth when it is known; the range is only the fallback for a
 * caller that carries no page set. A page inside `from..to` that is NOT in the
 * set (a gap) must never be believed.
 */
describe("resolveBookPage (PHASE 75)", () => {
  const stage = {
    fromBookPage: 6,
    toBookPage: 8,
    pages: [{ bookPage: 6 }, { bookPage: 7 }, { bookPage: 8 }, { bookPage: 146 }],
  };

  it("accepts a page the lesson owns, including its appendix page", () => {
    expect(resolveBookPage(stage, 6)).toBe(6);
    expect(resolveBookPage(stage, 8)).toBe(8);
    expect(resolveBookPage(stage, 146)).toBe(146);
  });

  it("rejects a page the lesson does not have", () => {
    expect(resolveBookPage(stage, 5)).toBeUndefined();
    expect(resolveBookPage(stage, 9)).toBeUndefined();
    expect(resolveBookPage(stage, 145)).toBeUndefined();
  });

  it("rejects a gap page even when it sits inside the from..to span", () => {
    // A non-contiguous stage (owned range 6…8 plus appendix 146) must not accept
    // 9–145 merely because the range end was widened by the appendix.
    const gapped = { fromBookPage: 6, toBookPage: 146, pages: [{ bookPage: 6 }, { bookPage: 146 }] };
    expect(resolveBookPage(gapped, 50)).toBeUndefined();
    expect(resolveBookPage(gapped, 146)).toBe(146);
  });

  it("falls back to the range when the caller carries no page set", () => {
    expect(resolveBookPage({ fromBookPage: 0, toBookPage: 13 }, 5)).toBe(5);
    expect(resolveBookPage({ fromBookPage: 0, toBookPage: 13 }, 14)).toBeUndefined();
  });

  it("resolves nothing without a stage or a page", () => {
    expect(resolveBookPage(null, 5)).toBeUndefined();
    expect(resolveBookPage(stage, undefined)).toBeUndefined();
  });
});
