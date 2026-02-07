# FocusGroup 파이프라인 명세

> **버전**: 2.1 (2026-02-07)  
> **상태**: Red Team 감사 후 최종 확정  
> **구현 위치**: `src/os/features/focus/pipeline/`

---

## 1. 파이프라인 개요

> 현재 구현에서는 **Sense → Intent → Resolve → Commit → Sync** 5-Phase로 명명됩니다.

```
INTERCEPT → PARSE → RESOLVE → COMMIT → PROJECT
    │          │        │         │        │
    │          │        │         │        └── DOM 반영
    │          │        │         └── Store 업데이트
    │          │        └── 다음 상태 계산 (핵심 설정)
    │          └── 키 → Intent 변환 (role이 결정)
    └── 브라우저 이벤트 가로채기 (OS 레벨)
```

| Phase | 담당 | Zone 설정 |
|:--|:--|:--|
| INTERCEPT | OS 전역 | ❌ 불필요 |
| PARSE | role preset | ❌ 불필요 |
| RESOLVE | FocusGroup | ✅ **핵심 설정** |
| COMMIT | OS Store | ❌ 불필요 |
| PROJECT | FocusGroup | ✅ 설정 가능 |

---

## 2. 완전한 인터페이스 정의

```typescript
interface FocusGroupProps {
  /**
   * Role preset - PARSE 단계의 키→Intent 매핑을 결정
   * @example 'listbox' | 'menu' | 'toolbar' | 'radiogroup' | 'tablist' | 'grid'
   */
  role?: string;

  // ═══════════════════════════════════════════════════════════════════
  // Phase 3: RESOLVE - Navigate Intent
  // ═══════════════════════════════════════════════════════════════════
  navigate?: {
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
  };

  // ═══════════════════════════════════════════════════════════════════
  // Phase 3: RESOLVE - Tab Intent
  // ═══════════════════════════════════════════════════════════════════
  tab?: {
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
  };

  // ═══════════════════════════════════════════════════════════════════
  // Phase 3: RESOLVE - Select Intent
  // ═══════════════════════════════════════════════════════════════════
  select?: {
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
  };

  // ═══════════════════════════════════════════════════════════════════
  // Phase 3: RESOLVE - Activate Intent
  // ═══════════════════════════════════════════════════════════════════
  activate?: {
    /**
     * 활성화 시점
     * - manual: Enter/Space/Click으로만
     * - automatic: 포커스 이동 시 자동
     * @default 'manual'
     */
    mode: 'manual' | 'automatic';
  };

  // ═══════════════════════════════════════════════════════════════════
  // Phase 3: RESOLVE - Dismiss Intent
  // ═══════════════════════════════════════════════════════════════════
  dismiss?: {
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
  };

  // ═══════════════════════════════════════════════════════════════════
  // Phase 5: PROJECT
  // ═══════════════════════════════════════════════════════════════════
  project?: {
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
  };
}
```

---

## 3. 속성 참조 테이블

### 3.1 Navigate Properties

| Property | Type | Default | Description |
|:--|:--|:--|:--|
| `orientation` | `'horizontal' \| 'vertical' \| 'both'` | `'vertical'` | Arrow 키 이동 방향 |
| `loop` | `boolean` | `false` | 끝→처음 순환 여부 |
| `seamless` | `boolean` | `false` | 인접 Zone 이동 허용 |
| `typeahead` | `boolean` | `false` | 문자 입력 검색 |
| `entry` | `'first' \| 'last' \| 'restore' \| 'selected'` | `'first'` | Zone 진입 시 포커스 |
| `recovery` | `'next' \| 'prev' \| 'nearest'` | `'next'` | 삭제 시 포커스 이동 |

### 3.2 Tab Properties

| Property | Type | Default | Description |
|:--|:--|:--|:--|
| `behavior` | `'trap' \| 'escape' \| 'flow'` | `'escape'` | Tab 키 동작 방식 |
| `restoreFocus` | `boolean` | `false` | 복귀 시 위치 복원 |

### 3.3 Select Properties

| Property | Type | Default | Description |
|:--|:--|:--|:--|
| `mode` | `'none' \| 'single' \| 'multiple'` | `'none'` | 선택 허용 모드 |
| `followFocus` | `boolean` | `false` | 포커스 따라 자동 선택 |
| `disallowEmpty` | `boolean` | `false` | 최소 1개 선택 강제 |
| `range` | `boolean` | `false` | Shift 범위 선택 |
| `toggle` | `boolean` | `false` | Ctrl 토글 선택 |

