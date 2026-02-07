# FocusGroup / FocusItem 아키텍처

> **버전**: v8.201  
> **날짜**: 2026-02-07  
> **위치**: `src/os/features/focus/`

---

## 1. 개요

FocusGroup/FocusItem은 Antigravity Interaction OS의 핵심 포커스 관리 시스템입니다.  
**Config-Driven API**를 통해 선언적으로 포커스, 선택, 활성화 동작을 정의합니다.

### 핵심 설계 원칙

| 원칙 | 설명 |
|:----|:----|
| **Config-Driven** | 7-Axis 모델 대신 6개의 Config 객체로 동작 정의 |
| **Scoped Store** | 각 FocusGroup이 독립적인 Zustand store 소유 |
| **Pipeline Architecture** | 5단계 파이프라인으로 이벤트 처리 |
| **Projection-Only Items** | FocusItem은 상태를 반영만 하고, 이벤트 처리는 글로벌 센서가 담당 |

---

## 2. 디렉토리 구조

```
src/os/features/focus/
├── primitives/           # React 컴포넌트
│   ├── FocusGroup.tsx    # 포커스 컨테이너 (Group)
│   └── FocusItem.tsx     # 포커스 가능 아이템
├── pipeline/             # 5-Phase 처리 파이프라인
│   ├── 1-sense/          # DOM 이벤트 캡처 (Sensor)
│   ├── 2-intent/         # Intent 해석 및 Command 핸들링
│   ├── 3-update/         # 로직 업데이트 (Navigate, Tab, Select, etc.)
│   ├── 4-commit/         # 상태 커밋
│   └── 5-sync/           # DOM 동기화 (el.focus())
├── registry/             # 전역 레지스트리
│   ├── FocusRegistry.ts  # Group 등록/활성화 관리
│   ├── DOMRegistry.ts    # DOM 요소 레지스트리
│   └── roleRegistry.ts   # ARIA Role Preset 정의
├── store/                # Zustand Store
│   ├── focusGroupStore.ts # Store Factory
│   └── slices/           # State Slices (cursor, spatial, selection, items)
├── lib/                  # 유틸리티
└── types.ts              # 타입 정의
```

---

## 3. Config-Driven API

### 3.1. 6개의 Config 객체

```typescript
interface FocusGroupConfig {
    navigate: NavigateConfig;   // 방향키 탐색
    tab: TabConfig;             // Tab 키 동작
    select: SelectConfig;       // 선택 모드
    activate: ActivateConfig;   // 활성화 트리거
    dismiss: DismissConfig;     // ESC/Outside Click
    project: ProjectConfig;     // DOM 투영 옵션
}
```

### 3.2. NavigateConfig

```typescript
interface NavigateConfig {
    orientation: 'horizontal' | 'vertical' | 'both';
    loop: boolean;           // 끝에서 처음으로 순환
    seamless: boolean;       // Group 간 공간 이동
    typeahead: boolean;      // 타이핑으로 검색
    entry: 'first' | 'last' | 'restore' | 'selected';
    recovery: 'next' | 'prev' | 'nearest';
}
```

### 3.3. TabConfig

```typescript
interface TabConfig {
    behavior: 'trap' | 'escape' | 'flow';
    restoreFocus: boolean;   // Group 복귀 시 마지막 위치 복원
}
```

| 값 | 동작 |
|:---|:----|
| `trap` | Group 내부에서 Tab 순환 (모달 등) |
| `escape` | Tab으로 다음 Group으로 이동 |
| `flow` | 표준 Tab 흐름 유지 |

### 3.4. SelectConfig

```typescript
interface SelectConfig {
    mode: 'none' | 'single' | 'multiple';
    followFocus: boolean;    // 포커스 이동 시 자동 선택
    disallowEmpty: boolean;  // 필수 선택
    range: boolean;          // Shift+Click 범위 선택
    toggle: boolean;         // Ctrl+Click 토글
}
```

### 3.5. 기타 Config

```typescript
interface ActivateConfig {
    mode: 'manual' | 'automatic';  // Enter 필요 vs 포커스로 자동
}

interface DismissConfig {
    escape: 'close' | 'deselect' | 'none';
    outsideClick: 'close' | 'none';
}

interface ProjectConfig {
    virtualFocus: boolean;   // aria-activedescendant 사용
    autoFocus: boolean;      // 마운트 시 자동 포커스
}
```

---

## 4. Role Preset 시스템

`roleRegistry.ts`에서 ARIA 역할별 기본값을 제공합니다.

```tsx
// 선언적 사용
<FocusGroup role="listbox">
    <FocusItem id="item-1">Option 1</FocusItem>
</FocusGroup>

// role="listbox" 프리셋:
// navigate: { orientation: 'vertical', loop: false }
// select: { mode: 'single', followFocus: false }
// tab: { behavior: 'escape' }
```

### 내장 프리셋

| Role | Navigate | Tab | Select |
|:-----|:---------|:----|:-------|
| `listbox` | vertical, !loop | escape | single |
| `menu` | vertical, loop | trap | single, followFocus |
| `radiogroup` | vertical, loop | escape | single, followFocus, disallowEmpty |
| `tablist` | horizontal, loop | escape | single, followFocus, disallowEmpty |
| `toolbar` | horizontal, !loop | escape | none |
| `grid` | both, !loop | escape | multiple, range, toggle |
| `tree` | vertical, !loop | escape | single |

---

## 5. 5-Phase Pipeline

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   1.SENSE   │ → │   2.INTENT  │ → │   3.UPDATE  │ → │   4.COMMIT  │ → │   5.SYNC    │
│  (Sensor)   │   │  (Handler)  │   │   (Logic)   │   │   (Store)   │   │    (DOM)    │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
     ↑ DOM Event       ↑ Command        ↑ Pure Fn        ↑ Mutation        ↑ el.focus()
