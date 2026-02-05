/**
 * Pipeline - Project Phase
 * 
 * DOM reflection - applies visual changes based on committed state
 */

import { DOMInterface } from '@os/features/focus/registry/DOMInterface';
import type { CommitResult } from '../4-commit';

// ═══════════════════════════════════════════════════════════════════
// Project Options
// ═══════════════════════════════════════════════════════════════════

export interface ProjectOptions {
    scrollIntoView?: boolean;
    focusVisible?: boolean;
    animateScroll?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Project Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Project state changes to DOM
 */
export function projectToDOM(
    result: CommitResult,
    options: ProjectOptions = {}
): void {
    const {
        scrollIntoView = true,
        focusVisible = true,
        animateScroll = true
    } = options;

    // --- Focus the target element ---
    if (result.focusedItemId) {
        const element = DOMInterface.getItem(result.focusedItemId);

        if (element) {
            // Set focus
            element.focus({ preventScroll: true });

            // Scroll into view
            if (scrollIntoView) {
                element.scrollIntoView({
                    behavior: animateScroll ? 'smooth' : 'auto',
                    block: 'nearest',
                    inline: 'nearest',
                });
            }

            // Toggle focus-visible attribute
            if (focusVisible) {
                element.setAttribute('data-focus-visible', 'true');
            }
        }
    }

    // --- Update selection visual state ---
    // This is typically handled by React re-render,
    // but we can force update data attributes here if needed
}

/**
 * Remove focus visible indicator
 * Called on pointer events to hide keyboard focus ring
 */
export function clearFocusVisible(): void {
    const focused = document.querySelector('[data-focus-visible="true"]');
    if (focused) {
        focused.removeAttribute('data-focus-visible');
    }
}

/**
 * Scroll zone into view if needed
 */
export function scrollZoneIntoView(zoneId: string): void {
    const element = DOMInterface.getZone(zoneId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }
}
