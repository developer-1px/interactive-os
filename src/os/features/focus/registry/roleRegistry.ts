/**
 * Role Registry - ARIA Role Presets
 * 
 * Defines behavior presets for common ARIA patterns.
 */

import type {
    FocusGroupConfig,
    NavigateConfig,
    TabConfig,
    SelectConfig,
    ActivateConfig,
    DismissConfig,
    ProjectConfig,
} from '../types';
import {
    DEFAULT_NAVIGATE,
    DEFAULT_TAB,
    DEFAULT_SELECT,
    DEFAULT_ACTIVATE,
    DEFAULT_DISMISS,
    DEFAULT_PROJECT,
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// Deep Partial Type
// ═══════════════════════════════════════════════════════════════════

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RolePreset = DeepPartial<FocusGroupConfig>;

// ═══════════════════════════════════════════════════════════════════
// Built-in Role Presets
// ═══════════════════════════════════════════════════════════════════

const rolePresets: Record<string, RolePreset> = {
    // Standard group
    group: {},

    // List-based patterns
    listbox: {
        navigate: { orientation: 'vertical', loop: false },
        select: { mode: 'single', followFocus: false },
        tab: { behavior: 'escape' },
    },

    menu: {
        navigate: { orientation: 'vertical', loop: true },
        select: { mode: 'single', followFocus: true },
        activate: { mode: 'manual' },
        dismiss: { escape: 'close' },
        tab: { behavior: 'trap' },
    },

    // Radio/Tab patterns
    radiogroup: {
        navigate: { orientation: 'vertical', loop: true },
        select: { mode: 'single', followFocus: true, disallowEmpty: true },
        tab: { behavior: 'escape' },
    },

    tablist: {
        navigate: { orientation: 'horizontal', loop: true },
        select: { mode: 'single', followFocus: true, disallowEmpty: true },
        activate: { mode: 'automatic' },
        tab: { behavior: 'escape' },
    },

    // Toolbar patterns
    toolbar: {
        navigate: { orientation: 'horizontal', loop: false },
        tab: { behavior: 'escape' },
    },

    // Grid patterns
    grid: {
        navigate: { orientation: 'both', loop: false },
        select: { mode: 'multiple', range: true, toggle: true },
        tab: { behavior: 'escape' },
    },

    // Tree patterns
    tree: {
        navigate: { orientation: 'vertical', loop: false },
        select: { mode: 'single' },
        activate: { mode: 'manual' },
        tab: { behavior: 'escape' },
    },

    // Builder Block - Visual page builder blocks
    builderBlock: {
        navigate: { seamless: true },
        tab: { behavior: 'flow' },
    },

    // Application - Full spatial navigation (TV/Game console style)
    application: {
        navigate: { orientation: 'both', seamless: true },
        tab: { behavior: 'flow' },
    },
};


export function resolveRole(
    role: string | undefined,
    overrides: {
        navigate?: Partial<NavigateConfig>;
        tab?: Partial<TabConfig>;
        select?: Partial<SelectConfig>;
        activate?: Partial<ActivateConfig>;
        dismiss?: Partial<DismissConfig>;
        project?: Partial<ProjectConfig>;
    } = {}
): FocusGroupConfig {
    const basePreset = role ? (rolePresets[role] || {}) : {};

    return {
        navigate: { ...DEFAULT_NAVIGATE, ...basePreset.navigate, ...overrides.navigate },
        tab: { ...DEFAULT_TAB, ...basePreset.tab, ...overrides.tab },
        select: { ...DEFAULT_SELECT, ...basePreset.select, ...overrides.select },
        activate: { ...DEFAULT_ACTIVATE, ...basePreset.activate, ...overrides.activate },
        dismiss: { ...DEFAULT_DISMISS, ...basePreset.dismiss, ...overrides.dismiss },
        project: { ...DEFAULT_PROJECT, ...basePreset.project, ...overrides.project },
    };
}

