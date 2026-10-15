import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Default: the local dev backend. E2E (Playwright) overrides this with its own
// test backend (VITE_API_PROXY_TARGET) so tests never touch dev data.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Avatar Lab ships ONLY behind the flag (default off): the student bundle
    // never changes, and removing the Lab is deleting avatar-lab.html +
    // src/avatar* plus this block. The dev server always serves both pages so
    // the Lab is testable without a special build.
    rollupOptions: {
      input: {
        main: "index.html",
        ...(process.env.VITE_AVATAR_LAB === "1" ? { "avatar-lab": "avatar-lab.html" } : {}),
      },
    },
  },
});