import { describe, expect, it } from "vitest";
import {
  installRowKind,
  isIoSSafari,
  isStandaloneDisplay,
} from "./install.js";

/**
 * PHASE 165 (W8) — قرار اختيار صف التثبيت + كاشف سفاري iOS نقيان ويُختبران
 * وحدهما؛ ربط المتصفح نفسه يثبّته PW2 في الاختبار المتصفحي على البناء الحقيقي.
 */
describe("pwa install offer", () => {
  const IPHONE_SAFARI =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const IPAD_SAFARI =
    "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

  it("يميّز سفاري iOS عن رفاقه على نفس النظام", () => {
    expect(isIoSSafari(IPHONE_SAFARI)).toBe(true);
    expect(isIoSSafari(IPAD_SAFARI)).toBe(true);
    expect(isIoSSafari(IPHONE_SAFARI.replace("Safari/604.1", "CriOS/126.0"))).toBe(false);
    expect(isIoSSafari(IPHONE_SAFARI.replace("Safari/604.1", "FxiOS/127.0"))).toBe(false);
  });

  it("لا يظنّ سطح مكتب أو أندرويد سفاري iOS", () => {
    expect(
      isIoSSafari(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      ),
    ).toBe(false);
    expect(
      isIoSSafari(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
  });

  it("يعرف التطبيق المثبَّت من وضع العرض أو خاصية سفاري", () => {
    expect(isStandaloneDisplay(true, undefined)).toBe(true);
    expect(isStandaloneDisplay(false, true)).toBe(true);
    expect(isStandaloneDisplay(false, false)).toBe(false);
    expect(isStandaloneDisplay(false, undefined)).toBe(false);
  });

  it("يختار الصف الصحيح: مثبَّت صمت · عرض من المتصفح زر · iOS تلميح", () => {
    expect(
      installRowKind({ canInstall: true, iosSafari: true, standalone: true }),
    ).toBe("none");
    expect(
      installRowKind({ canInstall: true, iosSafari: false, standalone: false }),
    ).toBe("button");
    expect(
      installRowKind({ canInstall: false, iosSafari: true, standalone: false }),
    ).toBe("ios-hint");
    expect(
      installRowKind({ canInstall: false, iosSafari: false, standalone: false }),
    ).toBe("none");
  });
});
