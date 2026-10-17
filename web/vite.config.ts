import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Default: the local dev backend. E2E (Playwright) overrides this with its own
// test backend (VITE_API_PROXY_TARGET) so tests never touch dev data.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:3001";

// Dev server and preview serve the same API contract, so they share one rule.
const apiProxy = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  // The lab avatar is a .vrm (glTF-binary) imported with `?url` inside the
  // lab-only module graph, so the student bundle never contains it.
  assetsInclude: ["**/*.vrm"],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },
  // PHASE 165 (W8) — الاختبار والإثبات على البناء الحقيقي: preview يخدم dist
  // بنفس بروكسي الـAPI. التسجيل (registerPwa) في الإنتاج فقط، فهنا وحدها
  // تعمل القوقعة فعلًا — وبيئة HMR لا تُقاصّ أبدًا بكاش قديم.
  preview: {
    host: "127.0.0.1",
    proxy: apiProxy,
  },
  build: {
    // Dev-only pages ship ONLY behind their flags (default off): the student
    // bundle never changes, and removing a lab is deleting its HTML entry +
    // its src modules plus this block. The dev server always serves them so
    // they are testable without a special build.
    rollupOptions: {
      input: {
        main: "index.html",
        ...(process.env.VITE_AVATAR_LAB === "1" ? { "avatar-lab": "avatar-lab.html" } : {}),
        ...(process.env.VITE_STYLE_GUIDE === "1" ? { "style-guide": "style-guide.html" } : {}),
      },
    },
  },
});
