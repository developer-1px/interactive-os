# layer-playground

## Context

Claim: `/playground/layers` route에 overlay type별 독립 showcase를 만들어 OS의 Layer + Trigger 시스템을 개밥먹기한다.

Before -> After: overlay 패턴이 APG showcase에 파편화 -> 전용 playground에서 overlay lifecycle을 체계적으로 시각 검증

Risks: tooltip(hover) headless 미지원으로 OS gap 노출 가능 (이것이 개밥먹기의 목적)

## Now
- [ ] T1: Scaffold - route 2개 + page shell (index.tsx)
- [ ] T2: Dialog showcase (modal, focus trap, Escape dismiss, focus restore)
- [ ] T3: AlertDialog showcase (confirm/cancel, backdrop click 무시)
- [ ] T4: Menu showcase (dropdown trigger, arrow nav, loop, outside click)
- [ ] T5: Popover showcase (generic non-modal, Tab pass-through)
- [ ] T6: Listbox Dropdown showcase (trigger + listbox popup selection)
- [ ] T7: Tooltip showcase (hover/focus trigger, OS gap 발견 예상)
- [ ] T8: Nested overlay showcase (Dialog->Dialog LIFO, focus restore chain)

## Done

## Unresolved
- tooltip hover trigger headless 지원 여부 (T7에서 확인)
- popover non-modal Tab 동작 정확성 (T5에서 확인)
- alertdialog Escape 차단 동작 (T3에서 확인)

## Ideas
- Inspector 연동: overlay stack 상태 실시간 시각화 패널
- TestBot 연동: layer-showcase 패턴을 자동 발견하여 headless 검증
