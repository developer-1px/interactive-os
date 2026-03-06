# /plan — locator-projection

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `page.ts:createAppPage` — 캐시 변수 | 없음 | `let _htmlCache: string \| null = null` 추가. 상태 변경 시 invalidate | Clear | — | tsc 0 | — |
| 2 | `page.ts:locator()` | `resolveElement(os, elementId)` 직접 호출. Component 무시 | Component !== null이면 `_htmlCache`에서 `id="elementId"` 존재 확인. 없으면 throw | Clear | →1 | +1 test | null guard로 Component 없는 기존 테스트 영향 없음 |
| 3 | `page.ts:query()` | Component null이면 빈 문자열 | Component null이면 throw | Clear | — | 기존 tests 유지 | — |
| 4 | `page.ts:html()` | 동일 | Component null이면 throw | Clear | — | 기존 tests 유지 | — |
| 5 | `page.ts` — invalidation | 없음 | `click()`, `press()`, `goto()`, `dispatch()` 후 `_htmlCache = null` | Clear | →1 | tsc 0 | — |
| 6 | 기존 Component 테스트 호환 | locator가 OS 상태만 참조 | id가 렌더에 존재해야 통과 | Clear | →2 | 기존 tests 유지 | 렌더에 id 없으면 깨짐 |

## 라우팅

승인 후 → /go (locator-projection) — Light 프로젝트, T1~T3 실행
