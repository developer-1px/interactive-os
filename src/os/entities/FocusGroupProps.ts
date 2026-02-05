/**
 * FocusGroup Pipeline Props
 * 
 * 5-Phase Pipeline 기반 Focus/Selection 설정
 * @see docs/2-area/focus-system/Pipeline-Spec.md
 */

// ═══════════════════════════════════════════════════════════════════
// Phase 3: RESOLVE - Navigate Intent
// ═══════════════════════════════════════════════════════════════════
export interface NavigateConfig {
    /**
     * 이동 방향
     * @default 'vertical'
     */
    orientation: 'horizontal' | 'vertical' | 'both';

    /**
     * 끝에서 처음으로 순환
     * @default false
     */
    loop: boolean;

    /**
     * 경계에서 인접 Zone으로 이동 (OS 고유 기능)
     * @default false
     */
    seamless: boolean;

    /**
     * 문자 입력으로 아이템 검색
     * @default false
     */
    typeahead: boolean;

    /**
     * Zone 진입 시 초기 포커스 위치
     * @default 'first'
     */
    entry: 'first' | 'last' | 'restore' | 'selected';

    /**
     * 아이템 삭제 시 포커스 이동 전략
     * @default 'next'
     */
    recovery: 'next' | 'prev' | 'nearest';
}

// ═══════════════════════════════════════════════════════════════════
// Phase 3: RESOLVE - Tab Intent
// ═══════════════════════════════════════════════════════════════════
export interface TabConfig {
    /**
     * Tab 키 동작
     * - trap: Zone 내 순환 (focus trap)
     * - escape: Zone 탈출
     * - flow: 전체 DFS 순회
     * @default 'escape'
     */
    behavior: 'trap' | 'escape' | 'flow';

    /**
     * Tab으로 나갔다 돌아올 때 마지막 위치 복원
     * @default false
     */
    restoreFocus: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Phase 3: RESOLVE - Select Intent
// ═══════════════════════════════════════════════════════════════════
export interface SelectConfig {
    /**
     * 선택 모드
     * @default 'none'
     */
    mode: 'none' | 'single' | 'multiple';

    /**
     * 포커스 이동 시 자동 선택 (radio 패턴)
     * @default false
     */
    followFocus: boolean;

    /**
     * 최소 1개 선택 필수 (radio 패턴)
     * @default false
     */
    disallowEmpty: boolean;

    /**
     * Shift+Click/Arrow 범위 선택
     * @default false
     */
    range: boolean;

    /**
     * Ctrl+Click 토글 선택
     * @default false
     */
    toggle: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Phase 3: RESOLVE - Activate Intent
// ═══════════════════════════════════════════════════════════════════
export interface ActivateConfig {
    /**
     * 활성화 시점
     * - manual: Enter/Space/Click으로만
     * - automatic: 포커스 이동 시 자동
     * @default 'manual'
     */
    mode: 'manual' | 'automatic';
}

// ═══════════════════════════════════════════════════════════════════
// Phase 3: RESOLVE - Dismiss Intent
// ═══════════════════════════════════════════════════════════════════
export interface DismissConfig {
    /**
     * Escape 키 동작
     * @default 'none'
     */
    escape: 'close' | 'deselect' | 'none';

    /**
     * 외부 클릭 동작
     * @default 'none'
     */
    outsideClick: 'close' | 'none';
}

// ═══════════════════════════════════════════════════════════════════
// Phase 5: PROJECT
// ═══════════════════════════════════════════════════════════════════
export interface ProjectConfig {
    /**
     * Virtual Focus 모드 (aria-activedescendant 사용)
     * @default false
     */
    virtualFocus: boolean;

    /**
     * 마운트 시 자동 포커스
     * @default false
     */
    autoFocus: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Complete FocusGroup Props
// ═══════════════════════════════════════════════════════════════════
export interface FocusGroupProps {
    /**
     * Role preset - PARSE 단계의 키→Intent 매핑을 결정
     * Built-in: 'listbox' | 'menu' | 'toolbar' | 'radiogroup' | 'tablist' | 'grid' | ...
     * Custom: registerRole()로 등록한 커스텀 role
     */
    role?: string;

    /** Navigate phase 설정 */
    navigate?: Partial<NavigateConfig>;

    /** Tab phase 설정 */
    tab?: Partial<TabConfig>;

    /** Select phase 설정 */
    select?: Partial<SelectConfig>;

    /** Activate phase 설정 */
    activate?: Partial<ActivateConfig>;

    /** Dismiss phase 설정 */
    dismiss?: Partial<DismissConfig>;

    /** Project phase 설정 */
    project?: Partial<ProjectConfig>;
}

// ═══════════════════════════════════════════════════════════════════
// Defaults
// ═══════════════════════════════════════════════════════════════════
export const DEFAULT_NAVIGATE: NavigateConfig = {
    orientation: 'vertical',
    loop: false,
    seamless: false,
    typeahead: false,
    entry: 'first',
    recovery: 'next',
};

export const DEFAULT_TAB: TabConfig = {
    behavior: 'escape',
    restoreFocus: false,
};

export const DEFAULT_SELECT: SelectConfig = {
    mode: 'none',
    followFocus: false,
    disallowEmpty: false,
    range: false,
    toggle: false,
};

export const DEFAULT_ACTIVATE: ActivateConfig = {
    mode: 'manual',
};

export const DEFAULT_DISMISS: DismissConfig = {
    escape: 'none',
    outsideClick: 'none',
};

export const DEFAULT_PROJECT: ProjectConfig = {
    virtualFocus: false,
    autoFocus: false,
};

export const DEFAULT_FOCUS_GROUP_PROPS: Required<Omit<FocusGroupProps, 'role'>> = {
    navigate: DEFAULT_NAVIGATE,
    tab: DEFAULT_TAB,
    select: DEFAULT_SELECT,
    activate: DEFAULT_ACTIVATE,
    dismiss: DEFAULT_DISMISS,
    project: DEFAULT_PROJECT,
};
