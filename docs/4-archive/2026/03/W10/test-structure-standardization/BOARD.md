# test-structure-standardization

## Context

Claim: 테스트 파일은 `tests/`에만 존재한다. 1-Root 5-Tier (apg/headless/unit/infra/e2e). 예외 없음.

Before → After:
- Before: 6+ 유형이 `src/__tests__/`, `packages/__tests__/`, `tests/integration/`, `tests/script/`, `tests/e2e/`, `tests/apg/`에 혼재. 같은 성격의 테스트가 2~3곳에 분산. `.test.ts`와 `.spec.ts` 혼재.
- After: `tests/` 유일한 루트. `apg/`, `headless/`, `unit/`, `infra/`, `e2e/` 5계층. headless=`.test.ts`, E2E=`.spec.ts`, APG=`.apg.test.ts`. 소스 트리에 `__tests__/` 없음.

Risks:
- 커버리지 일시 감소 (~100개 삭제). `/coverage`로 재구축 필요.
- vitest/playwright config 변경 시 기존 CI 영향 가능.

## Now

## Done
- [x] T1: Phase 5 — 신규 구조 스캐폴딩 (headless/, unit/, infra/) ✅
- [x] T2: Phase 2 #14,15 — E2E spec 이동 (smoke.spec.ts, apg-testbot.spec.ts) ✅
- [x] T3: Phase 2 #13 — showcase 컴포넌트 이동 (이전 세션에서 완료) ✅
- [x] T4: Phase 3 #22 — registries 순수함수 테스트 이동 — 5 files, 86 tests PASS ✅
- [x] T5: Phase 2 #4~12,16,17 — src/__tests__/ 전체 삭제 (39 files) ✅
- [x] T6: Phase 3 #18~21,23~26 — packages/__tests__/ dispatch 기반 삭제 (13 dirs) ✅
- [x] T7: Phase 4 #27~31 — tests/ 내 레거시 삭제 (integration/, script/, headless E2E sim) ✅
- [x] T8: Phase 3 #3 — tests/e2e/builder-e2e/ → tests/e2e/builder/ rename ✅
- [x] T10: Phase 6 — vitest + playwright config 정리 — vitest 28 files 499 tests PASS ✅
- [x] T11: __tests__/ 디렉토리 전수 제거 확인 — 0 remaining (coverage cache cleared) ✅

## Unresolved
- [ ] T9: Phase 5 #35 — focus lab headless 전환 (blocked: cross-zone headless 미지원, OS gap)

## Ideas
- 커버리지 재구축: `/coverage` 워크플로우로 headless 테스트 채우기
- APG 테스트 fidelity 완성 (별도 프로젝트 bd02bf6a 진행 중)
