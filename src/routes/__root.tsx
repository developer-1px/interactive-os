import { GlobalNav } from "@apps/todo/widgets/GlobalNav";
import { InspectorShell } from "@inspector/shell/InspectorShell";
import { useInspectorStore } from "@inspector/stores/InspectorStore";
import { OS } from "@os/AntigravityOS";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { CommandPalette } from "@/command-palette/CommandPalette";

// Plugin registrations (side-effect imports)
import "@inspector/register";
import "@/command-palette/register";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="mb-8">The page you are looking for does not exist.</p>
        <Link to="/" className="text-indigo-600 hover:underline">
          Go Home
        </Link>
      </div>
    );
  },
});

function RootComponent() {
  const isInspectorOpen = useInspectorStore(
    (s: { isOpen: boolean }) => s.isOpen,
  );

  return (
    <OS.Root>
      <div className="app-viewport">
        {/* Global Activity Bar */}
        <GlobalNav />

        {/* Main App Container */}
        <div className="app-main">
          <div className="app-content">
            <Outlet />
          </div>
        </div>

        {/* Inspector */}
        {isInspectorOpen && (
          <aside
            className="h-full flex-shrink-0 sticky top-0 z-50"
            data-inspector
          >
            <InspectorShell />
          </aside>
        )}

        {/* Command Palette (⌘K) */}
        <CommandPalette />

        <TanStackRouterDevtools />
      </div>
    </OS.Root>
  );
}
