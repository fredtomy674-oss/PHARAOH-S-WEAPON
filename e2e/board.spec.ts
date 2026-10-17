import { expect, test } from "@playwright/test";
import { BOARD_TITLE_MARKER, login, sendChatMessage, startFirstLesson } from "./helpers.js";

/**
 * PHASE 166 — «سبورة الفصل»: the teacher writes while explaining.
 *
 * The room's board always carried the student's own ink («لوح الحبر»). This
 * suite protects the second layer the owner asked for: the teacher's write-up —
 * a short title and a few short lines (the key idea, the steps, the example,
 * the result) — refreshed with every reply, the way a teacher wipes and
 * rewrites the board while the class moves on.
 *
 * The offline backend writes a deterministic board (see server `mock.ts`), so
 * the round-trip is fully observable with zero keys.
 */
test.describe.configure({ mode: "serial" });

test("B1: the first reply writes the board, inside the surface, under the ink", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  // The board starts clean: nothing was written before the first reply.
  await expect(page.getByTestId("board-chalk")).toHaveCount(0);

  await sendChatMessage(page, "اشرح لي درس اليوم");
  await expect(page.getByTestId("msg-tutor")).toHaveCount(1, { timeout: 30_000 });

  // The teacher's write-up is on the board: the marker title + real lines.
  const chalk = page.getByTestId("board-chalk");
  await expect(chalk).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("board-chalk-title")).toHaveText(BOARD_TITLE_MARKER);
  const lines = page.getByTestId("board-chalk-line");
  expect(await lines.count()).toBeGreaterThanOrEqual(2);
  const kinds = await lines.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-kind")),
  );
  for (const kind of kinds) {
    expect(["point", "step", "example", "answer", "note"]).toContain(kind);
  }
  // The method is always chalked as steps — without them the board is a title.
  expect(kinds).toContain("step");
  for (const text of await lines.allTextContents()) {
    expect(text.trim().length).toBeGreaterThan(0);
  }

  // It lives INSIDE the board surface: the stage stays one board — the
  // teacher's writing and the student's pen share it.
  await expect(page.getByTestId("board-surface").getByTestId("board-chalk")).toBeVisible();

  // And it is read-only by construction: pointer-events none, so the canvas
  // keeps every stroke and the chalk can never eat a student's drawing.
  const pointerEvents = await chalk.evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pointerEvents).toBe("none");
});

test("B2: a new reply rewrites the same board — one write-up, never a stack", async ({ page }) => {
  await login(page);
  await startFirstLesson(page);

  await sendChatMessage(page, "اشرح لي درس اليوم");
  await expect(page.getByTestId("board-chalk")).toBeVisible({ timeout: 30_000 });

  // A second tutor reply rewrites the board: still exactly ONE chalk layer
  // (the classroom board holds the current write-up, not the whole lesson).
  await sendChatMessage(page, "أعد الشرح باختصار من فضلك");
  await expect(page.getByTestId("msg-tutor")).toHaveCount(2, { timeout: 30_000 });
  await expect(page.getByTestId("board-chalk")).toHaveCount(1);
  await expect(page.getByTestId("board-chalk-title")).toHaveText(BOARD_TITLE_MARKER);
});
