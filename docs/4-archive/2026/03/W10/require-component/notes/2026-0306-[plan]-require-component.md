# /plan — createPage Component 필수화

> 작성일: 2026-03-06
> 전제: /discussion Clear — Component를 createPage의 필수 인자로 승격

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `page.ts:createAppPage` | `Component?: FC` | `Component: FC` | Clear | — | tsc 0 | 모든 호출처 컴파일 에러 |
| 2 | `page.ts:createPage` | `Component?: FC` | `Component: FC` | Clear | ->1 | tsc 0 | 동상 |
| 3 | `page.ts:query()` | `if (!Component) throw` | guard 제거 (항상 존재) | Clear | ->1 | tsc 0 | — |
| 4 | `page.ts:html()` | `if (!Component) throw` | guard 제거 (항상 존재) | Clear | ->1 | tsc 0 | — |
| 5 | `types.ts:AppPage` | `query`/`html` 문서만 | 변경 없음 (이미 필수) | Clear | — | — | — |
| 6 | `createOsPage.ts:179` | `createPage(dummyApp)` | `createPage(dummyApp, () => null)` | Clear | ->1 | tsc 0 | — |
| 7 | `inspector.test.ts` (3곳) | `createPage(InspectorApp)` | `createPage(InspectorApp, UnifiedInspector)` | Clear | ->1 | 기존 3 tests 유지 | — |
| 8 | `docs-interaction.test.ts` (7곳) | `createPage(DocsApp)` | `createPage(DocsApp, DocsViewer)` | Clear | ->1 | 기존 tests 유지 | — |
| 9 | `docs-tab.test.ts` (1곳) | `createPage(DocsApp)` | `createPage(DocsApp, DocsViewer)` | Clear | ->1 | 기존 tests 유지 | — |
| 10 | `docs-history.test.ts` (1곳) | `createPage(DocsApp)` | `createPage(DocsApp, DocsViewer)` | Clear | ->1 | 기존 tests 유지 | — |
| 11 | `builder-e2e-headless.test.ts` | `createPage(BuilderApp)` | `createPage(BuilderApp, BuilderPage)` | Clear | ->1 | 기존 tests 유지 | — |
| 12 | `builder-headless-items.test.ts` | `createPage(BuilderApp)` | `createPage(BuilderApp, BuilderPage)` | Clear | ->1 | 기존 tests 유지 | — |
| 13 | `trigger-push-model.test.ts` | `createPage(BuilderApp)` | `createPage(BuilderApp, BuilderPage)` | Clear | ->1 | 기존 tests 유지 | — |
| 14 | `locale-dropdown.test.ts` | `createPage(BuilderApp)` | `createPage(BuilderApp, BuilderPage)` | Clear | ->1 | 기존 tests 유지 | — |
| 15 | `router-module.test.ts` (2곳) | `createPage(App)` | `createPage(App, () => null)` | Clear | ->1 | 기존 tests 유지 | — |
| 16 | APG 테스트 20파일 (~40곳) | `createPage(app)` | `createPage(app, () => null)` | Clear | ->1 | 기존 tests 유지 | 기계적 치환 |
| 17 | `headless-autofocus.test.ts` (3곳) | `createPage(app)` | `createPage(app, () => null)` | Clear | ->1 | 기존 tests 유지 | — |
| 18 | `zone-initial-config.test.ts` (3곳) | `createPage(app)` | `createPage(app, () => null)` | Clear | ->1 | 기존 tests 유지 | — |
| 19 | `tab-state.test.ts` (1곳) | `createPage(app)` | `createPage(app, () => null)` | Clear | ->1 | 기존 tests 유지 | — |
| 20 | `docs-viewer-action.test.ts` (1곳) | `createPage(app)` | `createPage(app, () => null)` | Clear | ->1 | 기존 tests 유지 | — |
| 21 | `docs-dashboard-action.test.ts` (1곳) | `createPage(app)` | `createPage(app, () => null)` | Clear | ->1 | 기존 tests 유지 | — |
| 22 | `disallow-empty-initial.test.ts` (5곳) | `createPage(app)` | `createPage(app, () => null)` | Clear | ->1 | 기존 tests 유지 | — |

## MECE 점검

1. **CE**: #1-2(시그니처) + #3-4(guard 제거) + #6-22(모든 호출처) = 목표 달성 ✅
2. **ME**: 중복 없음 ✅
3. **No-op**: #5 제거 (Before=After)

## 라우팅

승인 후 -> /go (기존 프로젝트: require-component) — Light 리팩토링, 전행 Clear
