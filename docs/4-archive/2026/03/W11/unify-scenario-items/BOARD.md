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

Risks:
- `getItems` binding이 없는 zone은 projection fallback이 필요 — `syncProjectionToRegistry()`가 이미 해결
- testbot 파일 전수 수정 필요 — `scenario.getItems` 사용처 전체 grep

## Now

## Done
- [x] T1: runScenarios에서 scenario.getItems 대신 getZoneItems(script.zone) 사용 — tsc 0 | +component param for projection ✅
- [x] T2: testbot-docs.ts에서 getSidebarItems/getFavItems/수동 getItems 제거 — docsUtils import 5개 제거 ✅
- [x] T3: testbot-todo.ts에서 LIST_ITEMS/SIDEBAR_ITEMS 정적 items 제거 — scripts 전환 to items param, 89 tests PASS ✅
- [x] T4: testbot-builder-arrow.ts에서 CANVAS_ITEMS 정적 items 제거 — 15줄 삭제 ✅
- [x] T5: TestScenario 타입에서 items/getItems 필드 제거 — scripts.ts 4줄 삭제, tsc 0 ✅

## Unresolved
- docs-viewer 5 FAIL (§1d, §1f, §4a sidebar + §2e, §4c recent): cross-zone item ID overlap — 동일 ID가 sidebar/favorites 양쪽에 존재하여 navigation이 zone을 넘어감. browser TestBot도 동일 증상 (§1f, §1h). 이는 items 경로 문제가 아니라 app-level zone 설계 이슈.
- docsUtils vi.mock이 docs-scenarios.test.ts에 필요 — import.meta.glob 대체. __mocks__/docsUtils.ts로 추출하여 공유.

## Ideas
- TestScenario를 { zone, role, scripts } 최소 구조로 슬림화 → 완료 (T5)
- docs-viewer zones에서 item ID 중복 해소 (zoneItemId prefix 적용)
