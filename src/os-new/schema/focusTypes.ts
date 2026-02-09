/**
 * FocusGroup Core Types
 *
 * Zero-based reconstruction following FSD naming standards.
 * All types use proper naming conventions.
 */

// ═══════════════════════════════════════════════════════════════════
// Direction & Orientation
// ═══════════════════════════════════════════════════════════════════

export type Direction = "up" | "down" | "left" | "right" | "home" | "end";
export type TabDirection = "forward" | "backward";
export type Orientation = "horizontal" | "vertical" | "both" | "corner";

// ═══════════════════════════════════════════════════════════════════
// FocusIntent - Output of 2-parse phase
// ═══════════════════════════════════════════════════════════════════

export type FocusIntent =
    | { type: "NAVIGATE"; direction: Direction }
    | { type: "TAB"; direction: TabDirection }
    | {
        type: "SELECT";
        mode: "single" | "toggle" | "range" | "all" | "none";
        targetId?: string;
    }
    | {
        type: "ACTIVATE";
        targetId?: string;
        trigger: "enter" | "space" | "click" | "focus";
    }
    | { type: "DISMISS"; reason: "escape" | "outsideClick" }
    | { type: "FOCUS"; targetId: string; source?: "pointer" | "manual" | "auto" }
    | {
        type: "POINTER";
        subtype: "enter" | "leave" | "down" | "up";
        targetId: string;
    }
    | {
        type: "EXPAND";
        action: "toggle" | "expand" | "collapse";
        targetId?: string;
    };

// ═══════════════════════════════════════════════════════════════════
// FocusNode - DOM-aware item descriptor
// ═══════════════════════════════════════════════════════════════════

export interface FocusNode {
    id: string;
    element: HTMLElement;
    rect: DOMRect;
    disabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// PipelineContext - Immutable context passed through pipeline
// ═══════════════════════════════════════════════════════════════════

export interface PipelineContext {
    // Source
    readonly sourceId: string | null;
    readonly sourceGroupId: string | null;

    // Intent
    readonly intent: FocusIntent;

    // Resolution
    targetId: string | null;
    targetGroupId: string | null;

    // Spatial Memory
    stickyX: number | null;
    stickyY: number | null;

    // Flags
    shouldTrap: boolean;
    shouldProject: boolean;

    // Selection
    newSelection?: string[];
    newAnchor?: string | null;

    // Activation
    activated?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Configuration Types (Props)
// ═══════════════════════════════════════════════════════════════════

export interface NavigateConfig {
    orientation: Orientation;
    loop: boolean;
    seamless: boolean;
    typeahead: boolean;
    entry: "first" | "last" | "restore" | "selected";
    recovery: "next" | "prev" | "nearest";
}

export interface TabConfig {
    behavior: "trap" | "escape" | "flow";
    restoreFocus: boolean;
}

export interface SelectConfig {
    mode: "none" | "single" | "multiple";
    followFocus: boolean;
    disallowEmpty: boolean;
    range: boolean;
    toggle: boolean;
}

export interface ActivateConfig {
    mode: "manual" | "automatic";
}

export interface DismissConfig {
    escape: "close" | "deselect" | "none";
    outsideClick: "close" | "none";
}

export interface ProjectConfig {
    virtualFocus: boolean;
    autoFocus: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Resolved Configuration (Complete)
// ═══════════════════════════════════════════════════════════════════

export interface FocusGroupConfig {
    navigate: NavigateConfig;
    tab: TabConfig;
    select: SelectConfig;
    activate: ActivateConfig;
    dismiss: DismissConfig;
    project: ProjectConfig;
}

// ═══════════════════════════════════════════════════════════════════
// Defaults
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_NAVIGATE: NavigateConfig = {
    orientation: "vertical",
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first",
    recovery: "next",
};

export const DEFAULT_TAB: TabConfig = {
    behavior: "flow",
    restoreFocus: false,
};

export const DEFAULT_SELECT: SelectConfig = {
    mode: "none",
    followFocus: false,
    disallowEmpty: false,
    range: false,
    toggle: false,
};

export const DEFAULT_ACTIVATE: ActivateConfig = {
    mode: "manual",
};

export const DEFAULT_DISMISS: DismissConfig = {
    escape: "none",
    outsideClick: "none",
};

export const DEFAULT_PROJECT: ProjectConfig = {
    virtualFocus: false,
    autoFocus: false,
};

export const DEFAULT_CONFIG: FocusGroupConfig = {
    navigate: DEFAULT_NAVIGATE,
    tab: DEFAULT_TAB,
    select: DEFAULT_SELECT,
    activate: DEFAULT_ACTIVATE,
    dismiss: DEFAULT_DISMISS,
    project: DEFAULT_PROJECT,
};
