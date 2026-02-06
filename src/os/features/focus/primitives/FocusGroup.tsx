/**
 * FocusGroup - Scoped Focus Container Primitive
 * 
 * Focus/Selection/Activation container with isolated store.
 * Each FocusGroup manages its own state independently.
 */

import {
    createContext,
    useContext,
    useLayoutEffect,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
    type ComponentProps,
} from 'react';
import { useStore } from 'zustand';
import {
    createFocusGroupStore,
    type FocusGroupStore,
} from '../store/focusGroupStore';
import { resolveRole } from '../registry/roleRegistry';
import { DOMRegistry } from '../registry/DOMRegistry';
import { FocusRegistry } from '../registry/FocusRegistry';
import { updateRecovery } from '../pipeline/3-update/updateRecovery';
import { commitAll } from '../pipeline/4-commit/commitFocus';
import type {
    FocusGroupConfig,
    NavigateConfig,
    TabConfig,
    SelectConfig,
    ActivateConfig,
    DismissConfig,
    ProjectConfig,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════

interface FocusGroupContextValue {
    groupId: string;
    /** @deprecated Use groupId */
    zoneId: string;
    store: FocusGroupStore;
    config: FocusGroupConfig;
}

const FocusGroupContext = createContext<FocusGroupContextValue | null>(null);

export function useFocusGroupContext() {
    return useContext(FocusGroupContext);
}

export function useFocusGroupStore() {
    const ctx = useContext(FocusGroupContext);
    if (!ctx) {
        throw new Error('useFocusGroupStore must be used within a FocusGroup');
    }
    return ctx.store;
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FocusGroupProps extends Omit<ComponentProps<'div'>, 'id' | 'role' | 'style' | 'className' | 'onSelect'> {
    /** Group ID (optional, auto-generated if not provided) */
    id?: string;

    /** Area identifier for scoped commands (deprecated - use id) */
    area?: string;

    /** ARIA role preset */
    role?: string;

    /** Navigate configuration */
    navigate?: Partial<NavigateConfig>;

    /** Tab configuration */
    tab?: Partial<TabConfig>;

    /** Select configuration */
    select?: Partial<SelectConfig>;

    /** Activate configuration */
    activate?: Partial<ActivateConfig>;

    /** Dismiss configuration */
    dismiss?: Partial<DismissConfig>;

    /** Project configuration */
    project?: Partial<ProjectConfig>;

    /** Activation callback */
    onActivate?: (itemId: string) => void;

    /** Children */
    children: ReactNode;

    /** Container className */
    className?: string;

    /** Container style */
    style?: React.CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════
// ID Generator
// ═══════════════════════════════════════════════════════════════════

let groupIdCounter = 0;
function generateGroupId() {
    return `focus-group-${++groupIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function FocusGroup({
    id: propId,
    role,
    navigate,
    tab,
    select,
    activate,
    dismiss,
    project,
    onActivate,
    children,
    className,
    style,
    ...rest
}: FocusGroupProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Stable ID ---
    const groupId = useMemo(() => propId || generateGroupId(), [propId]);

    // --- Scoped Store (Created once per group) ---
    const store = useMemo(() => createFocusGroupStore(groupId), [groupId]);

    // --- Resolve Configuration ---
    const config = useMemo(() => {
        return resolveRole(role, { navigate, tab, select, activate, dismiss, project });
    }, [role, navigate, tab, select, activate, dismiss, project]);

    // --- Parent Context ---
    const parentContext = useContext(FocusGroupContext);
    const parentId = parentContext?.groupId || null;

    // --- DOM Registry & Global Store Registry ---
    useLayoutEffect(() => {
        if (containerRef.current) {
            DOMRegistry.registerGroup(groupId, containerRef.current);
            // Register with Global Registry for OS Commands (include config)
            FocusRegistry.register(groupId, store, parentId, config, onActivate);
        }
        return () => {
            DOMRegistry.unregisterGroup(groupId);
            FocusRegistry.unregister(groupId);
        };
    }, [groupId, store, parentId, config]);

    // --- Focus Recovery (OS-level) ---
    // When an item is removed from the zone, check if it was focused.
    // If so, automatically move focus to the next/prev item based on config.
    const items = useStore(store, (s) => s.items);
    const focusedItemId = useStore(store, (s) => s.focusedItemId);
    const prevItemsRef = useRef<string[]>([]);

    useEffect(() => {
        const prevItems = prevItemsRef.current;

        // Find removed items
        const removedItems = prevItems.filter(id => !items.includes(id));

        if (removedItems.length > 0 && focusedItemId && removedItems.includes(focusedItemId)) {
            // The focused item was removed - trigger recovery
            const result = updateRecovery(
                focusedItemId,
                focusedItemId,
                prevItems,
                config.navigate.recovery
            );

            if (result.changed) {
                commitAll(store, { targetId: result.targetId });
            }
        }

        prevItemsRef.current = items;
    }, [items, focusedItemId, store, config.navigate.recovery]);

    // --- Context Value ---
    const contextValue = useMemo<FocusGroupContextValue>(() => ({
        groupId,
        zoneId: groupId,
        store,
        config,
    }), [groupId, store, config]);

    // --- Orientation Class ---
    const orientationClass = config.navigate.orientation === 'horizontal'
        ? 'flex flex-row'
        : config.navigate.orientation === 'both'
            ? 'flex flex-row flex-wrap'
            : 'flex flex-col';

    // --- Render ---
    return (
        <FocusGroupContext.Provider value={contextValue}>
            <div
                ref={containerRef}
                id={groupId}
                data-focus-group={groupId}
                aria-orientation={
                    config.navigate.orientation === 'horizontal' ? 'horizontal' :
                        config.navigate.orientation === 'vertical' ? 'vertical' : undefined
                }
                aria-multiselectable={config.select.mode === 'multiple' || undefined}
                role={role || 'group'}
                tabIndex={-1}
                className={`outline-none ${orientationClass} ${className || ''}`}
                style={style}
                {...rest}
            >
                {children}
            </div>
        </FocusGroupContext.Provider>
    );
}

FocusGroup.displayName = 'FocusGroup';

