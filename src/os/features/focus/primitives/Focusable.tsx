/**
 * Focusable - 저수준 Focus 등록 Primitive
 * 
 * 가장 기본적인 focus 등록만 담당
 * Item, Trigger, Field는 Focusable을 합성하여 구현
 */

import { useRef, useContext, useLayoutEffect, cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { useFocusStore } from "@os/features/focus/store/focusStore.ts";
import { FocusContext } from "@os/features/command/ui/CommandContext.tsx";
import { DOMInterface } from "@os/features/focus/registry/DOMInterface.ts";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface FocusableState {
    isFocused: boolean;
    isAnchor: boolean;
}

export interface FocusableProps {
    /** 고유 ID */
    id: string;

    /** 비활성 상태 */
    disabled?: boolean;

    /** 자식 요소 or render prop */
    children: ReactNode | ((state: FocusableState) => ReactNode);

    /** asChild 패턴 (Radix-style) */
    asChild?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function Focusable({
    id,
    disabled = false,
    children,
    asChild = false,
}: FocusableProps) {
    const elementRef = useRef<HTMLDivElement>(null);

    // --- Store ---
    const focusedItemId = useFocusStore((s) => s.focusedItemId);
    const addItem = useFocusStore((s) => s.addItem);
    const removeItem = useFocusStore((s) => s.removeItem);
    const zoneRegistry = useFocusStore((s) => s.zoneRegistry);
    const focusPath = useFocusStore((s) => s.focusPath);

    const isFocused = focusedItemId === id && !disabled;

    // --- Context ---
    const focusContext = useContext(FocusContext);
    const zoneId = focusContext?.zoneId || "unknown";

    // --- DOM Registry ---
    useLayoutEffect(() => {
        if (elementRef.current && !disabled) {
            DOMInterface.registerItem(id, elementRef.current);
        }
        return () => DOMInterface.unregisterItem(id);
    }, [id, disabled]);

    // --- Zone Registration ---
    useLayoutEffect(() => {
        if (zoneId && zoneId !== "unknown" && !disabled) {
            addItem(zoneId, id);
            return () => removeItem(zoneId, id);
        }
    }, [zoneId, id, disabled, addItem, removeItem]);

    // --- Anchor Calculation ---
    const isAnchor = (() => {
        if (disabled || isFocused) return false;
        if (!zoneId || zoneId === "unknown") return false;

        const zone = zoneRegistry[zoneId];
        if (!zone?.lastFocusedId) return false;

        const isLastFocused = zone.lastFocusedId === id;
        const isZoneInactive = !focusPath.includes(zoneId);

        return isLastFocused && isZoneInactive;
    })();

    // --- State for render props ---
    const state: FocusableState = { isFocused, isAnchor };

    // --- Base Props ---
    const baseProps = {
        ref: elementRef,
        id,
        "data-item-id": id,
        "data-focused": isFocused ? "true" : undefined,
        "data-anchor": isAnchor ? "true" : undefined,
        "data-disabled": disabled ? "true" : undefined,
        tabIndex: disabled ? -1 : (isFocused ? 0 : -1),
        "aria-disabled": disabled || undefined,
    };

    // --- Render Props ---
    if (typeof children === "function") {
        const rendered = children(state);
        if (isValidElement(rendered)) {
            return cloneElement(rendered as ReactElement<any>, baseProps);
        }
        return <>{rendered}</>;
    }

    // --- asChild ---
    if (asChild && isValidElement(children)) {
        return cloneElement(children as ReactElement<any>, baseProps);
    }

    // --- Wrapper ---
    return (
        <div {...baseProps} className="outline-none">
            {children}
        </div>
    );
}
