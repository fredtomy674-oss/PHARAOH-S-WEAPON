import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { APP_BUILD } from "./build.js";
import { initTheme } from "./theme.js";
import { registerPwa } from "./pwa/register.js";
import "./styles/tokens.css";
import "./styles.css";
import "./styles/ui.css";
import "./styles/home.css";
import "./styles/app.css";
import "./styles/entry.css";
import "./styles/learn.css";
import "./styles/sources.css";
import "./styles/journey.css";
import "./styles/liveTeacher.css";
import "./styles/parent.css";
import "./styles/admin.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("root element missing");

initTheme();
// PHASE 165 (W8) — القوقعة تُسجَّل في الإنتاج وحده (انظر pwa/register.ts).
registerPwa();
// PHASE 174 — نبضة واحدة عند كل تحميل: الخادم يسجّل البناء الذي يعمل فعلًا على
// الجهاز (GET /api/health?v=…)، فيمكن الجزم — من بعيد — هل وصل الإصلاح للجوال.
void fetch(`/api/health?v=${encodeURIComponent(APP_BUILD)}`, { cache: "no-store" }).catch(() => undefined);

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
