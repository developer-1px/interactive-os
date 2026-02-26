# headless-purity

## Context

Claim: AutoFocus DOM fallback 제거 + Typeahead getLabels push model. headless 테스트 재현성 강화. Light.

Before → After:
- Before: AutoFocus는 getItems 없으면 rAF + querySelector fallback. Typeahead는 DOM textContent 의존.
- After: AutoFocus는 Phase 2에서 처리 (DOM-scanning getItems 등록 후 즉시 dispatch). Typeahead는 getLabels() accessor 우선 + DOM fallback 유지.

## Now

## Done
- [x] T4: FocusGroup Phase 2 — DOM-scanning getLabels 자동등록 — tsc 0 ✅
- [x] T3: typeaheadFallbackMiddleware — getLabels() 우선 사용, DOM fallback 유지 — tsc 0 ✅
- [x] T2: ZoneEntry에 getLabels 타입 추가 — tsc 0 ✅
- [x] T1: AutoFocus DOM fallback 제거 — useEffect 삭제, Phase 2로 통합, import cleanup — tsc 0 | regression 0 ✅

## Unresolved

## Ideas