### 3.4 Activate Properties

| Property | Type | Default | Description |
|:--|:--|:--|:--|
| `mode` | `'manual' \| 'automatic'` | `'manual'` | 활성화 시점 |

### 3.5 Dismiss Properties

| Property | Type | Default | Description |
|:--|:--|:--|:--|
| `escape` | `'close' \| 'deselect' \| 'none'` | `'none'` | ESC 키 동작 |
| `outsideClick` | `'close' \| 'none'` | `'none'` | 외부 클릭 동작 |

### 3.6 Project Properties

| Property | Type | Default | Description |
|:--|:--|:--|:--|
| `virtualFocus` | `boolean` | `false` | Virtual Focus 모드 |
| `autoFocus` | `boolean` | `false` | 마운트 시 자동 포커스 |

---

## 4. Role Presets

각 role은 위 속성들의 조합입니다.

| Role | navigate | tab | select | activate |
|:--|:--|:--|:--|:--|
| **toolbar** | `h, loop:false` | `escape` | `none` | `manual` |
| **menu** | `v, loop:true, typeahead` | `escape` | `none` | `manual` |
| **menubar** | `h, loop:true` | `escape` | `none` | `manual` |
| **tablist** | `h, loop:true` | `escape, restore` | `single, !followFocus` | `manual` |
| **radiogroup** | `v, loop:true` | `escape` | `single, followFocus, disallowEmpty` | `automatic` |
| **listbox** | `v, loop:false, typeahead` | `escape` | `single, range` | `manual` |
| **grid** | `both, seamless` | `escape` | `single` | `manual` |
| **tree** | `v, loop:false, typeahead` | `escape` | `single` | `manual` |

### Preset Code

```typescript
const ROLE_PRESETS: Record<string, Partial<FocusGroupProps>> = {
  toolbar: {
    navigate: { orientation: 'horizontal', loop: false },
    tab: { behavior: 'escape' },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
  },

  menu: {
    navigate: { orientation: 'vertical', loop: true, typeahead: true },
    tab: { behavior: 'escape' },
    select: { mode: 'none' },
    activate: { mode: 'manual' },
    dismiss: { escape: 'close', outsideClick: 'close' },
  },

  tablist: {
    navigate: { orientation: 'horizontal', loop: true },
    tab: { behavior: 'escape', restoreFocus: true },
    select: { mode: 'single', followFocus: false },
    activate: { mode: 'manual' },
  },

  radiogroup: {
    navigate: { orientation: 'vertical', loop: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single', followFocus: true, disallowEmpty: true },
    activate: { mode: 'automatic' },
  },

  listbox: {
    navigate: { orientation: 'vertical', loop: false, typeahead: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single', range: true, toggle: true },
    activate: { mode: 'manual' },
  },

  grid: {
    navigate: { orientation: 'both', loop: false, seamless: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single' },
    activate: { mode: 'manual' },
  },
};
```

---

## 5. Key-to-Intent Mapping (PARSE Phase)

role에 따라 키 입력이 어떤 Intent로 변환되는지:

| Key | Intent | Notes |
|:--|:--|:--|
| `ArrowUp/Down/Left/Right` | `NAVIGATE` | orientation에 따라 필터링 |
| `Tab` / `Shift+Tab` | `NAVIGATE_TAB` | tab.behavior에 따라 처리 |
| `Enter` | `ACTIVATE` | 항상 |
| `Space` | role에 따라 다름 | button→ACTIVATE, checkbox→SELECT |
| `Escape` | `DISMISS` | dismiss.escape에 따라 처리 |
| `Home` / `End` | `NAVIGATE` | 처음/끝으로 이동 |
| `PageUp` / `PageDown` | `NAVIGATE` | 페이지 단위 이동 (옵션) |
| 문자 입력 | `TYPEAHEAD` | typeahead가 true일 때만 |

### Space Key Behavior by Role

| Role | Space → |
|:--|:--|
| button | ACTIVATE |
| checkbox | SELECT (toggle) |
| radio | SELECT |
| tab | ACTIVATE |
| menuitem | ACTIVATE |
| option (listbox) | SELECT |

---

## 6. Invariant Rules (불변 법칙)

