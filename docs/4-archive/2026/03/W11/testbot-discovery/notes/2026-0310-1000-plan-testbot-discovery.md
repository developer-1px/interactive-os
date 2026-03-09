# /plan — testbot-discovery Task Map

> 작성일: 2026-03-10

## Task Map

| # | Task | Before | After | 크기 | 의존 | 검증 |
|---|------|--------|-------|------|------|------|
| T1 | ManifestEntry에 `route?` 필드 추가 + buildAutoEntries에서 추출 | `ManifestEntry = {zones, group, load}` | `ManifestEntry = {zones, group, route?, load}`. `buildAutoEntries`가 `meta.route` 읽음 | S | — | tsc 0 |
| T2 | testbot 3파일에 `export const route` 추가 | route export 없음 | todo=`/todo`, docs=`/docs`, builder=`/builder` | S | — | tsc 0 |
| T3 | TestBotRegistry route 필터링 추가 | zone match only (`onZoneChange`) | `initZoneReactive(manifest, getCurrentRoute?)` — route match 우선, zone fallback | M | →T1 | tsc 0 + 기존 testbot-panel 6 tests 유지 |
| T4 | TestBotPanel에서 route getter 연결 | `initZoneReactive(TESTBOT_MANIFEST)` | `initZoneReactive(TESTBOT_MANIFEST, () => router.state.location.pathname)` | S | →T3 | tsc 0 |
| T5 | 전체 vitest regression 검증 | — | — | S | →T4 | 기존 전체 테스트 PASS 유지 |

## 현재 상태 분석

- **zone-reactive 자동 발견**: `testbot-manifest.ts` (import.meta.glob) + `TestBotRegistry.initZoneReactive()` → 이미 동작
- **route export**: 0개 (어떤 testbot에도 없음)
- **vitest runner**: docs만 runScenarios 사용, todo는 수동 loop, builder는 없음 (headless 미지원)
- **route 매핑**: todo=`/todo`, docs=`/docs`, builder=`/builder`, APG=`/playground/apg`

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/testing/testbot-manifest.ts` | glob 발견 + ManifestEntry 생성 |
| `packages/os-devtool/src/testing/TestBotRegistry.ts` | zone-reactive 필터링 + script snapshot |
| `src/inspector/panels/TestBotPanel.tsx` | UI + initZoneReactive 호출 |
| `src/apps/todo/testbot-todo.ts` | todo testbot (zones, group, scenarios) |
| `src/docs-viewer/testbot-docs.ts` | docs testbot |
| `src/apps/builder/testbot-builder-arrow.ts` | builder testbot |
