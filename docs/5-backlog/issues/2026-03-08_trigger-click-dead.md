# Non-overlay Trigger Click Dead Code

**Created**: 2026-03-08
**Priority**: P1 (기능불가 — createTrigger SDK API가 클릭 시 동작하지 않음)
**Status**: [In Progress]

## Symptom

Todo item의 Edit/MoveUp/MoveDown/Delete 버튼 클릭 시 반응 없음.
Browser Inspector: `OS_FOCUS(delete-todo)` + `OS_SELECT(delete-todo)` 디스패치되나 `onActivate` 미디스패치.

## Root Cause

Non-overlay `createTrigger` 버튼의 클릭이 headless + browser 모두에서 dead code.

### Browser Path
1. `senseClickTarget` finds `data-trigger-id` -> `TriggerOverlayRegistry.get()` = null (non-overlay)
2. Falls through to `{ type: "item" }` path
3. `resolveClick` requires `activateOnClick` = `inputmap["click"].length > 0` -> listbox has no `click` inputmap -> NO_OP

### Headless Path
1. `simulateClick(kernel, "start-edit")` -> `ZoneRegistry.findItemCallback("start-edit")` = null
2. React `useEffect` doesn't run in `renderToString` -> callback never registered
3. Falls through to zone item path -> "start-edit" not in zone's getItems() -> no-op or phantom focus

### Shared ID Problem
All instances of same trigger (e.g. `<StartEdit payload={{id: "todo_1"}}>`, `<StartEdit payload={{id: "todo_2"}}>`)
share fixed id="start-edit" -> `setItemCallback` last-writer-wins -> only last rendered instance's payload survives.

## Plan

### 근본 원인
click pipeline에 non-overlay trigger 전용 경로가 없음 + Shared ID로 인해 per-instance payload 불가

### 해결 방향
**기존 메커니즘 재사용**: `senseClickTarget`와 `simulateClick`에 non-overlay trigger 경로 추가.
Shared ID 문제는 per-instance ID 생성으로 해결.

### 수정 파일 목록

1. **`packages/os-sdk/src/app/defineApp/trigger.ts`** — `createDynamicTrigger`: trigger id를 per-instance로 생성 (e.g. `${baseId}--${itemId}`)
2. **`packages/os-react/src/6-project/trigger/TriggerBase.tsx`** — `data-trigger-id`에 per-instance id 반영
3. **`packages/os-core/src/1-listen/_shared/senseMouse.ts`** — `senseClickTarget`: non-overlay trigger with `onActivate` callback -> dispatch directly
4. **`packages/os-react/src/1-listen/pointer/PointerListener.tsx`** — pointerup에 non-overlay trigger case 추가
5. **`packages/os-devtool/src/testing/simulate.ts`** — `simulateClick`: trigger callback 등록 경로 보강 (headless)
6. **`packages/os-devtool/src/testing/page.ts`** — `goto()`에서 trigger callback 등록

### Entropy Check
"새로운 유일한 패턴을 추가하는가?" -> No. 기존 overlay trigger 경로와 대칭적인 non-overlay 경로 추가.

### Design Smell 4 Questions
- 개체 증가? -> ClickTarget union에 `"simple-trigger"` type 1개 추가
- 내부 노출? -> No. 기존 ZoneRegistry.getItemCallback 재사용
- 동일 버그 타 경로? -> No. click이 유일한 미구현 경로 (keyboard는 이미 동작)
- API 확장? -> No. 기존 createTrigger API 그대로

## Red Test

`tests/headless/apps/todo/todo-trigger-click.test.ts` — 5 FAIL / 2 PASS (keyboard control)

## Resolution

(TBD)
