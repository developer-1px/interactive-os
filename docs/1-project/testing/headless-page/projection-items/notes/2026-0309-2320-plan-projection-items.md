# Task Map: projection-items

> Created: 2026-03-09 23:20

## Goal
projection mode에서 renderToString → HTML parse → `[data-item]` 추출 = getItems truth

## Task Map

| # | Task | Before | After | 크기 | 의존 | 검증 |
|---|------|--------|-------|------|------|------|
| T1 | page.ts에 `parseProjectionItems()` 함수 추가 | `renderHtml()` 결과를 string으로만 사용 (`html.includes` 체크) | `renderHtml() → createElement+innerHTML → querySelectorAll("[data-zone]")` 내부의 `[data-item]` id를 zone별 `Map<zoneId, string[]>`로 추출. jsdom 환경이므로 새 의존성 불필요 | S | — | tsc 0 |
| T2 | `dom-items` context를 projection 결과로 교체 | `page.ts:180-191` — `entry.getItems()` 호출 | Component 있으면 `parseProjectionItems().get(activeZoneId)` 사용, 없으면 기존 getItems fallback | S | →T1 | tsc 0 |
| T3 | `dom-zone-order` context를 projection 결과로 교체 | `page.ts:210-237` — `zoneEntry.getItems?.()` 호출 | Component 있으면 projection 결과에서 zone별 items 도출, 없으면 기존 fallback | S | →T1 | tsc 0 |
| T4 | `assertElementInProjection` 개선 | `page.ts:555-563` — `html.includes(\`id="${elementId}"\`)` | DOM parse로 querySelector(`#id`) 사용 (정확한 매칭, 부분 문자열 오탐 제거) | S | →T1 | tsc 0 |
| T5 | regression 확인 + docs-viewer projection 테스트 추가 | docs-tab-cycle.test.ts는 headless-only | projection mode 테스트: `createHeadlessPage(DocsApp, DocsViewer)` — reader items가 실제 렌더링과 일치 검증 | M | →T2,T3 | vitest run 전체 pass |

## Key Insight
vitest는 jsdom 환경 → `document.createElement('div')` + `innerHTML` 사용 가능.
happy-dom/linkedom 별도 설치 불필요. **Unresolved 해소됨.**
