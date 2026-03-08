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
**Phase 2: Wrapper 전면 무효화** (plan: `notes/2026-0309-0100-[plan]-wrapper-elimination.md`)
- [ ] P1: `zone.overlay()` API 변경 — CompoundTriggerComponents → OverlayHandle { overlayId, trigger }
- [ ] P2: TriggerPortal → ModalPortal 독립 분리 (Trigger 의존 제거)
- [ ] P3: TriggerPopover → PopoverPortal 독립 분리 (Trigger 의존 제거)
- [ ] P4: TriggerDismiss 삭제 — dismiss를 bind({ triggers }) prop-getter로 대체
- [ ] P5: 소비자 마이그레이션 — layer-showcase (7파일) + todo + apg + builder
- [ ] P6: TriggerBase + OverlayContext + trigger/index.ts 삭제 + trigger test 갱신

## Done
**Phase 1: Simple Trigger Migration** ✅
- [x] T1~T8: prop-getter API 도입 + payload 지원 + 전 소비자 마이그레이션 완료

## Unresolved
- `<Item>`, `<Field>`도 prop-getter 방식으로 전환할 것인가 (추후 논의)

