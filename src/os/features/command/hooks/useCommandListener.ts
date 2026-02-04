import { useEffect, useRef, useLayoutEffect } from "react";
import { useCommandEventBus } from "@os/features/command/lib/commandEventBus";
import type { BaseCommand } from "@os/entities/BaseCommand";

type CommandListener = {
    /** Command type to listen for */
    command: string;
    /** Handler called when command is dispatched */
    handler: (payload: unknown) => void;
    /** Optional: Only respond if this condition is true */
    when?: () => boolean;
};

/**
 * useCommandListener:
 * 
 * Subscribe to OS command stream at the component level.
 * Useful for components that need to react to commands but don't
 * have state in the global store (e.g., Field's isEditing).
 * 
 * @example
 * useCommandListener([
 *   { command: "OS_FIELD_START_EDIT", handler: () => setIsEditing(true), when: () => isFocused }
 * ]);
 */
export function useCommandListener(listeners: CommandListener[]) {
    // Select stable references to avoid re-renders
    const addListener = useCommandEventBus((s) => s.addListener);
    const removeListener = useCommandEventBus((s) => s.removeListener);

    // Stable ref for listeners to avoid effect re-execution on listener array recreation
    const listenersRef = useRef(listeners);

    useLayoutEffect(() => {
        listenersRef.current = listeners;
    }, [listeners]);

    useEffect(() => {
        const handler = (cmd: BaseCommand) => {
            for (const listener of listenersRef.current) {
                if (cmd.type === listener.command) {
                    // Check 'when' condition if provided
                    if (!listener.when || listener.when()) {
                        listener.handler(cmd.payload);
                    }
                }
            }
        };

        addListener(handler);
        return () => removeListener(handler);
    }, [addListener, removeListener]);
}
