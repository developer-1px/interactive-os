# testbot-apg-fix

## Context

Claim: TestBot APG 6/23 FAIL은 4개 카테고리(앱 설정, 테스트 기대값, OS inputmap, SDK 속성 누락)에 분산된 개별 버그다.

Before → After:
- Accordion: initial expanded → initial collapsed
- Checkbox: Enter toggle 기대 → 제거 (APG=Space only)
- Menu: OS_OVERLAY_CLOSE가 모든 항목에 적용 → menuitem만 close
- Menu Button: trigger()에 id 없음 → id 추가
- Meter: focus nav 테스트 → value display 테스트
- Spinbutton: focus 시 9→50 점프 → 디버깅 후 수정

Risks: WP4(menu inputmap) 변경이 다른 menu 소비자에 영향 가능. WP8(spinbutton) 50 출처 미확인.

## Now

- [ ] T1: Accordion initial expand 제거 — AccordionPattern.tsx + accordion.apg.test.ts
- [ ] T2: Checkbox Enter 기대 제거 — checkbox.ts
- [ ] T3: Menu overlay close 분기 — roleRegistry.ts + MenuPattern.tsx
- [ ] T4: trigger() id 추가 — defineApp/index.ts + 기존 test 확장
- [ ] T5: Meter 시나리오 재작성 — meter.ts
- [ ] T6: Spinbutton 초기값 디버깅 — SpinbuttonPattern.tsx + seeding 경로

## Done

## Unresolved

- Spinbutton 9→50 출처: 코드에서 50 직접 발견 못함. 브라우저 환경 디버깅 필요.
- Menu inputmap에서 OS_OVERLAY_CLOSE 제거가 OS 수준 정책인지 앱 수준 정책인지 장기적 정리 필요.

## Ideas

- menu role에 per-item-role inputmap 지원 → 장기 아키텍처 개선
