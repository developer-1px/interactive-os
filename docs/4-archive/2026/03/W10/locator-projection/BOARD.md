# locator-projection

## Context

Claim: Component가 있으면 `locator()`가 렌더 결과에서 요소 존재를 검증해야 한다.

Before → After:
- Before: `locator()`는 항상 OS 상태(`resolveElement`)에서만 resolve. Component는 `query()`/`html()` 전용.
- After: Component가 있으면 `locator()` 호출 시 `renderToString(Component)` 결과에 해당 id가 존재하는지 먼저 확인. 없으면 에러.

Backing: Playwright 모델 — `page.locator("#foo")`는 렌더된 페이지에서 요소를 찾는다. 존재하지 않으면 실패.

Risks:
- `renderToString`이 매 locator 호출마다 실행되면 성능 부담. 캐싱 전략 필요.
- Vite virtual module 등으로 Component를 import할 수 없는 테스트가 존재 (e.g., DocsViewer).

## Now

(없음 — 모든 태스크 완료)

## Done
- [x] T1: Component 있을 때 locator()가 렌더 결과에서 element id 존재를 검증 — tsc 0 | +7 tests | build OK ✅
- [x] T3: renderToString 캐싱 — `_htmlCache` + `invalidateCache()` on goto/click/press/dispatch — T1과 동시 구현 ✅
- [x] T2: 기존 Component 테스트 호환 확인 — 26 files / 188 tests all pass, 0 regression ✅

## Unresolved

(없음 — DocsViewer Vite virtual module 이슈는 "Component required 전환" 프로젝트 범위로 이관)

## Ideas
- Component required 전환은 locator-projection 완료 후 별도 프로젝트로
- APG Tier 1 테스트를 UI 테스트로 흡수 통합
