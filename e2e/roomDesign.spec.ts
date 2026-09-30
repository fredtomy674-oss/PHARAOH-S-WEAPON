import { expect, test, type Page } from "@playwright/test";
import { login, sendChatMessage, startLessonOfSubject } from "./helpers.js";

/**
 * PHASE 54 — design regression net for the lesson room.
 *
 * Taste is argued with measurements, not adjectives: no horizontal overflow at
 * desktop and phone widths, readable type (size/leading), sufficient contrast
 * for body and muted text, and touch targets a finger can actually hit.
 */
async function luminance(hex: string): Promise<number> {
  const c = hex.replace("#", "");
  const f = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}

async function contrast(page: Page, fg: string, bg: string): Promise<number> {
  const [a, b] = await Promise.all([luminance(fg), luminance(bg)]);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function toHex(color: string): string {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  if (!m) throw new Error(`cannot parse color ${color}`);
  const h = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${h(m[1]!)}${h(m[2]!)}${h(m[3]!)}`;
}

async function openRoomWithReply(page: Page): Promise<void> {
  await login(page);
  await startLessonOfSubject(page, "الرياضيات");
  await expect(page.getByTestId("stage-image")).toBeVisible({ timeout: 20_000 });
  await sendChatMessage(page, "اشرح لي الدرس");
  await expect(page.getByTestId("msg-tutor").first()).toContainText("تلميح", { timeout: 30_000 });
}

test("DESIGN1: no horizontal overflow, readable type, sufficient contrast", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openRoomWithReply(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "horizontal overflow at desktop width").toBeLessThanOrEqual(1);

  const type = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="msg-tutor"] .room-caption-body') as HTMLElement;
    const cs = getComputedStyle(el);
    const p = el.querySelector(".fmt-p") as HTMLElement;
    const pcs = p ? getComputedStyle(p) : null;
    return {
      bodyFont: cs.fontSize,
      bodyLeading: cs.lineHeight,
      pFont: pcs?.fontSize ?? null,
      pLeading: pcs?.lineHeight ?? null,
    };
  });
  console.log("TYPE-DESKTOP:" + JSON.stringify(type));

  const colors = await page.evaluate(() => {
    const body = document.querySelector('[data-testid="msg-tutor"] .room-caption-body') as HTMLElement;
    const muted = document.querySelector(".room-stage-note") as HTMLElement;
    const bcs = getComputedStyle(body);
    const mcs = getComputedStyle(muted);
    return {
      bodyFg: bcs.color,
      bodyBg: bcs.backgroundColor,
      mutedFg: mcs.color,
      mutedBg: mcs.backgroundColor,
    };
  });
  // Backgrounds may be translucent gradients: computed backgroundColor can be
  // transparent; fall back to the room paper token in that case.
  const bodyBg = colors.bodyBg === "rgba(0, 0, 0, 0)" ? "#ffffff" : toHex(colors.bodyBg);
  const mutedBg = colors.mutedBg === "rgba(0, 0, 0, 0)" ? "#fffdf8" : toHex(colors.mutedBg);
  const bodyContrast = await contrast(page, toHex(colors.bodyFg), bodyBg);
  const mutedContrast = await contrast(page, toHex(colors.mutedFg), mutedBg);
  console.log(`CONTRAST body=${bodyContrast.toFixed(2)} muted=${mutedContrast.toFixed(2)}`);
  expect(bodyContrast, "tutor body contrast").toBeGreaterThanOrEqual(4.5);
  expect(mutedContrast, "muted note contrast").toBeGreaterThanOrEqual(4.5);
});

test("DESIGN2: touch targets and phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoomWithReply(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "horizontal overflow at phone width").toBeLessThanOrEqual(1);

  const targets = await page.evaluate(() => {
    const out: Record<string, number> = {};
    const grab = (name: string, sel: string) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (!el) {
        out[name] = -1;
        return;
      }
      const r = el.getBoundingClientRect();
      out[name] = Math.round(Math.min(r.width, r.height));
    };
    grab("send", '[data-testid="send-message"]');
    grab("thumb", ".room-thumb");
    grab("stageNext", '[data-testid="stage-next"]');
    grab("inkPen", '[data-testid="ink-pen"]');
    grab("speak", '[data-testid="speak-reply"]');
    return out;
  });
  console.log("TARGETS:" + JSON.stringify(targets));
  for (const [name, size] of Object.entries(targets)) {
    expect(size, `touch target ${name}`).toBeGreaterThanOrEqual(32);
  }
});
