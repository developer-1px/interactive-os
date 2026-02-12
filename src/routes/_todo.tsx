import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_todo")({
  component: TodoLayout,
  staticData: {
    isAppShell: true,
  },
});

function TodoLayout() {
  return <Outlet />;
}
