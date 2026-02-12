import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./docs-viewer.css";
import { DocsViewer } from "./DocsViewer";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DocsViewer />
  </StrictMode>,
);
