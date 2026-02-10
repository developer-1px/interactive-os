import { OS } from "@os/features/AntigravityOS";
import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";

export const Route = createFileRoute("/_minimal")({
  component: MinimalLayout,
});

function MinimalLayout() {
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const isAppShell =
    (leaf?.staticData as Record<string, unknown>)?.['isAppShell'] === true;

  return (
    <OS.App isAppShell={isAppShell}>
      <Outlet />
    </OS.App>
  );
}
