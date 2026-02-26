# sense-purity

## Context

Claim: sense 함수가 HTMLElement/Event 대신 순수 interface를 받도록 변환하여, 변환 로직을 vitest에서 테스트 가능하게 만든다.

Before → After:
- Before: `senseMouseDown(HTMLElement, Event) → MouseInput` — DOM 타입이 시그니처에 박혀 vitest 불가
- After: `senseMouseDown(MouseDownSense) → MouseInput` — 순수 객체로 vitest 테스트 가능

Risks:
- PointerListener 어댑터의 DOM 읽기 코드가 증가할 수 있음
- senseClick과 ClickInput의 중복/병합 판단 필요 (Plan에서 Clear로 해소 완료)

선례:
- `resolvePointer`의 `PointerInput` — 이미 이 패턴을 구현한 선례
- `resolveKeyboard`의 `KeyboardInput` — headless.ts에서 직접 조립하는 검증된 패턴
- backlog `2026-0218-1710-listener-sense-translate.md` — Hexagonal Architecture 원점 discussion

## Now

(없음 — 모든 태스크 완료)

## Done
- [x] T1(Meta): 워크플로우 갱신 — discussion.md Clear→/plan, plan.md 갈래 라우팅 추가 ✅
- [x] T2: handleSelectModeClick + seedCaretFromPoint → PointerListener 인라인 — tsc 0 | 58 tests ✅
- [x] T3: senseMouseDown → extractMouseInput(MouseDownSense) 순수화 — tsc 0 | +8 tests (66 total) | build OK ✅
- [x] T4: getDropPosition → extractDropPosition(DropSenseInput) 순수화 — tsc 0 | +5 tests (71 total) | build OK ✅
- [x] T5: senseClick + ClickSense 삭제. PointerListener에서 ClickInput 직접 조립 — tsc 0 | 71 tests ✅
- [x] T6: MouseListener.tsx 삭제 (310줄 dead code). tree.apg.ui.test.tsx → PointerListener 교체 — tsc 0 | 71 tests | build OK ✅
- [x] T7(Meta): 파이프라인 동사 법 제정 (rules.md) + resolve→extract rename — tsc 0 | 71 tests | build OK ✅

## Unresolved
- senseKeyboard는 변환 로직이 거의 없어 순수화 ROI 낮음 — 보류

## Ideas
- OG-007: senseKeyboard 순수화 (현재 ROI 낮음)
- OG-008: headless.ts에 simulateDrag 추가 (resolvePointer 파이프라인 경유)
