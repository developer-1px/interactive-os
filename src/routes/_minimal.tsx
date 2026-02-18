import { Zone } from "@os/6-components/primitives/Zone";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_minimal")({
  component: MinimalLayout,
});

function MinimalLayout() {
  return (
    <Zone id="os-shell" className="h-full flex flex-col">
      <Outlet />
    </Zone>
  );
}
