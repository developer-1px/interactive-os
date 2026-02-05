/**
 * FocusZone - Scoped Focus Container Primitive
 * 
 * Focus/Selection/Activation container with isolated store.
 * Each FocusZone manages its own state independently.
 */

import {
    createContext,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    type ReactNode,
    type ComponentProps,
} from 'react';
import {
    createFocusZoneStore,
    type FocusZoneStore,
} from '../store/focusZoneStore';
import { resolveRole } from '../registry/roleRegistry';
import { DOMInterface } from '../registry/DOMInterface';
import { GlobalZoneRegistry } from '../registry/GlobalZoneRegistry';
import type {
    FocusZoneConfig,
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

interface FocusZoneContextValue {
    zoneId: string;
    store: FocusZoneStore;
    config: FocusZoneConfig;
}

const FocusZoneContext = createContext<FocusZoneContextValue | null>(null);

export function useFocusZoneContext() {
    return useContext(FocusZoneContext);
}

export function useFocusZoneStore() {
    const ctx = useContext(FocusZoneContext);
    if (!ctx) {
        throw new Error('useFocusZoneStore must be used within a FocusZone');
    }
    return ctx.store;
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FocusZoneProps extends Omit<ComponentProps<'div'>, 'id' | 'role' | 'style' | 'className' | 'onSelect'> {
    /** Zone ID (optional, auto-generated if not provided) */
    id?: string;

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

let zoneIdCounter = 0;
function generateZoneId() {
    return `focus-zone-${++zoneIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function FocusZone({
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
}: FocusZoneProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Stable ID ---
    const zoneId = useMemo(() => propId || generateZoneId(), [propId]);

    // --- Scoped Store (Created once per zone) ---
    const store = useMemo(() => createFocusZoneStore(zoneId), [zoneId]);

    // --- Resolve Configuration ---
    const config = useMemo(() => {
        return resolveRole(role, { navigate, tab, select, activate, dismiss, project });
    }, [role, navigate, tab, select, activate, dismiss, project]);

    // --- Parent Context ---
    const parentContext = useContext(FocusZoneContext);
    const parentId = parentContext?.zoneId || null;

    // --- DOM Registry & Global Store Registry ---
    useLayoutEffect(() => {
        if (containerRef.current) {
            DOMInterface.registerZone(zoneId, containerRef.current);
            // Register with Global Registry for OS Commands (include config)
            GlobalZoneRegistry.register(zoneId, store, parentId, config, onActivate);
        }
        return () => {
            DOMInterface.unregisterZone(zoneId);
            GlobalZoneRegistry.unregister(zoneId);
        };
    }, [zoneId, store, parentId, config]);

    // --- Context Value ---
    const contextValue = useMemo<FocusZoneContextValue>(() => ({
        zoneId,
        store,
        config,
    }), [zoneId, store, config]);

    // --- Orientation Class ---
    const orientationClass = config.navigate.orientation === 'horizontal'
        ? 'flex flex-row'
        : config.navigate.orientation === 'both'
            ? 'flex flex-row flex-wrap'
            : 'flex flex-col';

    // --- Render ---
    return (
        <FocusZoneContext.Provider value={contextValue}>
            <div
                ref={containerRef}
                id={zoneId}
                data-focus-zone={zoneId}
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
        </FocusZoneContext.Provider>
    );
}

FocusZone.displayName = 'FocusZone';

