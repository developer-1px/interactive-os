/**
 * Activate Strategy
 * 
 * Enter/Space 키로 아이템 활성화
 * - manual: 명시적으로 Enter/Space 필요
 * - automatic: 포커스 시 자동 활성화
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type ActivateMode = 'manual' | 'automatic';

export interface ActivateConfig {
    mode: ActivateMode;
}

export interface ActivateResult {
    activated: boolean;
    targetId: string;
}

export type ActivateCallback = (targetId: string) => void;

// ═══════════════════════════════════════════════════════════════════
// Strategy
// ═══════════════════════════════════════════════════════════════════

/**
 * 활성화 가능 여부 확인
 */
export function shouldActivate(
    key: string,
    config: ActivateConfig
): boolean {
    if (config.mode === 'automatic') {
        // automatic 모드에서는 포커스 시점에 활성화하므로 여기선 false
        return false;
    }

    // manual 모드: Enter 또는 Space
    return key === 'Enter' || key === ' ';
}

/**
 * 활성화 처리
 */
export function activate(
    targetId: string,
    callback?: ActivateCallback
): ActivateResult {
    if (callback) {
        callback(targetId);
    }

    return {
        activated: true,
        targetId,
    };
}

/**
 * 포커스 시 자동 활성화 (automatic 모드용)
 */
export function activateOnFocus(
    focusedId: string,
    config: ActivateConfig,
    callback?: ActivateCallback
): ActivateResult | null {
    if (config.mode !== 'automatic') {
        return null;
    }

    return activate(focusedId, callback);
}

/**
 * DOM 클릭 이벤트로 활성화
 * 클릭 시에는 mode와 무관하게 항상 활성화
 */
export function activateOnClick(
    targetId: string,
    callback?: ActivateCallback
): ActivateResult {
    return activate(targetId, callback);
}
