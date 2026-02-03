import type { ReactNode } from "react";
import { useEffect } from "react";
import { InputEngine } from "@os/core/input/InputEngine";

interface AntigravityOSProps {
    engine: any;
    children: ReactNode;
}

/**
 * [OS Core] AntigravityOS
 * 
 * The true Operating System layer.
 * Now deconstructed to be headless.
 * It absorbs system-level side effects only.
 */
export function AntigravityOS({ engine, children }: AntigravityOSProps) {
    // OS-Level Side Effect: Persist Inspector State
    const isInspectorOpen = engine.state?.ui?.isInspectorOpen;
    useEffect(() => {
        if (isInspectorOpen !== undefined) {
            localStorage.setItem("antigravity_inspector_open", JSON.stringify(isInspectorOpen));
        }
    }, [isInspectorOpen]);

    return (
        <>
            <InputEngine />
            {children}
        </>
    );
}

