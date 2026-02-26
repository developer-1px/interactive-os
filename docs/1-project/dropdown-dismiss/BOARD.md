# dropdown-dismiss

> **Type**: App (Builder) + OS (headless 파이프라인 수정)
> **Origin**: OG-001 해결

## Context

Claim: Trigger의 overlay open이 React onClick에 의존 → headless에서 안 됨 (설계미스). onActivate로 이전 + simulateClick zone 무관 탐색.

## Now
(T4 Green 완료 — /verify 대기)

## Done
- [x] T1a: resolveOutsideClick — tsc 0 | +3 tests ✅
- [x] T1b: PointerListener outsideClick — tsc 0 ✅
- [x] T2: locale 커맨드 삭제 — tsc 0 ✅
- [~] T3-headless: ⚠️ 거짓 GREEN — 이전 세션 발견
- [~] T3-bind: 브라우저 미검증
- [x] T4: 통합 테스트 + OS수정 — tsc 0 | +3 tests | regression 0 ✅
  - Trigger.tsx: onActivate로 overlay open 이전
  - headless.ts: simulateClick zone 무관 탐색 (findZoneByItemId + findItemCallback)
  - headless.ts: overlay focus trap 수정 (overlay 내 zone은 keyboard 허용)
  - ZoneRegistry: findZoneByItemId, findItemCallback 추가

## Unresolved
- FocusItem.id 전역 유일성 경고 미구현 (discussion 결론; 별도 task)
- Trigger.Portal이 `<dialog>` 모달 → dropdown 위치 문제 (원래 OG-001 잔여)
