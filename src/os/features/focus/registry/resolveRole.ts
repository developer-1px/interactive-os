/**
 * Role Resolver
 * 
 * Role preset, 기본값, overrides를 병합하여 최종 설정 생성
 * 우선순위: overrides > preset > defaults
 */

import type { FocusGroupProps, NavigateConfig, TabConfig, SelectConfig, ActivateConfig, DismissConfig, ProjectConfig } from "@os/entities/FocusGroupProps";
import { DEFAULT_NAVIGATE, DEFAULT_TAB, DEFAULT_SELECT, DEFAULT_ACTIVATE, DEFAULT_DISMISS, DEFAULT_PROJECT } from "@os/entities/FocusGroupProps";
import { getRole } from "./roleRegistry";

export interface ResolvedFocusGroup {
    navigate: NavigateConfig;
    tab: TabConfig;
    select: SelectConfig;
    activate: ActivateConfig;
    dismiss: DismissConfig;
    project: ProjectConfig;
}

/**
 * Role preset과 overrides를 병합하여 최종 FocusGroup 설정 생성
 * 
 * @example
 * // Role만 지정
 * resolveRole('listbox');
 * 
 * // Role + override
 * resolveRole('listbox', { navigate: { loop: true } });
 * 
 * // Override만 (role 없음)
 * resolveRole(undefined, { navigate: { orientation: 'horizontal' } });
 */
export function resolveRole(
    role?: string,
    overrides?: Partial<FocusGroupProps>
): ResolvedFocusGroup {
    // 1. Role preset 조회
    const preset = role ? getRole(role) : undefined;

    // 2. 각 phase별로 병합: defaults < preset < overrides
    return {
        navigate: {
            ...DEFAULT_NAVIGATE,
            ...preset?.navigate,
            ...overrides?.navigate,
        },
        tab: {
            ...DEFAULT_TAB,
            ...preset?.tab,
            ...overrides?.tab,
        },
        select: {
            ...DEFAULT_SELECT,
            ...preset?.select,
            ...overrides?.select,
        },
        activate: {
            ...DEFAULT_ACTIVATE,
            ...preset?.activate,
            ...overrides?.activate,
        },
        dismiss: {
            ...DEFAULT_DISMISS,
            ...preset?.dismiss,
            ...overrides?.dismiss,
        },
        project: {
            ...DEFAULT_PROJECT,
            ...preset?.project,
            ...overrides?.project,
        },
    };
}
