import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Default: the local dev backend. E2E (Playwright) overrides this with its own
// test backend (VITE_API_PROXY_TARGET) so tests never touch dev data.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});