1. **Focus는 항상 1개**: `document.activeElement`는 동시에 여러 개일 수 없음
2. **Selection은 Focus와 독립**: 여러 개 선택 가능, Focus 없이도 선택 유지 가능
3. **Store→DOM 단방향**: DOM 변경은 항상 Store 변경의 결과
4. **Disabled 아이템은 건너뜀**: `skipDisabled`는 항상 true로 동작

---

## 7. 아키텍처 레이어

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: User API (Facade)                                 │
│  ───────────────────────────                                │
│  <Zone role="listbox" />                                    │
│  <Zone role="menu" />                                       │
│  <Zone role="file-explorer" />  ← 커스텀 role도 동일하게    │
│                                                             │
│  → 사용자는 role만 지정하면 됨                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Role Registry (Extension Layer)                   │
│  ────────────────────────────────────────                   │
│  Built-in: listbox, menu, toolbar, radiogroup, tablist...   │
│  Custom: file-explorer, kanban-column, data-grid...         │
│                                                             │
│  → registerRole()로 커스텀 preset 추가 가능                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Core Implementation (FocusGroupProps)             │
│  ──────────────────────────────────────────────             │
│  navigate, tab, select, activate, dismiss, project          │
│                                                             │
│  → 파이프라인 기반 전체 설정 (필요시 직접 접근 가능)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Role Registry API

### 8.1 Registry 구조

```typescript
// 내부 Registry
const roleRegistry = new Map<string, Partial<FocusGroupProps>>();

// Built-in presets 자동 등록
roleRegistry.set('listbox', { ... });
roleRegistry.set('menu', { ... });
roleRegistry.set('toolbar', { ... });
// ...
```

### 8.2 Custom Role 등록

```typescript
import { registerRole } from '@os';

// 파일 탐색기 스타일
registerRole('file-explorer', {
  navigate: { 
    orientation: 'vertical', 
    loop: false, 
    typeahead: true 
  },
  select: { 
    mode: 'multiple', 
    range: true,      // Shift+Click
    toggle: true      // Ctrl+Click
  },
  tab: { behavior: 'escape' },
  activate: { mode: 'manual' },
});

// 칸반 컬럼
registerRole('kanban-column', {
  navigate: { 
    orientation: 'vertical', 
    seamless: true    // 다른 컬럼으로 이동
  },
  select: { mode: 'single' },
  activate: { mode: 'manual' },
});

// 데이터 그리드
registerRole('data-grid', {
  navigate: { 
    orientation: 'both', 
    seamless: true 
  },
  select: { 
    mode: 'multiple', 
    range: true 
  },
  project: { virtualFocus: true },
});
```

### 8.3 사용법

```tsx
// Built-in role 사용
<Zone role="listbox">
  {items.map(item => <Item key={item.id}>{item.name}</Item>)}
</Zone>

// Custom role 사용 (동일한 방식)
<Zone role="file-explorer">
  {files.map(file => <Item key={file.id}>{file.name}</Item>)}
</Zone>

// 직접 설정 오버라이드 (필요시)
<Zone 
  role="listbox" 
  navigate={{ loop: true }}  // listbox 기본값 오버라이드
>
  {items.map(item => <Item key={item.id}>{item.name}</Item>)}
</Zone>
```

### 8.4 Role Resolution 순서

```typescript
function resolveRole(role: string, overrides: Partial<FocusGroupProps>) {
  // 1. Registry에서 preset 조회
  const preset = roleRegistry.get(role) ?? {};
  
  // 2. 기본값 적용
  const defaults = getDefaultProps();
  
  // 3. 우선순위: overrides > preset > defaults
  return deepMerge(defaults, preset, overrides);
}
```

| 우선순위 | 소스 | 설명 |
|:--|:--|:--|
| 1 (최고) | `overrides` | Zone에서 직접 지정한 props |
| 2 | `preset` | Registry에 등록된 role 설정 |
| 3 (최저) | `defaults` | 시스템 기본값 |

---

## 9. Invariant Rules (불변 법칙)

1. **Focus는 항상 1개**: `document.activeElement`는 동시에 여러 개일 수 없음
2. **Selection은 Focus와 독립**: 여러 개 선택 가능, Focus 없이도 선택 유지 가능
3. **Store→DOM 단방향**: DOM 변경은 항상 Store 변경의 결과
4. **Disabled 아이템은 건너뜀**: `skipDisabled`는 항상 true로 동작
5. **Built-in과 Custom은 동등**: 등록 방식만 다르고 동작은 동일

---

*마지막 업데이트: 2026-02-07 | Antigravity OS Focus System*
