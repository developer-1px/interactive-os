/**
 * Headless Types — shared across compute and simulate modules.
 */

import type { AppState } from "@os/kernel";

// ═══════════════════════════════════════════════════════════════════
// HeadlessKernel
// ═══════════════════════════════════════════════════════════════════

/** Minimal kernel interface needed by headless functions */
export interface HeadlessKernel {
    getState(): AppState;
    dispatch(cmd: any, opts?: any): void;
}

// ═══════════════════════════════════════════════════════════════════
// Item Types
// ═══════════════════════════════════════════════════════════════════

export interface ItemAttrs {
    id: string;
    role: string | undefined;
    tabIndex: number;
    "aria-selected"?: boolean | undefined;
    "aria-checked"?: boolean | undefined;
    "aria-expanded"?: boolean;
    "aria-disabled"?: boolean;
    "aria-current"?: "true" | undefined;
    "data-focused"?: true | undefined;
    "data-anchor"?: true | undefined;
    "data-selected"?: true | undefined;
    "data-expanded"?: true | undefined;
    "data-focus-item"?: true;
    "data-item-id"?: string;
    hidden?: boolean;
}

export interface ItemOverrides {
    disabled?: boolean | undefined;
    selected?: boolean | undefined;
    role?: string | undefined;
}

export interface ItemState {
    isFocused: boolean;
    isActiveFocused: boolean;
    isAnchor: boolean;
    isSelected: boolean;
    isExpanded: boolean;
}

export interface ItemResult {
    attrs: ItemAttrs;
    state: ItemState;
}

// ═══════════════════════════════════════════════════════════════════
// Element Types
// ═══════════════════════════════════════════════════════════════════

/**
 * Unified element attributes — works for both Zone containers and Items.
 * resolveElement() returns this type.
 */
export type ElementAttrs = Record<string, string | number | boolean | undefined>;

// ═══════════════════════════════════════════════════════════════════
// Observer Types
// ═══════════════════════════════════════════════════════════════════

export interface InteractionRecord {
    type: "press" | "click";
    label: string;
    stateBefore: unknown;
    stateAfter: unknown;
    timestamp: number;
}

export type InteractionObserver = (record: InteractionRecord) => void;
