import React from "react";
import { createRoot } from "react-dom/client";
import { StyleGuide } from "./StyleGuide.js";
import { initTheme } from "./theme.js";
import "./styles/tokens.css";
import "./styles/ui.css";
import "./styles/style-guide.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("root element missing");

initTheme();

createRoot(rootElement).render(
  <React.StrictMode>
    <StyleGuide />
  </React.StrictMode>,
);
