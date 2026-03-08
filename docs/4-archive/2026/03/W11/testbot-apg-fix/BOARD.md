# testbot-apg-fix

## Context

Claim: TestBot APG 6/23 FAIL은 4개 카테고리(앱 설정, 테스트 기대값, OS inputmap, SDK 속성 누락)에 분산된 개별 버그다.

Before → After:
- Accordion: initial expanded → initial collapsed
- Checkbox: Enter toggle 기대 → 제거 (APG=Space only)
- Menu: OS_OVERLAY_CLOSE가 모든 항목에 적용 → menuitem만 close
- Menu Button: trigger()에 id 없음 → id 추가
- Meter: focus nav 테스트 → value display 테스트
- Spinbutton: focus 시 9→50 점프 → PointerListener isSlider 체크 role 기반으로 수정

## Now

(All Done)

## Done

- [x] T1: Accordion initial expand 제거 — AccordionPattern.tsx `initial: []` + 17 tests PASS ✅
- [x] T2: Checkbox Enter 기대 제거 — checkbox.ts Enter 관련 6줄 삭제 ✅
- [x] T3: Menu overlay close 분기 — roleRegistry.ts inputmap OS_OVERLAY_CLOSE 제거 + MenuPattern.tsx onAction 분기 ✅
- [x] T4: trigger() id 추가 — defineApp/index.ts `id: triggerId` 추가 ✅
- [x] T5: Meter 시나리오 재작성 — meter.ts value display (aria-valuemin/max) ✅
- [x] T6: Spinbutton — PointerListener.tsx isSlider → role==="slider" 체크 추가 ✅
- [x] config-chain.test.ts 업데이트 — menu inputmap 변경 반영 ✅
- [x] /audit: 0건 (MenuPattern useState = 정당한 예외) ✅
- [x] /doubt: 전항목 🟢, 새 개념 도입 0 ✅

tsc 0 new | 689 tests passed | build OK ✅

## Unresolved

(없음)

## Ideas

- menu role에 per-item-role inputmap 지원 → 장기 아키텍처 개선
- Menu inputmap에서 OS_OVERLAY_CLOSE 제거가 OS 수준 정책인지 앱 수준 정책인지 정리
