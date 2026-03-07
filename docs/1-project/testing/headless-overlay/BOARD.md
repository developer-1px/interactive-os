# headless-overlay

## Context

Claim: Headless overlay lifecycle = zone 자동 등록 문제. OS 메커니즘(Escape/Tab/Enter)은 이미 동작. zone만 등록되면 전부 자동 해소.

Before → After:
- overlay 테스트에 `dispatch(OS_STACK_PUSH/POP)` + `setupZone()` + `@os-core` import 필요 → `page.click(trigger)` + `page.press("Escape")` 만으로 overlay 전체 생명주기 테스트 가능
- OS_OVERLAY_OPEN이 activeZoneId를 설정하지 않음 → 설정함 (overlay zone auto-activate)
- page.goto()가 overlay zone도 activeZoneId로 설정 → overlay zone은 등록만, 활성화 제외

Risks:
- Browser에서 OS_OVERLAY_OPEN activeZoneId 설정 + Zone.tsx FocusGroup 설정이 중복될 수 있음 (동일 값 → 무해 예상)
- page.goto()의 overlay zone 식별이 TriggerOverlayRegistry에 의존 — trigger 없는 overlay zone은 식별 불가

## Now

(empty — all tasks done)

## Done

- [x] T1: OS_OVERLAY_OPEN auto-activate — activeZoneId + focusedItemId 설정 ✅
- [x] T2: page.goto() overlay zone skip — 분석 결과 변경 불필요 (goto는 activeZoneId 미설정) ✅
- [x] T3: simulateClick overlay detection — trigger-zone awareness 추가 ✅
- [x] overlay-lifecycle.test.ts — 6 tests GREEN | tsc 0 | 398 APG pass | build OK ✅
- [x] T4: dialog.apg.test.ts rewrite — workaround 제거, Playwright subset only ✅
- [x] T5: dropdown-menu.apg.test.ts rewrite — workaround 제거, Playwright subset only ✅
- [x] T6: Regression — 397 APG pass, 583 total pass, 0 fail ✅

## Unresolved

(none)

## Ideas

- trigger 없이 직접 OS_OVERLAY_OPEN을 dispatch하는 overlay (rare case) — 현재 앱에 사례 없음. 필요 시 별도 프로젝트
