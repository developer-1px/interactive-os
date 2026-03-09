# unify-scenario-items

## Context

Claim: `scenario.getItems`는 pre-projection 레거시다. items 원천은 앱 binding의 getItems 하나여야 한다. testbot의 수동 getItems는 전부 제거.

Before → After:
- **Before**: headless `runScenarios`는 `scenario.getItems()` (정적, 테스트 전용), browser TestBot은 `ZoneRegistry.getItems()` (동적, 앱 binding). 두 경로가 다른 items를 반환하여 headless 19 PASS / browser 4 FAIL (§1f, §1h, §3a, §3b).
- **After**: headless `runScenarios`도 앱 binding의 `ZoneRegistry.getItems()`를 사용. `TestScenario.getItems`/`TestScenario.items` 필드 제거. testbot 파일에서 수동 `getSidebarItems()`, `getFavItems()` 등 전부 삭제. headless와 browser가 동일한 items로 동작.

Backing:
- projection-items 프로젝트에서 `syncProjectionToRegistry()` 완성 — projection이 ZoneRegistry에 items를 자동 주입
- docs-viewer-headless 프로젝트에서 DocsViewer headless 검증 가능 확인 (19/19 PASS)
- `/diagnose` 분석: 4 FAIL의 근본 원인 = items 해석 경로 이원화

Evidence:
- `packages/os-devtool/src/testing/runScenarios.ts:44` — `scenario.getItems?.() ?? scenario.items ?? []`
- `src/apps/testbot/app.ts:242` — `getZoneItems(script.zone)` → `ZoneRegistry.get(zoneId)?.getItems()`
- `src/docs-viewer/testbot-docs.ts:46-57` — 수동 `getSidebarItems()`, `getFavItems()`

Risks:
- `getItems` binding이 없는 zone은 projection fallback이 필요 — `syncProjectionToRegistry()`가 이미 해결
- testbot 파일 전수 수정 필요 — `scenario.getItems` 사용처 전체 grep

## Now
- [ ] T1: runScenarios에서 scenario.getItems 대신 getZoneItems(script.zone) 사용 — 크기: S, 의존: —
- [ ] T2: testbot-docs.ts에서 getSidebarItems/getFavItems/수동 getItems 제거 — 크기: S, 의존: →T1
- [ ] T3: testbot-todo.ts에서 LIST_ITEMS/SIDEBAR_ITEMS 정적 items 제거 — 크기: S, 의존: →T1
- [ ] T4: testbot-builder-arrow.ts에서 CANVAS_ITEMS 정적 items 제거 — 크기: S, 의존: →T1
- [ ] T5: TestScenario 타입에서 items/getItems 필드 제거 — 크기: S, 의존: →T2,T3,T4

## Done

## Unresolved
- runScenarios에서 ZoneRegistry.getItems를 쓰려면 page.goto() 이후 zone 등록이 완료된 상태여야 함 — 타이밍 확인 필요
- TestScenario 타입에서 getItems/items 필드를 제거하면 기존 testbot 파일 전부 수정 필요 — 영향 범위 파악

## Ideas
- TestScenario를 { zone, role, scripts } 최소 구조로 슬림화
- runScenarios가 scenario.zone 기반으로 page.goto(zone) 후 ZoneRegistry에서 items 자동 해석
