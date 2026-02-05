/**
 * FocusScope - Focus Trap & Restoration
 * 
 * 모달, 다이얼로그 등에서 포커스를 가두거나 복원하는 기능
 */

import { useRef, useLayoutEffect, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FocusScopeProps {
    /** Children */
    children: ReactNode;

    /** Focus trap 활성화 */
    trapped?: boolean;

    /** 마운트 시 포커스 복원 대상 저장 */
    restoreFocus?: boolean;

    /** 마운트 시 자동 포커스 */
    autoFocus?: boolean;

    /** Container class */
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Utils
// ═══════════════════════════════════════════════════════════════════

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[data-focusable]',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function FocusScope({
    children,
    trapped = false,
    restoreFocus = true,
    autoFocus = true,
    className,
}: FocusScopeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // --- Store previously focused element ---
    useLayoutEffect(() => {
        if (restoreFocus) {
            previouslyFocusedRef.current = document.activeElement as HTMLElement;
        }

        return () => {
            if (restoreFocus && previouslyFocusedRef.current) {
                previouslyFocusedRef.current.focus();
            }
        };
    }, [restoreFocus]);

    // --- Auto focus on mount ---
    useEffect(() => {
        if (autoFocus && containerRef.current) {
            const focusables = getFocusableElements(containerRef.current);
            if (focusables.length > 0) {
                focusables[0].focus();
            } else {
                containerRef.current.focus();
            }
        }
    }, [autoFocus]);

    // --- Focus trap handler ---
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!trapped || event.key !== 'Tab') return;
        if (!containerRef.current) return;

        const focusables = getFocusableElements(containerRef.current);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement;

        if (event.shiftKey && current === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && current === last) {
            event.preventDefault();
            first.focus();
        }
    }, [trapped]);

    return (
        <div
            ref={containerRef}
            data-focus-scope
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={`outline-none ${className || ''}`}
        >
            {children}
        </div>
    );
}

FocusScope.displayName = 'FocusScope';
