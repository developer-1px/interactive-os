# apg-test-fidelity

## Context

Claim: APG headless 테스트가 synthetic factory 대신 실제 showcase app config를 사용해야 headless ≡ browser가 보장된다.

Before → After:
- Before: 모든 headless 테스트가 `defineApp()` + `createZone()` + `bind()`를 테스트 내부에서 직접 구성
  → 테스트는 항상 통과하지만 실제 showcase의 bind config와 불일치
- After: showcase가 export하는 App + item data를 headless에서 import
  → headless 실패 = browser 실패 = 동일 갭 탐지

Risks:
- showcase의 defineApp이 모듈 사이드이펙트 → 테스트 격리 문제 가능
- showcase 코드가 os.getState() 등 직접 접근 사용 시 import만으로 에러 가능

Evidence (meter 선행 실험):
- synthetic factory: 6/6 pass
- actual MeterApp: 6/9 pass, 3 fail → 실제 OS 갭 발견
  - value.initial 미적용 (42가 아닌 0)
  - meter role에서 ArrowDown/Up navigation 미동작
- TestBot 결과와 동일한 실패 패턴 확인

## Now
- [ ] T1: 나머지 20개 APG headless 테스트를 실제 showcase app config로 전환
- [ ] T2: 전환 후 발견된 실패를 분류 (OS 버그 vs test-only 버그 vs config 누락)

## Done
- [x] T0: meter 선행 실험 — MeterApp import, 3 fail 발견 — tsc 0 new | 6 pass 3 fail ✅

## Unresolved
- showcase에 getItems가 없는 패턴에서 headless items 전달 방식 통일 필요
- value.initial이 headless createPage에서 적용되지 않는 근본 원인 미확인

## Ideas
- showcase마다 testConfig export 표준화 (app, items, zoneId)
- CI에서 headless 실패 = TestBot 실패 자동 대조 파이프라인
