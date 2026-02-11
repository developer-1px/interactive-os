import { OS } from "@os/AntigravityOS";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_minimal")({
  component: MinimalLayout,
});

function MinimalLayout() {
  return (
    <OS.Zone id="os-shell" className="h-full flex flex-col overflow-hidden">
      <Outlet />
    </OS.Zone>
  );
}
