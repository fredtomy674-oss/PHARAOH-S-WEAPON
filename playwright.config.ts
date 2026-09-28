import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

/**
 * Browser end-to-end tests that run the REAL stack:
 *   Browser → React SPA → Vite proxy → Fastify backend → SQLite → RAG
 *   → AI provider (dev "mock", the project default) → DB persistence → Browser
 *
 * Isolation: the backend for tests runs on its own port (3107) against its own
 * throwaway SQLite DB (seeded fresh on every run), so dev data is never touched.
 * The web app runs on the canonical port 5173 through the Vite proxy, which
 * Playwright points at the test backend via VITE_API_PROXY_TARGET.
 *
 * Requires: `npm run e2e:install` once (downloads Chromium).
 */
const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 3107);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5173);
const E2E_DB = path.join(os.tmpdir(), "alfarouq-e2e.sqlite");

const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

const backendEnv = {
  PORT: String(BACKEND_PORT),
  DB_FILE: E2E_DB,
  DAILY_MESSAGE_LIMIT: "50",
  // The E2E suite intentionally raises the per-minute rate limit: automated
  // browsers + health polling easily exceed the dev default of 120/min.
  RATE_LIMIT_MAX: "1000",
  NODE_ENV: "development",
  // PHASE 40 (D-044) — the E2E backend has its own voice: a deterministic local
  // WAV, so the narration route is exercised for real without a key or network.
  // The browser-fallback tests force a 503 instead (see forceNoServerSpeech).
  SPEECH_PROVIDER: "stub",
  // PHASE 42 — the offline providers are pinned here, exactly as in
  // server/test/setup.ts, and for the same reason. dotenv does not overwrite a
  // real env var, so these win over the developer's `server/.env`: without them
  // a machine configured for the real provider made 11 browser tests call the
  // live API and fail, while the same tests pass on a machine without that
  // file. A suite whose result depends on an untracked file is not a suite.
  AI_LLM_PROVIDER: "mock",
  AI_EMBEDDING_PROVIDER: "mock",
  AI_OCR_PROVIDER: "mock",
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command:
        "npm run e2e:backend",
      url: `${BACKEND_URL}/api/health`,
      timeout: 90_000,
      reuseExistingServer: false,
      env: backendEnv,
    },
    {
      // Real Vite dev server + HMR; proxy target overridden to the test backend.
      command:
        "npm run dev --workspace web -- --port " + WEB_PORT + " --strictPort",
      url: WEB_URL,
      timeout: 90_000,
      reuseExistingServer: false,
      env: { VITE_API_PROXY_TARGET: BACKEND_URL },
    },
  ],
});