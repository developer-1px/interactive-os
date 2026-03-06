import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./docs-viewer.css";
import { Root } from "@os-react/1-listen/Root";
import { CommandPalette } from "@/command-palette/CommandPalette";
import { InspectorShell } from "@inspector/shell/InspectorShell";
import { useInspectorStore } from "@inspector/stores/InspectorStore";
import { DocsViewer } from "./DocsViewer";

// OS plugin registrations (side-effect imports)
import "@inspector/register";
import "@/command-palette/register";

function DocsRoot() {
  const isInspectorOpen = useInspectorStore(
    (s: { isOpen: boolean }) => s.isOpen,
  );

  return (
    <Root>
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <DocsViewer />
        </div>

        {/* Inspector (⌘I) */}
        {isInspectorOpen && (
          <aside className="h-full shrink-0 sticky top-0 z-50" data-inspector>
            <InspectorShell />
          </aside>
        )}

        {/* Command Palette (⌘K) */}
        <CommandPalette />
      </div>
    </Root>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DocsRoot />
  </StrictMode>,
);
