import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./docs-viewer.css";
import { DocsViewer } from "./DocsViewer";
import { Root } from "@os/6-components/primitives/Root";
import { CommandPalette } from "@/command-palette/CommandPalette";

// OS plugin registrations (side-effect imports)
import "@/command-palette/register";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root>
      <DocsViewer />
      <CommandPalette />
    </Root>
  </StrictMode>,
);
