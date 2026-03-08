# /plan — DynamicTrigger 제거: 함수 시그니처 통일

> Discussion Clear: DynamicTrigger가 `(focusId) => BaseCommand` 함수를 `() => preComputedCmd` thunk으로 붕괴시킴.
> DynamicTrigger를 제거하고, TriggerBase가 함수를 직접 받아 ZoneRegistry에 등록하도록 통일.
> K1: trigger의 `(focusId) => BaseCommand` 함수는 ZoneRegistry 등록까지 생존해야 한다.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `trigger.ts:createDynamicTrigger` | `export function createDynamicTrigger<P>(appId, factory, options?)` — factory(payload)로 BaseCommand 사전 계산 후 `<Trigger onActivate={cmd}>` 전달 | **삭제**. `DynamicTriggerProps` 타입도 삭제. `TriggerOptions`는 `createCompoundTrigger`가 사용하므로 유지 | Clear | — | tsc 0 | import 소비자 #2 |
| 2 | `index.ts:zone.trigger()` (L280-293) | `createDynamicTrigger(appId, onActivate as CommandFactory, { id })` 호출 → DynamicTrigger React 컴포넌트 반환 | 단순 React.FC 생성: `({ children }) => createElement(Trigger, { id, onActivate, children })`. `onActivate`는 원래 함수 `(focusId) => BaseCommand`를 그대로 전달. `payload` prop 제거 | Clear | →#1, →#3 | tsc 0, 기존 zone-trigger-api.test.ts 유지 | 반환 타입에서 `payload?` 제거 → 소비자 #6-#8 |
| 3 | `TriggerBase.tsx:TriggerProps.onActivate` (L45) | `onActivate?: T` where `T extends BaseCommand` — BaseCommand 타입 | `onActivate?: BaseCommand \| ((focusId: string) => BaseCommand)` — 함수도 수용 | Clear | — | tsc 0 | TriggerBase 소비자 전체 |
| 4 | `TriggerBase.tsx:useEffect` (L132-137) | `{ onActivate: () => onActivate }` — thunk으로 감싸 focusId 무시 | 타입 분기: `typeof onActivate === "function"` → 직접 등록 `{ onActivate }`, 아니면 `{ onActivate: () => onActivate }` (BaseCommand 하위호환) | Clear | →#3 | +1 test (repro test green) | — |
| 5 | `TriggerDismiss.tsx:useEffect` (L37-42) | `{ onActivate: () => onActivate }` — 동일 thunk 패턴 | Dismiss는 항상 `BaseCommand` (focusId 불필요). **변경 없음** — Dismiss의 onActivate는 항상 정적 커맨드 | Clear | — | 기존 동작 유지 | — |
| 6 | `TaskItem.tsx` (4곳) | `<TodoList.triggers.StartEdit payload={todo.id}>`, `MoveItemUp payload={todo.id}`, `MoveItemDown payload={todo.id}`, `DeleteTodo payload={todo.id}` | `payload` prop 제거: `<TodoList.triggers.DeleteTodo>` 등. 이미 `zone.trigger(id, (fid) => cmd({id: fid}))` 패턴이므로 focusId가 자동 전달됨 | Clear | →#2 | todo headless tests pass | 정상 동작 검증 필요 |
| 7 | `Sidebar.tsx` (1곳) | `<TodoSidebar.triggers.SelectCategory payload={category.id}>` | `payload` prop 제거 | Clear | →#2 | todo headless tests pass | — |
| 8 | `DocsViewer.tsx` (3곳) | `<SelectDocTrigger payload={path}>`, `<PrevDocTrigger payload={prevFile.path}>`, `<NextDocTrigger payload={nextFile.path}>` | `payload` prop 제거. 이미 `zone.trigger("docs-select", (fid) => selectDoc({id: fid}))` 패턴 | Clear | →#2 | tsc 0 | docs-viewer에 headless 테스트 없음 — 수동 확인 |
| 9 | `todo-delete-button-repro.test.ts` (기존 repro) | 4개 테스트. test 3-4는 ZoneRegistry 직접 조작으로 버그 시뮬레이션 | test 1-2 유지 (정상 동작 검증). test 3-4: 수정 후 동작 변경 반영 또는 제거 (thunk이 더 이상 발생하지 않으므로) | Clear | →#4 | vitest pass | — |

## MECE 점검

1. **CE**: #1(DynamicTrigger 삭제) + #2(zone.trigger 재구현) + #3-4(TriggerBase 함수 수용) + #6-8(소비자 payload 제거) + #9(테스트 정리) → 목표 달성 ✅
2. **ME**: 중복 없음 ✅
3. **No-op**: #5 = 변경 없음 확인 → 표에서 유지 (검증 목적) ✅

## 라우팅

승인 후 → `/project` (새 프로젝트: `os-core/remove-dynamic-trigger`, Light 규모)
