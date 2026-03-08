# action-centric-trigger

## Context
Trigger를 React 컴포넌트에서 prop-getter `(payload?: string) => data-attributes`로 전환한다.

핵심 원칙 (Discussion 2026-03-08 확정):
- Trigger는 선언(data)이지 컴포넌트(lifecycle)가 아니다
- Trigger(포인터)와 Focus(키보드)는 독립 축이다
- Trigger의 대상은 payload(optional string ID)로 결정된다. focusId가 아니다
- 1 trigger = 1 intent = 1 command. payload = who(대상), trigger name = what(행동)
- Trigger와 Overlay는 관심사가 다르다. 이 프로젝트에서 Overlay는 다루지 않는다

Before → After:
- Before: `<Trigger asChild><button /></Trigger>` 또는 `<button {...DeleteTodo()} />`
- After: `<button {...deleteTodo(todoId)} />` (payload가 `data-trigger-payload`로 DOM에 바인딩)

## Now
- [ ] T5: 기존 앱 코드(Todo, DocsViewer 등)에서 trigger 호출에 payload 추가

## Done
- [x] T1: `createFunctionTrigger` — prop-getter가 `data-trigger-payload` 반환 — +3 tests ✅
- [x] T4: Red 테스트 — payload 기반 trigger dispatch 검증 — 5/5 PASS ✅
- [x] T2: `senseClickTarget` — `data-trigger-payload` 읽기 + ClickTarget 타입 확장 — regression 0 ✅
- [x] T3: `PointerListener` — `payload ?? focusId` 전달 — regression 0 ✅

## Unresolved
- Overlay(Dialog/Menu/Popover) trigger를 어떻게 재설계할 것인가 (별도 프로젝트)
- `<Item>`, `<Field>`도 prop-getter 방식으로 전환할 것인가 (추후 논의)

