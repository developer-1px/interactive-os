# unified-pointer-listener

## Context

Claim: MouseListener + DragListener를 단일 PointerListener로 통합한다 (Gesture Recognizer 패턴).

Before → After:
- Before: MouseListener(`mousedown`/`click` 310줄) + DragListener(`pointer*` 146줄) = 2개 Listener, 같은 물리 제스처를 경쟁 처리
- After: PointerListener(단일) — pointerdown→pointermove→pointerup, threshold로 CLICK/DRAG 분기

Risks:
- MouseListener 310줄의 모든 edge case(label, zone-only click, caret seeding, EDIT→EDIT 전이) 1:1 이식 필요
- FocusListener와의 `dispatching` 플래그 동기화 재설계
- 기존 테스트 regression

## Now
(없음 — 모든 태스크 완료)

## Done
- [x] T1: PointerListener Sense/Translate 설계 — spec.md 작성 (19 BDD Scenarios, 4-state FSM, 파일 구조 설계) ✅
- [x] T2: resolvePointer 순수함수 — tsc 0 | +13 tests | build OK ✅
- [x] T3+T4: PointerListener 어댑터 + Root.tsx 교체 — tsc 0 | 58 listener tests PASS | MouseListener+DragListener → PointerListener | build OK ✅
- [x] T5: DnD 검증 — 브라우저 E2E smoke: 클릭(포커스/셀렉션) ✅ + 드래그(리오더) ✅ + drag-handle 감지 ✅ + drop indicator ✅
- [x] T6: /refactor — sense 함수 shared/senseMouse.ts 추출. PointerListener 449줄→198줄 (−56%). tsc 0 | 58 tests PASS | build OK ✅

## Unresolved
- InputListener는 이번 스코프 밖 (다른 물리 입력)

## Ideas
- OG-004: PointerListener 완성 후, zone config 기반 `data-drag-handle` 자동 주입을 별도 프로젝트로
- OG-005: 커서 메타 API도 별도 프로젝트로
- OG-006: headless.ts에 `simulateDrag(from, to, position)` 추가 — Playwright `dragTo` 등가물, resolvePointer 파이프라인 경유
