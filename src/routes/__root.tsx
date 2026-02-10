import { GlobalNav } from "@apps/todo/widgets/GlobalNav";
import { InspectorShell } from "@os/app/debug/InspectorShell";
import { OS } from "@os/features/AntigravityOS";
import { useInspectorStore } from "@os/inspector/InspectorStore";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

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
    const isInspectorOpen = useInspectorStore((s) => s.isOpen);

    return (
        <OS.Root>
            <div className="h-screen w-screen bg-[#0a0a0a] flex overflow-hidden font-sans text-slate-900">
                {/* Global Activity Bar */}
                <GlobalNav />

                {/* Main App Container */}
                <div className="flex-1 flex min-w-0 h-full relative bg-white overflow-hidden">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
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

                {/* <TanStackRouterDevtools /> */}
            </div>
        </OS.Root>
    );
}
