import { OS } from "@os/features/AntigravityOS";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_minimal")({
    component: MinimalLayout,
});

function MinimalLayout() {
    return (
        <OS.App isAppShell>
            <Outlet />
        </OS.App>
    );
}
