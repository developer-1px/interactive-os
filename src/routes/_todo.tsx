import { TodoApp } from "@apps/todo/app";
import { OS } from "@os/features/AntigravityOS";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_todo")({
    component: TodoLayout,
});

function TodoLayout() {
    return (
        <OS.App definition={TodoApp} isAppShell>
            <Outlet />
        </OS.App>
    );
}
