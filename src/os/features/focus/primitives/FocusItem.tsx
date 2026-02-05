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
    useLayoutEffect,
    forwardRef,
    type ReactNode,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useFocusGroupContext } from './FocusGroup';
import { useFocusRegistry } from '../registry/FocusRegistry';
import { DOMRegistry } from '../registry/DOMRegistry';

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

    /** Custom element type */
    as?: 'div' | 'li' | 'button' | 'a';

    /** ARIA role override */
    role?: string;
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
    role,
}, ref) {
    const itemRef = useRef<HTMLElement>(null);
    const ctx = useFocusGroupContext();

    if (!ctx) {
        throw new Error('FocusItem must be used within a FocusGroup');
    }

    const { zoneId, store } = ctx;

    // --- Registration ---
    useLayoutEffect(() => {
        const el = itemRef.current;
        if (el) {
            // Register item to both registries
            DOMRegistry.registerItem(id, zoneId, el);
            store.getState().addItem(id);
        }

        return () => {
            // Cleanup
            DOMRegistry.unregisterItem(id);
            store.getState().removeItem(id);
        };
    }, [id, zoneId, store]);

    // --- Reactive State Subscription ---
    const activeZoneId = useFocusRegistry((s) => s.activeZoneId);
    const isZoneActive = activeZoneId === zoneId;

    const { isFocused, isSelected } = useStore(
        store,
        useShallow((state) => ({
            isFocused: state.focusedItemId === id,
            isSelected: state.selection.includes(id),
        }))
    );

    const visualFocused = isFocused && isZoneActive;
    const isAnchor = isFocused && !isZoneActive;

    // --- Render ---
    return (
        <Element
            ref={(node: HTMLElement | null) => {
                (itemRef as any).current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) (ref as any).current = node;
            }}
            id={id}
            data-anchor={isAnchor ? 'true' : undefined}
            role={role || 'option'}
            aria-current={visualFocused ? 'true' : undefined}
            aria-selected={isSelected || undefined}
            aria-disabled={disabled || undefined}
            tabIndex={visualFocused ? 0 : -1}
            className={`
                outline-none cursor-pointer
                focus:outline-none 
                focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-white
                dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-900
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className || ''}
            `}
            style={style}
        >
            {children}
        </Element>
    );
});

FocusItem.displayName = 'FocusItem';
