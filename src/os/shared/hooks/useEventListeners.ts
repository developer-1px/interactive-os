/**
 * useEventListeners - Generic Event Listener Registration Hook
 * 
 * Centralizes addEventListener/removeEventListener boilerplate.
 * Supports window, document, and custom targets with capture option.
 */

import { useEffect } from 'react';

export type EventListenerConfig = {
    target: 'window' | 'document' | EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
};

/**
 * Register multiple event listeners and automatically cleanup on unmount.
 * 
 * @param listeners - Array of event listener configurations
 * @param enabled - Whether to register listeners (for conditional registration)
 */
export function useEventListeners(
    listeners: EventListenerConfig[],
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;

        // Resolve targets and register listeners
        const registrations = listeners.map(({ target, event, handler, options }) => {
            const resolvedTarget =
                target === 'window' ? window :
                    target === 'document' ? document :
                        target;

            resolvedTarget.addEventListener(event, handler, options);

            return { target: resolvedTarget, event, handler, options };
        });

        // Cleanup: remove all listeners
        return () => {
            registrations.forEach(({ target, event, handler, options }) => {
                target.removeEventListener(event, handler, options);
            });
        };
    }, [enabled, listeners]);
}

/**
 * Singleton-aware event listener hook.
 * Only the first caller registers listeners; subsequent calls are no-ops.
 */
export function useSingletonEventListeners(
    key: string,
    listeners: EventListenerConfig[],
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;
        if (singletonRegistry.has(key)) return;

        singletonRegistry.add(key);

        const registrations = listeners.map(({ target, event, handler, options }) => {
            const resolvedTarget =
                target === 'window' ? window :
                    target === 'document' ? document :
                        target;

            resolvedTarget.addEventListener(event, handler, options);

            return { target: resolvedTarget, event, handler, options };
        });

        return () => {
            singletonRegistry.delete(key);
            registrations.forEach(({ target, event, handler, options }) => {
                target.removeEventListener(event, handler, options);
            });
        };
    }, [key, enabled, listeners]);
}

// Registry for singleton listeners
const singletonRegistry = new Set<string>();
