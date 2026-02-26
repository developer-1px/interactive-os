# Spec — unified-pointer-listener

> 한 줄 요약: MouseListener + DragListener를 단일 PointerListener로 통합한다 (Gesture Recognizer 패턴).

## 1. 기능 요구사항 (Functional Requirements)

### 1.1 Gesture Recognizer — 제스처 분기

**Story**: OS로서, 같은 물리 제스처(pointerdown→pointermove→pointerup)를 하나의 Listener에서 CLICK과 DRAG로 정확히 분기하고 싶다. 그래야 두 Listener가 같은 이벤트를 경쟁 처리하는 충돌이 사라지기 때문이다.

**Use Case — 주 흐름:**
1. 사용자가 pointerdown을 발생시킨다.
2. PointerListener가 제스처 시작을 기록한다.
3a. pointermove가 threshold(5px)를 초과하면 → DRAG 모드 전환.
3b. pointerup이 threshold 이전에 발생하면 → CLICK 모드.

**Scenarios (Given/When/Then):**

Scenario S1-1: 일반 클릭 (threshold 미달)
  Given 사용자가 data-item-id 요소 위에서 pointerdown
  When pointermove가 5px 미만인 상태에서 pointerup 발생
  Then CLICK 모드로 판정
  And 기존 MouseListener와 동일한 커맨드 시퀀스 발생 (OS_FOCUS + OS_SELECT)

Scenario S1-2: 드래그 (threshold 초과)
  Given 사용자가 data-drag-handle 요소 위에서 pointerdown
  When pointermove가 5px 이상
  Then DRAG 모드로 전환
  And OS_DRAG_START 발생
  And 이후 pointermove마다 OS_DRAG_OVER 발생
  And pointerup 시 OS_DRAG_END 발생

Scenario S1-3: 드래그 핸들 없이 드래그 시도
  Given 사용자가 data-drag-handle이 아닌 요소 위에서 pointerdown
  When pointermove가 5px 이상
  Then DRAG 모드로 전환되지 않음
  And pointerup 시 CLICK 모드로 판정

Scenario S1-4: 오른쪽 클릭
  Given 사용자가 button !== 0으로 pointerdown
  Then 무시 (drag/click 모두 발생하지 않음)

### 1.2 CLICK 모드 — MouseListener 로직 이식

**Story**: OS로서, 기존 MouseListener의 모든 클릭 행동을 PointerListener의 CLICK 모드에서 정확히 재현하고 싶다.

**Use Case — 주 흐름:**
1. CLICK 모드로 판정된다.
2. pointerdown 시점: senseMouseDown + resolveMouse 실행 → OS_FOCUS + OS_SELECT.
3. pointerup 시점(= click): senseClick + resolveClick 실행 → OS_ACTIVATE (re-click 등).

**Scenarios (Given/When/Then):**

Scenario S2-1: 일반 아이템 클릭 → focus + select (replace)
  Given zone 내 data-item-id 요소 존재
  When 수정자 키 없이 클릭
  Then OS_FOCUS(zoneId, itemId, skipSelection:true) + OS_SELECT(targetId, mode:"replace")

Scenario S2-2: Shift+클릭 → range select
  Given zone 내 data-item-id 요소 존재
  When Shift 키를 누른 채 클릭
  Then OS_SELECT(mode:"range") + preventDefault

Scenario S2-3: Meta/Ctrl+클릭 → toggle select
  Given zone 내 data-item-id 요소 존재
  When Meta 또는 Ctrl 키를 누른 채 클릭
  Then OS_SELECT(mode:"toggle") + preventDefault

Scenario S2-4: 빈 영역 클릭 (zone-only)
  Given zone 존재하지만 data-item-id 요소 없음
  When 클릭
  Then OS_FOCUS(zoneId, itemId:null)

Scenario S2-5: Label 클릭 → label redirect
  Given data-label + data-for 요소 존재
  When 클릭
  Then OS_FOCUS(labelTargetGroupId, labelTargetItemId) + preventDefault

Scenario S2-6: 확장 가능한 button → OS_ACTIVATE
  Given aria-expanded 속성이 있고 role="button"
  When 클릭
  Then OS_FOCUS + OS_SELECT + OS_ACTIVATE

Scenario S2-7: treeitem with aria-expanded → mousedown에서 OS_ACTIVATE 없음
  Given aria-expanded 속성이 있고 role="treeitem"
  When mousedown
  Then OS_FOCUS + OS_SELECT만 (OS_ACTIVATE 없음, click에서 처리)

Scenario S2-8: 이미 포커스된 아이템 re-click → OS_ACTIVATE
  Given activateOnClick이 true이고 clickedItemId === focusedItemId
  When click
  Then OS_ACTIVATE

Scenario S2-9: aria-current="page" → 즉시 OS_ACTIVATE
  Given activateOnClick이 true이고 aria-current="page"
  When click
  Then OS_ACTIVATE (focusedItemId와 무관)

