# testbot-zift

## Context

Claim: TestBot panel을 ZIFT(accordion+toolbar)로 재구성하면 headless 검증 가능 + OS bootstrapping 마일스톤 달성.

Before -> After: React useState/onClick 기반 TestBotPanel.tsx -> ZIFT Zone/Item/Trigger 기반 TestBotPanelV2.tsx (기존 보존, 병렬 비교)

Risks: Inspector 내 ZIFT Zone과 App Zone 공존 여부 미검증 (OS gap 후보). 동적 getItems(kernel state 의존) 검증 필요.

## Now

## Done
- [x] T1: zones.ts — accordion(suites) + toolbar(actions) Zone 정의 — tsc 0
- [x] T2: TestBotPanelV2.tsx — 기존 복사 후 ZIFT 재구성 — tsc 0
- [x] T3: register.ts — V2 패널 추가 등록 (기존 유지) — tsc 0
- [x] T4: headless test — accordion 접기/펴기 + toolbar 클릭 검증 — tsc 0 | +6 tests | build OK

## Unresolved
- Toolbar onAction 연결 (T1, T2 todo tests)
- Inspector 내 ZIFT Zone이 브라우저에서 동작하는가? (headless 통과, 브라우저 미확인)

## Ideas
- TestBot이 자기 자신을 테스트하는 meta-test (재귀 bootstrapping)
