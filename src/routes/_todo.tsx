import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_todo")({
  component: TodoLayout,
});

function TodoLayout() {
  return <Outlet />;
}