```

### Phase 1: SENSE (`GlobalFocusSensor`)

- DOM 이벤트 캡처 (`focusin`, `mousedown`)
- OS Command로 변환 (`OS_FOCUS`, `OS_SELECT`)

### Phase 2: INTENT (`FocusCommandHandler`)

- Command 수신 및 핸들러 라우팅
- FocusRegistry에서 활성 Group 조회

### Phase 3: UPDATE (`3-update/`)

순수 함수로 다음 상태 계산:
- `updateNavigate.ts` - 방향키 탐색
- `updateTab.ts` - Tab 동작 결정
- `updateSelect.ts` - 선택 상태 계산
- `updateActivate.ts` - 활성화 조건 확인
- `updateEntry.ts` - Group 진입 시 초기 포커스

### Phase 4: COMMIT (`commitFocus.ts`)

```typescript
commitAll(store, {
    targetId: 'item-3',
    selection: ['item-3'],
    anchor: 'item-3',
    stickyX: 150,
});
```

- **단일 커밋 포인트**: 모든 상태 변경은 여기를 통과
- 순수 Store 뮤테이션, 외부 사이드이펙트 없음

### Phase 5: SYNC (`GlobalFocusProjector`)

- `focusedItemId` 변경 감지
- `DOMRegistry.getItem(id).focus()` 호출
- `aria-current` 속성 동기화

---

## 6. Registry 시스템

### 6.1. FocusRegistry

```typescript
// Group 등록 (FocusGroup 마운트 시 자동)
FocusRegistry.register(groupId, store, parentId, config, onActivate);

// 활성 Group 관리
FocusRegistry.setActiveGroup(groupId);
FocusRegistry.getActiveGroupEntry();

// Group 간 탐색
FocusRegistry.getSiblingGroup('forward');
FocusRegistry.getFocusPath();  // 중첩 Group 경로
```

### 6.2. DOMRegistry

```typescript
// Group/Item DOM 요소 레지스트리
DOMRegistry.registerGroup(groupId, element);
DOMRegistry.registerItem(itemId, groupId, element);

// 조회
DOMRegistry.getGroup(groupId): HTMLElement;
DOMRegistry.getItem(itemId): HTMLElement;
```

---

## 7. Store 구조

### Scoped Store Factory

```typescript
// 각 FocusGroup은 독립적인 store 생성
const store = createFocusGroupStore(groupId);
```

### State Slices

| Slice | 상태 | 책임 |
|:------|:-----|:-----|
| `cursor` | `focusedItemId`, `lastFocusedId` | 포커스 위치 |
| `spatial` | `stickyX`, `stickyY` | 공간 탐색 앵커 |
| `selection` | `selection[]`, `selectionAnchor` | 선택 상태 |
| `items` | `items[]` | 등록된 아이템 목록 |

---

## 8. 사용 예시

### 기본 사용

```tsx
import { FocusGroup, FocusItem } from '@os/features/focus/primitives';

function TodoList() {
    return (
        <FocusGroup 
            id="todo-list"
            role="listbox"
            select={{ mode: 'multiple', range: true }}
            onActivate={(itemId) => openTodo(itemId)}
        >
            {todos.map(todo => (
                <FocusItem key={todo.id} id={todo.id}>
                    {todo.title}
                </FocusItem>
            ))}
        </FocusGroup>
    );
}
```

### 중첩 Group

```tsx
<FocusGroup id="sidebar" role="tree">
    <FocusItem id="folder-1">Documents</FocusItem>
    
    <FocusGroup id="folder-1-children" role="group">
        <FocusItem id="file-1">Report.pdf</FocusItem>
        <FocusItem id="file-2">Notes.md</FocusItem>
    </FocusGroup>
</FocusGroup>
```

### Toolbar 패턴

```tsx
<FocusGroup role="toolbar" navigate={{ orientation: 'horizontal' }}>
    <FocusItem id="bold"><Bold /></FocusItem>
    <FocusItem id="italic"><Italic /></FocusItem>
    <FocusItem id="underline"><Underline /></FocusItem>
</FocusGroup>
```

---

## 9. ARIA 속성 매핑

### FocusItem 출력

| 상태 | ARIA 속성 |
|:-----|:----------|
| 현재 포커스 (활성 Group) | `aria-current="true"`, `tabIndex="0"` |
| 포커스 앵커 (비활성 Group) | `data-anchor="true"`, `tabIndex="-1"` |
| 선택됨 | `aria-selected="true"` |
| 비활성화 | `aria-disabled="true"` |

### FocusGroup 출력

```html
<div 
    id="todo-list"
    data-focus-group="todo-list"
    aria-orientation="vertical"
    aria-multiselectable="true"  <!-- select.mode === 'multiple' -->
    role="listbox"
    tabIndex="-1"
>
```

---

## 10. 마이그레이션 가이드

### 이전 7-Axis 모델 → Config-Driven API

| 이전 (7-Axis) | 현재 (Config) |
|:--------------|:--------------|
| `direction="v"` | `navigate={{ orientation: 'vertical' }}` |
| `edge="loop"` | `navigate={{ loop: true }}` |
| `tab="escape"` | `tab={{ behavior: 'escape' }}` |
| `entry="first"` | `navigate={{ entry: 'first' }}` |
| `restore={true}` | `tab={{ restoreFocus: true }}` |
| `recovery="sibling"` | `navigate={{ recovery: 'next' }}` |
| `seamless={true}` | `navigate={{ seamless: true }}` |

---

*Reference: FocusGroup System v7.48+ (2026-02-05)*
