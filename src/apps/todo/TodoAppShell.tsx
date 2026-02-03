import type { ReactNode } from "react";
import { useTodoEngine } from "@apps/todo/lib/todoEngine";
import { AntigravityOS } from "@os/core/AntigravityOS";
import { ClipboardManager } from "@apps/todo/features/clipboard/ClipboardManager";
import { setGlobalEngine } from "@os/core/command/CommandContext";
import { Zone } from "@os/ui/Zone";
import { CommandInspector } from "@os/debug/Inspector";

interface TodoAppShellProps {
    children: ReactNode;
}

/**
 * The unified runtime shell for the Todo Application.
 * Boots the Engine, mounts the OS Input Layer, and handles global telemetry.
 */
export function TodoAppShell({ children }: TodoAppShellProps) {
    // 1. Boot Engine (Hook-based Singleton)
    const engineValue = useTodoEngine();

    // 2. Set global engine for Provider-less usage (Zustand-powered)
    setGlobalEngine(() => engineValue);

    const isInspectorOpen = engineValue.state?.ui?.isInspectorOpen;

    return (
        <AntigravityOS engine={engineValue}>
            <div className="h-screen w-screen bg-[#0a0a0a] flex overflow-hidden font-sans text-slate-900 select-none">
                {/* Main App Container */}
                <div className="flex-1 flex min-w-0 h-full relative bg-white overflow-hidden">
                    <Zone id="main" area="main" layout="row">
                        <ClipboardManager />
                        {children}
                    </Zone>
                </div>

                {/* Inspector (Separated from OS Core) */}
                {isInspectorOpen && (
                    <aside className="h-full w-[600px] flex-shrink-0 overflow-hidden border-l border-white/10 shadow-2xl">
                        <CommandInspector />
                    </aside>
                )}
            </div>
        </AntigravityOS>
    );
}


