# layer-playground

## Context

Claim: `/playground/layers` route에 overlay type별 독립 showcase를 만들어 OS의 Layer + Trigger 시스템을 개밥먹기한다.

Before -> After: overlay 패턴이 APG showcase에 파편화 -> 전용 playground에서 overlay lifecycle을 체계적으로 시각 검증

Risks: tooltip(hover) headless 미지원으로 OS gap 노출 가능 (이것이 개밥먹기의 목적)

## Now
(all tasks done)
## Done
- [x] T1: Scaffold — tsc 0 | 3 files created
- [x] T2: Dialog — tsc 0 | +6 tests | overlay lifecycle verified
- [x] T3: AlertDialog — tsc 0 | +3 tests +1 todo | OS gap: Escape not blocked
- [x] T4: Menu — tsc 0 | +8 tests | arrow nav, loop, escape, ARIA
- [x] T5: Popover — tsc 0 | +4 tests | non-modal overlay
- [x] T6: Listbox Dropdown — tsc 0 | +6 tests | listbox popup selection
- [x] T7: Tooltip — 4 todo | OS gap: no headless hover simulation
- [x] T8: Nested — tsc 0 | +4 tests | LIFO escape chain + focus restore

## Unresolved
- tooltip hover trigger headless 지원 여부 (T7에서 확인)
- popover non-modal Tab 동작 정확성 (T5에서 확인)
- alertdialog Escape 차단 동작 (T3에서 확인)

## Ideas
- Inspector 연동: overlay stack 상태 실시간 시각화 패널
- TestBot 연동: layer-showcase 패턴을 자동 발견하여 headless 검증
