import { useEffect, useRef } from 'react';
import { evalContext } from '../context';
import { getCanonicalKey, normalizeKeyDefinition } from '../keybinding';
import type { ReactNode } from 'react';
import { FocusContext, useCommandEngine } from './CommandContext';
import type { BaseCommand } from './types';
import { useFocusStore } from '../../stores/useFocusStore';
import { focusRegistry } from '../logic/focusStrategies';

export interface ZoneNeighbors {
    up?: string;
    down?: string;
    left?: string;
    right?: string;
}

export interface ZoneProps {
    id: string;
    children: ReactNode;
    dispatch?: (cmd: BaseCommand) => void;
    currentFocusId?: string | null;
    defaultFocusId?: string;
    registry?: any;
    /** Area semantic for Jurisdiction */
    area?: string;
    /** Manual override for active state */
    active?: boolean;

    /** Focus Topology: Neighbors */
    neighbors?: ZoneNeighbors;
    /** Focus Layout: Internal Navigation Strategy */
    layout?: 'column' | 'row' | 'grid';
}

export function Zone({ id, children, dispatch: customDispatch, currentFocusId: customFocusId, defaultFocusId, registry: customRegistry, area, active, neighbors, layout = 'column' }: ZoneProps) {
    const { dispatch: contextDispatch, currentFocusId: contextFocusId, registry: contextRegistry, ctx } = useCommandEngine();
    const dispatch = customDispatch || contextDispatch;
    const currentFocusId = customFocusId !== undefined ? customFocusId : contextFocusId;
    const registry = customRegistry || contextRegistry;

    // --- Focus Store Integration (Jurisdictional Focus) ---
    const activeZoneId = useFocusStore((s) => s.activeZoneId);
    const registerZone = useFocusStore((s) => s.registerZone);
    const unregisterZone = useFocusStore((s) => s.unregisterZone);
    const setActiveZone = useFocusStore((s) => s.setActiveZone);

    // Register this zone with the window manager
    useEffect(() => {
        registerZone({ id, area, defaultFocusId });
        return () => unregisterZone(id);
    }, [id, area, defaultFocusId, registerZone, unregisterZone]);

    // Active state is now derived from the global store (unless manually overridden)
    const isStoreActive = activeZoneId === id;
    const isActive = active !== undefined ? active : isStoreActive;

    // Fix: Use ref to prevent stale closure in event listener without thrashing dependencies
    const ctxRef = useRef(ctx);
    useEffect(() => { ctxRef.current = ctx; }, [ctx]);

    // --- Dynamic Keybinding Lifecycle ---
    // Keys are only active if THIS zone is active
    useEffect(() => {
        if (isActive && registry && typeof registry.getKeybindings === 'function') {
            const bindings = registry.getKeybindings();
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.defaultPrevented) return; // Respect handled events

                // --- Input Trap Logic & Extrinsic State ---
                const activeEl = document.activeElement as HTMLElement;
                const isInputActive = activeEl && (
                    activeEl.tagName === 'INPUT' ||
                    activeEl.tagName === 'TEXTAREA' ||
                    activeEl.isContentEditable
                );

                const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
                const isAtStart = isInput ? (activeEl as HTMLInputElement).selectionStart === 0 && (activeEl as HTMLInputElement).selectionEnd === 0 : false;

                // Inject extrinsic state into context
                const runtimeCtx = { ...ctxRef.current, cursorAtStart: isAtStart };

                const canonicalEventKey = getCanonicalKey(e);

                const matches = bindings.filter((b: { key: string }) => {
                    const normalizedDef = normalizeKeyDefinition(b.key);
                    return normalizedDef === canonicalEventKey;
                });

                if (matches.length > 0) {
                    // Find the first ENABLED command for this key
                    const activeMatch = matches.find((match: any) => {
                        const isEnabled = match.when ? evalContext(match.when, runtimeCtx) : true;

                        // Validated Input Gate for this specific match
                        if (isEnabled && isInputActive && !match.allowInInput) {
                            return false;
                        }

                        return isEnabled;
                    });

                    if (activeMatch) {
                        e.preventDefault();
                        dispatch({ type: activeMatch.command, payload: activeMatch.args });
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isActive, registry, dispatch]);

    // --- Declarative Spatial Navigation ---
    useEffect(() => {
        if (!isActive || !neighbors) return;

        const handleSpatialNav = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;

            // Should input stop navigation?
            const activeEl = document.activeElement as HTMLElement;
            const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            // If editing text, we generally don't want to jump zones unless at boundary (advanced)
            // For MVP, we aggressively block if input is active to be safe
            if (isInput) return;

            let targetZoneId: string | undefined;

            switch (e.key) {
                case 'ArrowUp':
                    if (layout === 'column' || layout === 'grid') return; // Internal for Column
                    targetZoneId = neighbors.up;
                    break;
                case 'ArrowDown':
                    if (layout === 'column' || layout === 'grid') return; // Internal for Column
                    targetZoneId = neighbors.down;
                    break;
                case 'ArrowLeft':
                    if (layout === 'row' || layout === 'grid') return; // Internal for Row
                    targetZoneId = neighbors.left;
                    break;
                case 'ArrowRight':
                    if (layout === 'row' || layout === 'grid') return; // Internal for Row
                    targetZoneId = neighbors.right;
                    break;
            }

            if (targetZoneId) {
                e.preventDefault();

                // --- Headless Focus Controller Pattern ---
                // 1. Activate Zone Jurisdiction (OS Layer)
                setActiveZone(targetZoneId);

                // 2. Resolve Content Focus (App Layer Delegate)
                // We use the central registry to find the ENTRY STRATEGY for this zone.
                // This decouples Zone from knowing about "todos" or "categories".
                const { state, ctx } = useCommandEngine(); // Now returns state too
                if (state && ctx) {
                    const targetFocusId = focusRegistry.resolve(targetZoneId, state as any, ctx);

                    if (targetFocusId) {
                        // OS-Level Focus Dispatch
                        useFocusStore.getState().setFocus(targetFocusId);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleSpatialNav);
        return () => window.removeEventListener('keydown', handleSpatialNav);
    }, [isActive, neighbors, layout, setActiveZone, dispatch]);

    const handleFocus = (e: React.FocusEvent) => {
        // 1. Claim Jurisdiction
        if (!isActive) {
            setActiveZone(id);
        }

        // 2. Default Internal Focus
        // Only if we focused the Zone container itself (not a child)
        if (e.target === e.currentTarget && defaultFocusId) {
            useFocusStore.getState().setFocus(defaultFocusId);
        }
    };

    const handleClick = () => {
        // 1. Claim Jurisdiction
        if (!isActive) {
            setActiveZone(id);

            // 2. Restore Focus if needed
            if (defaultFocusId) {
                useFocusStore.getState().setFocus(defaultFocusId);
            }
        }
    };

    return (
        <FocusContext.Provider value={{ zoneId: id, isActive }}>
            <div
                data-zone-id={id}
                data-area={area}
                data-active={isActive}
                onFocus={handleFocus}
                onClick={handleClick}
                onFocusCapture={() => {
                    // Aggressive capture for reliable "Click anywhere to activate"
                    if (!isActive) setActiveZone(id);
                }}
                tabIndex={-1}
                className="outline-none transition-all duration-700 h-full flex flex-col data-[active=false]:grayscale data-[active=false]:opacity-30 data-[active=false]:scale-[0.98] data-[active=false]:blur-[0.5px] data-[active=true]:grayscale-0 data-[active=true]:opacity-100 data-[active=true]:scale-100"
                style={{ flex: id === 'sidebar' ? 'none' : '1' }}
            >
                {children}
            </div>
        </FocusContext.Provider>
    );
}