Scenario S2-10: EDIT→EDIT 전이 (다른 Field 클릭)
  Given 아이템 A를 편집 중 (editingItemId = A)
  When 다른 Field 아이템 B를 클릭
  Then OS_FOCUS(B) + OS_SELECT(B) + OS_FIELD_START_EDIT + seedCaretFromPoint

Scenario S2-11: Inspector 영역 클릭 → 무시
  Given target이 [data-inspector] 내부
  Then 무시 (커맨드 없음)

Scenario S2-12: ExpandTrigger / CheckTrigger 클릭 → click 무시
  Given target이 [data-expand-trigger] 또는 [data-check-trigger]
  Then click 이벤트에서 무시 (해당 컴포넌트가 직접 처리)

### 1.3 DRAG 모드 — DragListener 로직 이식

**Story**: OS로서, 기존 DragListener의 모든 드래그 행동을 PointerListener의 DRAG 모드에서 정확히 재현하고 싶다.

**Scenarios (Given/When/Then):**

Scenario S3-1: drag-handle에서 드래그 시작
  Given data-drag-handle 요소가 data-item-id 내부에 존재
  When pointerdown + pointermove > 5px
  Then OS_DRAG_START(zoneId, itemId)
  And document.body.style.cursor = "grabbing"
  And document.body.style.userSelect = "none"

Scenario S3-2: 드래그 중 아이템 위 이동
  Given 드래그 진행 중
  When pointer가 다른 아이템 위로 이동
  Then OS_DRAG_OVER(overItemId, position:"before"|"after") — 아이템 중앙 기준 분기

Scenario S3-3: 드래그 중 빈 영역 이동
  Given 드래그 진행 중
  When pointer가 아이템 밖으로 이동
  Then OS_DRAG_OVER(overItemId:null, position:null)

Scenario S3-4: 드래그 종료
  Given 드래그 진행 중
  When pointerup
  Then OS_DRAG_END()
  And cursor/userSelect 복원

Scenario S3-5: 직계 자식만 드롭 대상
  Given zone 내 중첩된 zone 존재
  When 드래그 중 이동
  Then 가장 가까운 zone의 직계 자식 data-item-id만 드롭 대상으로 인식

### 1.4 통합 제약

Scenario S4-1: mousedown/click/mouseup 이벤트가 더 이상 등록되지 않음
  Given PointerListener가 마운트됨
  Then document에 mousedown, click, mouseup 리스너가 등록되지 않음
  And pointer events만 사용

Scenario S4-2: FocusListener와의 dispatching 플래그 동기화
  Given PointerListener가 CLICK 모드로 커맨드를 dispatch 중
  Then setDispatching(true) → dispatch → setDispatching(false) 순서 유지
  And FocusListener가 이 구간에서 focusin을 무시

Scenario S4-3: root에서 단일 마운트
  Given Root.tsx에서 PointerListener 마운트
  Then MouseListener, DragListener는 제거됨

## 2. 상태 인벤토리 (State Inventory)

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| IDLE | 제스처 없음 | 초기 / pointerup 후 | pointerdown |
| PENDING | pointerdown 발생, 아직 분기 전 | pointerdown (left button) | pointermove > threshold → DRAG / pointerup → CLICK |
| CLICK | 클릭으로 판정됨 | pointerup in PENDING | 즉시 처리 후 → IDLE |
| DRAG | 드래그 진행 중 | pointermove > threshold in PENDING | pointerup → IDLE |

> 상태 머신: IDLE → PENDING → (CLICK | DRAG) → IDLE

## 3. 파일 구조

```
1-listeners/
  pointer/
    PointerListener.tsx      ← 어댑터 (sense: DOM → PointerInput)
    resolvePointer.ts        ← 순수 (translate: PointerInput → ResolveResult)
  mouse/
    resolveMouse.ts          ← 유지 (CLICK 모드에서 재사용)
    resolveClick.ts          ← 유지 (CLICK 모드에서 재사용)
    MouseListener.tsx        ← 삭제 (PointerListener로 대체)
  drag/
    DragListener.tsx          ← 삭제 (PointerListener로 대체)
```

> `resolveMouse.ts`와 `resolveClick.ts`는 이미 순수함수. PointerListener가 CLICK 모드에서 이들을 호출.
> 새로 만들 `resolvePointer.ts`는 제스처 분기(CLICK vs DRAG) 판정만 담당.

## 4. 범위 밖 (Out of Scope)

- FocusListener 변경 (focusin은 별도 W3C 모듈, pointer와 무관)
- KeyboardListener 변경
- ClipboardListener 변경
- InputListener 변경
- OG-004 (data-drag-handle 자동 주입) — 별도 프로젝트
- OG-005 (커서 메타 API) — 별도 프로젝트
- 터치 이벤트 최적화 (touch-action 등)
- 다중 포인터 (multi-touch)

## 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-02-26 | 초안 작성 |
