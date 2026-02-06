/**
 * FocusItem - Pure Projection Focusable Item
 * 
 * Automatically registers with parent FocusGroup's store and DOM registry.
 * Uses reactive store subscription for performant UI updates.
 * 
 * NOTE: This is a PROJECTION-ONLY component.
 * - Does NOT handle events (click, keydown)
 * - Only reflects state (tabIndex, data-*, aria-*)
 * - Event handling is done by FocusSensor
 */

import {
    useRef,
    useCallback,
    useMemo,
    useSyncExternalStore,
    forwardRef,
    isValidElement,
    cloneElement,
    type ReactElement,
    type ReactNode,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useFocusGroupContext } from './FocusGroup';
import { FocusData } from '../lib/focusData';
import { twMerge } from 'tailwind-merge';

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FocusItemProps {
    /** Item ID (required) */
    id: string;

    /** Whether item is disabled */
    disabled?: boolean;

    /** Children */
    children: ReactNode;

    /** Container className */
    className?: string;

    /** Container style */
    style?: React.CSSProperties;

    /** Custom element type (ignored if asChild is true) */
    as?: 'div' | 'li' | 'button' | 'a' | 'span';

    /** Render as child (cloneElement) */
    asChild?: boolean;

    /** ARIA role override */
    role?: string;

    /** Additional props to pass through */
    [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════
// Utils
// ═══════════════════════════════════════════════════════════════════

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref !== null && ref !== undefined) {
        (ref as React.MutableRefObject<T>).current = value;
    }
}

function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
    return (node: T) => refs.forEach((ref) => setRef(ref, node));
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export const FocusItem = forwardRef<HTMLElement, FocusItemProps>(function FocusItem({
    id,
    disabled = false,
    children,
    className,
    style,
    as: Element = 'div',
    asChild = false,
    role,
    ...rest
}, ref) {
    const internalRef = useRef<HTMLElement>(null);
    const ctx = useFocusGroupContext();

    if (!ctx) {
        throw new Error('FocusItem must be used within a FocusGroup');
    }

    const { groupId, store } = ctx;

    // --- Registration (Callback Ref Pattern) ---
    // Store registration only (DOM access via getElementById)
    const registerCallback = useCallback((node: HTMLElement | null) => {
        internalRef.current = node;

        if (node) {
            store.getState().addItem(id);
        } else {
            store.getState().removeItem(id);
        }
    }, [id, store]);

    // --- Reactive State Subscription ---
    const activeGroupId = useSyncExternalStore(
        FocusData.subscribeActiveZone,
        () => FocusData.getActiveZoneId(),
        () => null
    );
    const isGroupActive = activeGroupId === groupId;

    const { isFocused, isSelected, isExpanded } = useStore(
        store,
        useShallow((state) => ({
            isFocused: state.focusedItemId === id,
            isSelected: state.selection.includes(id),
            isExpanded: state.expandedItems.includes(id),
        }))
    );

    const visualFocused = isFocused && isGroupActive;
    const isAnchor = isFocused && !isGroupActive;

    // --- Props Calculation ---
    // Allow tabIndex override from props (Field primitive needs tabIndex=0 for navigation)
    const { tabIndex: propTabIndex, ...otherRest } = rest as { tabIndex?: number;[key: string]: any };

    // Determine if this item supports expansion based on role
    const effectiveRole = role || 'option';
    const supportsExpansion = effectiveRole === 'treeitem' || effectiveRole === 'button';

    const computedProps = {
        id: id,
        role: effectiveRole,
        'data-item-id': id,
        'data-anchor': isAnchor ? 'true' : undefined,
        'data-focused': visualFocused ? 'true' : undefined,
        'data-selected': isSelected ? 'true' : undefined,
        'data-expanded': isExpanded ? 'true' : undefined,
        'aria-current': visualFocused ? 'true' : undefined,
        'aria-selected': isSelected || undefined,
        // Auto-project aria-expanded for expandable roles (treeitem, button)
        'aria-expanded': supportsExpansion ? isExpanded : undefined,
        'aria-disabled': disabled || undefined,
        // Use prop tabIndex if provided, otherwise use visualFocused logic
        tabIndex: propTabIndex !== undefined ? propTabIndex : (visualFocused ? 0 : -1),
        // Basic focus styles (can be overridden by className)
        className: twMerge(
            `outline-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
            className
        ),
        style,
        ...otherRest
    };

    // --- Ref Composition ---
    // 1. Identify child ref if needed
    const childElement = asChild && isValidElement(children) ? (children as ReactElement<any>) : null;
    const childRef = childElement ? (childElement as any).ref : null;

    // 2. Create stable composed ref
    const finalRef = useMemo(() => {
        if (childRef) {
            return composeRefs(registerCallback, ref, childRef);
        }
        return composeRefs(registerCallback, ref);
    }, [registerCallback, ref, childRef]);

    // --- Render Strategy: asChild ---
    if (childElement) {
        return cloneElement(childElement, {
            ...computedProps,
            ref: finalRef, // Stable Ref
            className: twMerge(childElement.props.className, computedProps.className),
            style: { ...childElement.props.style, ...style },
        });
    }

    // --- Render Strategy: Wrapper ---
    return (
        <Element
            ref={finalRef} // Stable Ref
            {...computedProps}
        >
            {children}
        </Element>
    );
});

FocusItem.displayName = 'FocusItem';
