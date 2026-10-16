import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { initTheme } from "./theme.js";
import "./styles/tokens.css";
import "./styles.css";
import "./styles/ui.css";
import "./styles/home.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("root element missing");

initTheme();

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
