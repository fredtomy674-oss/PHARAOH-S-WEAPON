import React from "react";
import { createRoot } from "react-dom/client";
import { AvatarLab } from "./avatar/AvatarLab.js";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("root element missing");

createRoot(rootElement).render(
  <React.StrictMode>
    <AvatarLab />
  </React.StrictMode>,
);
