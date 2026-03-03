# Spec — command-config-invariant

> 한 줄 요약: Command = { intent + chain(string[]) }. rolePresets config 확장으로 resolveItemKey 레이어 대체 준비.

## 1. 기능 요구사항

### 1.1 T1: Config 타입 확장 (Phase 1 — 비파괴적)

**Story**: OS 개발자로서, rolePresets에 chain fallback 옵션(onRight, onLeft 등)을 선언하고 싶다. 그래야 resolveItemKey 없이 role별 Edge behavior를 config로 통합할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. FocusGroupConfig.ts의 NavigateConfig에 `onRight?: string[]` 등 6개 옵셔널 필드 추가
2. SelectConfig에 `scope`, `aria` 옵셔널 필드 추가
3. ActivateConfig에 `effect` 옵셔널 필드 추가
4. DismissConfig에 `restoreFocus` 옵셔널 필드 추가
5. rolePresets에 tree/menu/menubar/accordion/disclosure 값 추가
6. 기존 코드 동작 무변경 (옵셔널 필드이므로)

**Scenarios:**

Scenario: NavigateConfig에 chain 옵셔널 필드 추가
  Given NavigateConfig 인터페이스가 존재한다
  When onRight, onLeft, onUp, onDown, onCrossAxis, onEdge 필드를 string[] | undefined로 추가한다
  Then tsc 0 — 기존 코드에서 이 필드를 참조하지 않으므로 에러 없음
  And 기존 DEFAULT_NAVIGATE에 변경 없음 (옵셔널이므로)

Scenario: SelectConfig에 scope, aria 필드 추가
  Given SelectConfig 인터페이스가 존재한다
  When scope?: "cell" | "column" | "row" 와 aria?: "selected" | "checked" 추가
  Then tsc 0
  And 기존 DEFAULT_SELECT에 변경 없음

Scenario: ActivateConfig에 effect 필드 추가
  Given ActivateConfig 인터페이스가 존재한다
  When effect?: string 추가
  Then tsc 0

Scenario: DismissConfig에 restoreFocus 필드 추가
  Given DismissConfig 인터페이스가 존재한다
  When restoreFocus?: boolean 추가
  Then tsc 0

Scenario: rolePresets에 tree onRight/onLeft 배열 추가
  Given rolePresets.tree가 존재한다
  When navigate.onRight: ["expand", "enterChild"], navigate.onLeft: ["collapse", "goParent"] 추가
  Then tsc 0
  And 기존 tree 동작에 영향 없음 (아직 소비자가 이 옵션을 읽지 않으므로)

Scenario: rolePresets에 menu/menubar onCrossAxis 배열 추가
  Given rolePresets.menu과 rolePresets.menubar가 존재한다
  When navigate.onCrossAxis: ["expandSubmenu"] (menu), navigate.onDown: ["expandSubmenu"] (menubar) 추가
  Then tsc 0

Scenario: rolePresets에 accordion/disclosure activate.effect 추가
  Given rolePresets.accordion과 rolePresets.disclosure가 없다 (현재 미등록)
  When accordion, disclosure rolePreset을 신규 등록하고 activate.effect: "toggleExpand" 설정
  Then tsc 0

Scenario: rolePresets에 checkbox/switch select.aria 추가
  Given rolePresets.checkbox, rolePresets.switch가 존재한다
  When select.aria: "checked" 추가
  Then tsc 0

Scenario: rolePresets에 dialog/alertdialog dismiss.restoreFocus 추가
  Given rolePresets.dialog이 존재한다
  When dismiss.restoreFocus: true 추가
  Then tsc 0

### 1.2 T2: NAVIGATE chain 실행기 (Phase 2)

**Story**: OS 개발자로서, navigate의 cross-axis/edge 행동을 hardcoded if-else 대신 config의 chain fallback으로 실행하고 싶다. 그래야 새 ARIA role 추가 시 코드 수정 없이 config만 추가하면 되기 때문이다.

**Use Case — 주 흐름:**
1. OS_NAVIGATE가 direction을 받는다
2. direction이 config.navigate.axis에 포함되면 기존 resolveNavigate로 이동
3. direction이 axis 외이면 config.navigate.onRight/onLeft 등의 chain을 실행
4. chain의 각 atomic action을 순서대로 시도, 첫 성공에서 멈춤
5. chain이 없거나 전부 실패하면 noop

