/**
 * OS.Root - Global OS Infrastructure Shell
 * 
 * Mounts global singletons (KeyboardSensor, FocusSensor, FocusIntent, FocusSync)
 * exactly once. All App components register their commands to extend
 * the global registry without owning infrastructure.
 */

import React from "react";
import { KeyboardSensor, KeyboardIntent } from "@os/features/keyboard";
import { FocusIntent } from "@os/features/focus/pipeline/2-intent/FocusIntent";
import { FocusSensor } from "@os/features/focus/pipeline/1-sense/FocusSensor";
import { FocusSync } from "@os/features/focus/pipeline/5-sync/FocusSync";
import { useOSCore } from "./useOSCore";

export interface RootProps {
    children: React.ReactNode;
}

/**
 * OS.Root - Must wrap all OS.App components.
 * Initializes global infrastructure and OS-level commands.
 */
export function Root({ children }: RootProps) {
    // Initialize OS Core (registers OS commands to global registry)
    useOSCore();

    return (
        <>
            {/* Global Infrastructure (Singletons) */}
            <KeyboardSensor />
            <KeyboardIntent />

            <FocusSensor />
            <FocusIntent />
            <FocusSync />

            {/* Child Apps */}
            {children}
        </>
    );
}

Root.displayName = 'OS.Root';

