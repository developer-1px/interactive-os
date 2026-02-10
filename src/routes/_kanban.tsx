import { KanbanApp } from "@apps/kanban/app";
import { OS } from "@os/features/AntigravityOS";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_kanban")({
  component: KanbanLayout,
});

function KanbanLayout() {
  return (
    <OS.App definition={KanbanApp} isAppShell>
      <Outlet />
    </OS.App>
  );
}
