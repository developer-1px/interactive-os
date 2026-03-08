# lint-zero

## Context

Claim: Biome lint gate를 error 0으로 만든다 (82 errors + 1 schema mismatch -> 0).

Before -> After: `biome check` exit 1 (97 errors) -> exit 0 (0 errors) ✅

Risks: useExhaustiveDependencies 수정 시 런타임 동작 변경 가능. ARIA role 수정 시 OS Zone 시맨틱과 충돌 가능.

## Now

(없음)

## Done
- [x] T6: no-restricted-imports — @os-core 경계 강제 (eslint rule + 7 violations + stale doc) ✅
- [x] T1: biome format + organizeImports 자동 수정 (73 files, 97→2 errors) ✅
- [x] T2~T5: 잔여 2건 해소 — useExhaustiveDependencies(ZiftMonitor) + noInteractiveElementToNoninteractiveRole(LandmarksPattern) ✅

## Unresolved

(없음 — T3/T5 Unresolved 항목은 biome 오탐으로 판명, 별도 대응 불필요)

## Ideas
- warnings(929개) 중 noNonNullAssertion, noExplicitAny, noExcessiveCognitiveComplexity 점진적 정리
