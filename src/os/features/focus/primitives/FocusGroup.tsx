/**
 * FocusGroup - Focus Behavior Container Primitive
 * 
 * Focus/Selection/Activation 동작을 관리하는 컨테이너
 * Zone은 FocusGroup을 delegation하여 사용
 */

import { createContext, useContext, useMemo, useRef, useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { resolveRole, type ResolvedFocusGroup } from "@os/features/focus/registry/resolveRole.ts";
import type { NavigateConfig, TabConfig, SelectConfig, ActivateConfig, DismissConfig, ProjectConfig } from "@os/entities/FocusGroupProps.ts";
import { DOMInterface } from "@os/features/focus/registry/DOMInterface.ts";

// ═══════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════

interface FocusGroupContextValue {
    groupId: string;
    config: ResolvedFocusGroup;
}

const FocusGroupContext = createContext<FocusGroupContextValue | null>(null);

export function useFocusGroupContext() {
    return useContext(FocusGroupContext);
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FocusGroupProps {
    /** 그룹 ID (optional, auto-generated if not provided) */
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

    /** Children */
    children: ReactNode;

    /** Container className */
    className?: string;

    /** Container style */
    style?: React.CSSProperties;

    /** As child pattern - merge into single child */
    asChild?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

let groupIdCounter = 0;
function generateGroupId() {
    return `focus-group-${++groupIdCounter}`;
}

export function FocusGroup({
    id: propId,
    role,
    navigate,
    tab,
    select,
    activate,
    dismiss,
    project,
    children,
    className,
    style,
    // Note: asChild is accepted but not currently implemented
}: Omit<FocusGroupProps, 'asChild'> & { asChild?: boolean }) {
    const groupId = useMemo(() => propId || generateGroupId(), [propId]);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Resolve Configuration ---
    const config = useMemo(() => {
        return resolveRole(role, {
            navigate,
            tab,
            select,
            activate,
            dismiss,
            project,
        });
    }, [role, navigate, tab, select, activate, dismiss, project]);

    // --- DOM Registry ---
    useLayoutEffect(() => {
        if (containerRef.current) {
            DOMInterface.registerZone(groupId, containerRef.current);
        }
        return () => DOMInterface.unregisterZone(groupId);
    }, [groupId]);

    // --- Context Value ---
    const contextValue = useMemo<FocusGroupContextValue>(() => ({
        groupId,
        config,
    }), [groupId, config]);

    // --- Orientation Class ---
    const orientationClass = config.navigate.orientation === 'horizontal'
        ? 'flex-row'
        : config.navigate.orientation === 'both'
            ? 'flex-row flex-wrap'
            : 'flex-col';

    // --- Render ---
    return (
        <FocusGroupContext.Provider value={contextValue}>
            <div
                ref={containerRef}
                id={groupId}
                data-focus-group={groupId}
                data-orientation={config.navigate.orientation}
                data-selection-mode={config.select.mode}
                role={role || "group"}
                aria-orientation={
                    config.navigate.orientation === 'horizontal' ? 'horizontal' :
                        config.navigate.orientation === 'vertical' ? 'vertical' : undefined
                }
                aria-multiselectable={config.select.mode === 'multiple' || undefined}
                tabIndex={-1}
                className={`outline-none flex ${orientationClass} ${className || ''}`}
                style={style}
            >
                {children}
            </div>
        </FocusGroupContext.Provider>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Compound Components (optional)
// ═══════════════════════════════════════════════════════════════════

FocusGroup.displayName = 'FocusGroup';
