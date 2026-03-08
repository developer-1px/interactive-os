# lint-zero

## Context

Claim: Biome lint gate를 error 0으로 만든다 (82 errors + 1 schema mismatch -> 0).

Before -> After: `biome check` exit 1 (82 errors) -> exit 0 (0 errors)

Risks: useExhaustiveDependencies 수정 시 런타임 동작 변경 가능. ARIA role 수정 시 OS Zone 시맨틱과 충돌 가능.

## Now
- [ ] T1: biome migrate + temp.html 제외 (-51 errors)
- [ ] T2: anchor/alt a11y 수정 (-10 errors)
- [ ] T3: React hook deps 정리 (-9 errors)
- [ ] T4: JSX children + assign 표현식 (-8 errors)
- [ ] T5: ARIA role 정합성 (-5 errors)

## Done
- [x] T6: no-restricted-imports — @os-core 경계 강제 (eslint rule + 7 violations + stale doc) ✅

## Unresolved
- kernel createReactBindings의 getState/resolveQuery가 stable ref인지 확인 필요 (T3)
- OS Zone이 결정하는 role과 native element role 충돌 여부 (T5)

## Ideas
- warnings(1456개) 중 noNonNullAssertion(594), noExplicitAny(271) 점진적 정리
