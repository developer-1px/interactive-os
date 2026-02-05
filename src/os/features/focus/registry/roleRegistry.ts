/**
 * Role Registry
 * 
 * Built-in 및 Custom role preset을 관리하는 Registry
 * @see docs/2-area/focus-system/Pipeline-Spec.md
 */

import type { FocusGroupProps } from "@os/entities/FocusGroupProps";

// ═══════════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════════
export const roleRegistry = new Map<string, Partial<FocusGroupProps>>();

// ═══════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════

/**
 * Custom role 등록
 * @example
 * registerRole('file-explorer', {
 *   navigate: { orientation: 'vertical', typeahead: true },
 *   select: { mode: 'multiple', range: true, toggle: true },
 * });
 */
export function registerRole(name: string, config: Partial<FocusGroupProps>): void {
    roleRegistry.set(name, config);
}

/**
 * Role preset 조회
 */
export function getRole(name: string): Partial<FocusGroupProps> | undefined {
    return roleRegistry.get(name);
}

/**
 * 등록된 모든 role 이름 조회
 */
export function getRoleNames(): string[] {
    return Array.from(roleRegistry.keys());
}

// ═══════════════════════════════════════════════════════════════════
// Built-in Presets
// ═══════════════════════════════════════════════════════════════════

// Dialog - Focus trap, 내부에서만 Tab 순환
registerRole('dialog', {
    navigate: { orientation: 'vertical', loop: false },
    tab: { behavior: 'trap', restoreFocus: true },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
    dismiss: { escape: 'close', outsideClick: 'close' },
});

registerRole('alertdialog', {
    navigate: { orientation: 'vertical', loop: false },
    tab: { behavior: 'trap', restoreFocus: true },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
    dismiss: { escape: 'none', outsideClick: 'none' }, // 강제로 닫을 수 없음
});

// Toolbar - 수평 이동, Tab 탈출
registerRole('toolbar', {
    navigate: { orientation: 'horizontal', loop: false },
    tab: { behavior: 'escape', restoreFocus: false },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
});

// Menu - 수직 이동, loop, typeahead
registerRole('menu', {
    navigate: { orientation: 'vertical', loop: true, typeahead: true },
    tab: { behavior: 'escape' },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
    dismiss: { escape: 'close', outsideClick: 'close' },
});

registerRole('menubar', {
    navigate: { orientation: 'horizontal', loop: true },
    tab: { behavior: 'escape' },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
});

// Listbox - 수직 이동, 선택 지원
registerRole('listbox', {
    navigate: { orientation: 'vertical', loop: false, typeahead: true, entry: 'selected' },
    tab: { behavior: 'escape' },
    select: { mode: 'single', range: true, toggle: true },
    activate: { mode: 'manual' },
});

// Tabs - 수평 이동, manual activation
registerRole('tablist', {
    navigate: { orientation: 'horizontal', loop: true, entry: 'restore' },
    tab: { behavior: 'escape', restoreFocus: true },
    select: { mode: 'single', followFocus: false },
    activate: { mode: 'manual' },
});

// 별칭
registerRole('tabs', getRole('tablist')!);

// RadioGroup - 수직 이동, 포커스 따라 자동 선택
registerRole('radiogroup', {
    navigate: { orientation: 'vertical', loop: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single', followFocus: true, disallowEmpty: true },
    activate: { mode: 'automatic' },
});

// Grid - 4방향 이동, seamless
registerRole('grid', {
    navigate: { orientation: 'both', loop: false, seamless: true, entry: 'restore' },
    tab: { behavior: 'escape', restoreFocus: true },
    select: { mode: 'single' },
    activate: { mode: 'manual' },
});

// Tree - 수직 이동, typeahead
registerRole('tree', {
    navigate: { orientation: 'vertical', loop: false, typeahead: true, entry: 'restore' },
    tab: { behavior: 'escape' },
    select: { mode: 'single' },
    activate: { mode: 'manual' },
});

// Combobox - Virtual focus
registerRole('combobox', {
    navigate: { orientation: 'vertical', loop: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single' },
    activate: { mode: 'manual' },
    project: { virtualFocus: true },
});

// Form - Tab flow, 방향키 이동 없음
registerRole('form', {
    navigate: { orientation: 'vertical', loop: false },
    tab: { behavior: 'flow' },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
});
