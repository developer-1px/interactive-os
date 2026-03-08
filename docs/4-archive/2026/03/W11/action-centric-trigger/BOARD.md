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
(비어있음 — 모든 Now Done)

## Done
**Phase 2: Wrapper 전면 무효화** ✅
- [x] P1: `zone.overlay()` API 변경 — OverlayHandle { overlayId, trigger } — tsc 0 | +5 tests ✅
- [x] P2: TriggerPortal → ModalPortal 독립 분리 — tsc 0 ✅
- [x] P3: TriggerPopover → PopoverPortal 독립 분리 — tsc 0 ✅
- [x] P4: TriggerDismiss 삭제 — Dialog.Close가 ZoneRegistry + useZoneContext로 대체 ✅
- [x] P5: 소비자 마이그레이션 — layer-showcase + todo + apg + builder 전체 완료 ✅
- [x] P6: TriggerBase + OverlayContext + trigger/index.ts + trigger.ts 삭제 — -667 lines ✅

**Phase 1: Simple Trigger Migration** ✅
- [x] T1~T8: prop-getter API 도입 + payload 지원 + 전 소비자 마이그레이션 완료

## Unresolved
(없음 — Item/Field prop-getter 전환 문제는 `docs/5-backlog/os-gaps.md`로 이관)

