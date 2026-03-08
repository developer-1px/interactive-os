import { InspectorShell } from "@inspector/shell/InspectorShell";
import { useInspectorStore } from "@inspector/stores/InspectorStore";
import { Root } from "@os-react/1-listen/Root";
import { CommandPalette } from "@/command-palette/CommandPalette";
import { DocsViewer } from "./DocsViewer";

export function DocsRoot() {
  const isInspectorOpen = useInspectorStore(
    (s: { isOpen: boolean }) => s.isOpen,
  );

  return (
    <Root>
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <DocsViewer />
        </div>

        {/* Inspector */}
        {isInspectorOpen && (
          <aside className="h-full shrink-0 sticky top-0 z-50">
            <InspectorShell />
          </aside>
        )}

        {/* Command Palette */}
        <CommandPalette />
      </div>
    </Root>
  );
}