**Scenarios:**

Scenario: tree ArrowRight on collapsed expandable node → expand
  Given tree zone, focusedItem="node-1", expandable=true, expanded=false
  When OS_NAVIGATE({ direction: "right", chain: ["expand", "enterChild"] })
  Then "expand" 성공 → node-1이 expandedItems에 추가됨

Scenario: tree ArrowRight on expanded node with children → enterChild
  Given tree zone, focusedItem="node-1", expanded=true, children=["child-1"]
  When OS_NAVIGATE({ direction: "right", chain: ["expand", "enterChild"] })
  Then "expand" 실패(이미 열림) → "enterChild" 성공 → focusedItemId="child-1"

Scenario: tree ArrowRight on leaf node → noop
  Given tree zone, focusedItem="leaf-1", expandable=false
  When OS_NAVIGATE({ direction: "right", chain: ["expand", "enterChild"] })
  Then "expand" 실패 → "enterChild" 실패 → focusedItemId 변경 없음

Scenario: tree ArrowLeft on expanded node → collapse
  Given tree zone, focusedItem="node-1", expanded=true
  When OS_NAVIGATE({ direction: "left", chain: ["collapse", "goParent"] })
  Then "collapse" 성공 → node-1이 expandedItems에서 제거됨

Scenario: tree ArrowLeft on collapsed node with parent → goParent
  Given tree zone, focusedItem="child-1", expanded=false, parent="node-1"
  When OS_NAVIGATE({ direction: "left", chain: ["collapse", "goParent"] })
  Then "collapse" 실패 → "goParent" 성공 → focusedItemId="node-1"

Scenario: grid ArrowRight → no chain, regular 2D move
  Given grid zone with axis="both"
  When OS_NAVIGATE({ direction: "right" })
  Then 기존 resolveNavigate로 이동, chain 미실행

Scenario: listbox ArrowRight → no chain, noop (vertical only)
  Given listbox zone with axis="vertical", no onRight config
  When OS_NAVIGATE({ direction: "right" })
  Then noop (axis 외, chain 없음)

### 1.3 T3: resolveItemKey treeitem 제거 (Phase 3 partial)

**Story**: OS 개발자로서, resolveItemKey의 treeitem resolver를 제거하고 싶다. 이미 T2 chain executor가 동일 로직을 처리하므로 중복이다.

**Use Case — 주 흐름:**
1. resolveItemKey에서 treeitem resolver 제거
2. treegrid rolePreset에 onRight/onLeft chain 추가 (arrowExpand만 있던 것을 chain으로 전환)
3. 기존 tree/treegrid 동작 유지 확인

**Scenarios:**

Scenario: treeitem resolver 제거 후 tree ArrowRight/Left 동작 유지
  Given tree zone with chain executor (T2)
  When ArrowRight on collapsed expandable node
  Then expand 동작 (chain executor가 처리)

Scenario: treegrid에 onRight/onLeft chain 추가
  Given treegrid rolePreset에 arrowExpand: true만 있음
  When onRight: ["expand", "enterChild"], onLeft: ["collapse", "goParent"] 추가
  Then chain executor가 treegrid도 처리

Scenario: radio/button/checkbox resolver는 유지
  Given resolveItemKey에서 treeitem만 제거
  When Space on radio → SELECT, Space on button → ACTIVATE
  Then 기존 동작 유지

**Out of Scope**: radio/button/checkbox resolver 제거 (Phase 4-5 범위)

## 2. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| Before | 기존 config 타입 (onRight 등 없음) | 현재 | T1 완료 |
| T1 Done | config 타입 확장됨 (비파괴) | T1 | T2 시작 |
| T2 Done | chain 실행기 동작 | T2 | T3 시작 |
| After | resolveItemKey 삭제, 6-command 체계 | T3 | — |

## 3. 범위 밖 (Out of Scope)

- T1에서 chain 실행기 구현 ❌ (T2 범위)
- T1에서 resolveItemKey 삭제 ❌ (T3 범위)
- T1에서 OS_CHECK/OS_EXPAND 삭제 ❌ (Phase 4-5 범위)
- T1에서 osDefaults modifier 바인딩 추가 ❌ (Phase 6 범위)
