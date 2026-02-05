/**
 * Attributes - DOM data-* Attribute Updates
 * 
 * Focus/Selection 상태를 DOM 속성으로 반영
 * CSS 선택자나 접근성 도구에서 활용
 */

import { DOMInterface } from '@os/features/focus/registry/DOMInterface';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface AttributeUpdateOptions {
    focusVisible?: boolean;
    selectionVisible?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Attribute Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Focus 상태 속성 업데이트
 */
export function updateFocusAttribute(
    itemId: string,
    isFocused: boolean
): void {
    const element = DOMInterface.getItem(itemId);
    if (!element) return;

    if (isFocused) {
        element.setAttribute('data-focused', 'true');
    } else {
        element.removeAttribute('data-focused');
    }
}

/**
 * Selection 상태 속성 업데이트
 */
export function updateSelectionAttribute(
    itemId: string,
    isSelected: boolean
): void {
    const element = DOMInterface.getItem(itemId);
    if (!element) return;

    if (isSelected) {
        element.setAttribute('data-selected', 'true');
        element.setAttribute('aria-selected', 'true');
    } else {
        element.removeAttribute('data-selected');
        element.removeAttribute('aria-selected');
    }
}

/**
 * Focus Visible 상태 (키보드 포커스 링)
 */
export function updateFocusVisible(
    itemId: string,
    isVisible: boolean
): void {
    const element = DOMInterface.getItem(itemId);
    if (!element) return;

    if (isVisible) {
        element.setAttribute('data-focus-visible', 'true');
    } else {
        element.removeAttribute('data-focus-visible');
    }
}

/**
 * Anchor 상태 (Tab 복귀 대상)
 */
export function updateAnchorAttribute(
    itemId: string,
    isAnchor: boolean
): void {
    const element = DOMInterface.getItem(itemId);
    if (!element) return;

    if (isAnchor) {
        element.setAttribute('data-anchor', 'true');
    } else {
        element.removeAttribute('data-anchor');
    }
}

/**
 * 비활성 상태
 */
export function updateDisabledAttribute(
    itemId: string,
    isDisabled: boolean
): void {
    const element = DOMInterface.getItem(itemId);
    if (!element) return;

    if (isDisabled) {
        element.setAttribute('data-disabled', 'true');
        element.setAttribute('aria-disabled', 'true');
    } else {
        element.removeAttribute('data-disabled');
        element.removeAttribute('aria-disabled');
    }
}

/**
 * 일괄 속성 업데이트
 */
export function batchUpdateAttributes(
    items: Array<{
        id: string;
        focused?: boolean;
        selected?: boolean;
        focusVisible?: boolean;
        anchor?: boolean;
        disabled?: boolean;
    }>
): void {
    for (const item of items) {
        if (item.focused !== undefined) {
            updateFocusAttribute(item.id, item.focused);
        }
        if (item.selected !== undefined) {
            updateSelectionAttribute(item.id, item.selected);
        }
        if (item.focusVisible !== undefined) {
            updateFocusVisible(item.id, item.focusVisible);
        }
        if (item.anchor !== undefined) {
            updateAnchorAttribute(item.id, item.anchor);
        }
        if (item.disabled !== undefined) {
            updateDisabledAttribute(item.id, item.disabled);
        }
    }
}

/**
 * Zone 속성 업데이트
 */
export function updateZoneAttributes(
    zoneId: string,
    attributes: {
        active?: boolean;
        orientation?: 'horizontal' | 'vertical' | 'both';
        selectionMode?: 'none' | 'single' | 'multiple';
    }
): void {
    const element = DOMInterface.getZone(zoneId);
    if (!element) return;

    if (attributes.active !== undefined) {
        if (attributes.active) {
            element.setAttribute('data-active-zone', 'true');
        } else {
            element.removeAttribute('data-active-zone');
        }
    }

    if (attributes.orientation) {
        element.setAttribute('data-orientation', attributes.orientation);
        element.setAttribute('aria-orientation',
            attributes.orientation === 'both' ? 'horizontal' : attributes.orientation
        );
    }

    if (attributes.selectionMode) {
        element.setAttribute('data-selection-mode', attributes.selectionMode);
        element.setAttribute('aria-multiselectable',
            String(attributes.selectionMode === 'multiple')
        );
    }
}
