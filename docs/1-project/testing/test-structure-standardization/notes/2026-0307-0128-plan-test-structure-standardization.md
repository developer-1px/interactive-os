# Plan: 테스트 구조 표준화 (1-Root 5-Tier)

> Discussion Clear: 2026-03-07
> 전략: Headless 전환 가능 → 이동. 불가능 → 삭제. 커버리지는 다시 올린다.

---

## 변환 명세표

### Phase 1: 살리기 — tests/ 내 이미 올바른 것

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `tests/apg/*.apg.test.ts` (22개) | `tests/apg/` | 변경 없음 (유지) | Clear | — | 기존 테스트 PASS 유지 | 없음 |
| 2 | `tests/e2e/todo/*.spec.ts` (5개) | `tests/e2e/todo/` | `tests/e2e/todo/` (유지) | Clear | — | 기존 테스트 PASS 유지 | 없음 |
| 3 | `tests/e2e/builder-e2e/*.spec.ts` (2개) | `tests/e2e/builder-e2e/` | `tests/e2e/builder/` (rename) | Clear | — | 기존 테스트 PASS 유지 | 경로 변경 |

### Phase 2: 삭제 — src/__tests__/ 전체

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 4 | `src/apps/builder/__tests__/` (13개) | collocated `__tests__/unit/` | 삭제 | Clear | — | tsc 0 | 커버리지 감소 (재구축 예정) |
| 5 | `src/apps/builder/model/__tests__/` (1개) | collocated `__tests__/unit/` | 삭제 | Clear | — | tsc 0 | 〃 |
| 6 | `src/apps/todo/__tests__/` (1개) | collocated `__tests__/unit/` | 삭제 | Clear | — | tsc 0 | 〃 |
| 7 | `src/command-palette/__tests__/` (2 unit + 2 spec) | collocated | 삭제 | Clear | — | tsc 0 | 〃 |
| 8 | `src/docs-viewer/__tests__/` (10개) | collocated `__tests__/unit/` | 삭제 | Clear | — | tsc 0 | 〃 |
| 9 | `src/hooks/__tests__/` (1개) | collocated | 삭제 | Clear | — | tsc 0 | 〃 |
| 10 | `src/inspector/__tests__/` (2개) | collocated | 삭제 | Clear | — | tsc 0 | 〃 |
| 11 | `src/pages/apg-showcase/__tests__/` (4개) | collocated | 삭제 | Clear | — | tsc 0 | 〃 |
| 12 | `src/pages/focus-showcase/__tests__/e2e/focus-showcase.spec.ts` | Playwright E2E (1244줄) | 삭제 (focusScripts.ts로 headless 전환) | Clear | →15 | tsc 0 | focusScripts.ts 보존 확인 |
| 13 | `src/pages/focus-showcase/__tests__/AutofocusTest.tsx`, `FocusStackTest.tsx` | `__tests__/` 안 showcase 컴포넌트 | showcase 소스로 이동 (not tests) | Clear | — | build OK | 이것은 테스트가 아님 |
| 14 | `src/__tests__/e2e/smoke.spec.ts` | `src/__tests__/e2e/` | `tests/e2e/smoke.spec.ts`로 이동 | Clear | — | Playwright PASS | 경로 변경 |
| 15 | `src/__tests__/e2e/apg-testbot.spec.ts` | `src/__tests__/e2e/` | `tests/e2e/apg-testbot.spec.ts`로 이동 | Clear | — | Playwright PASS | 경로 변경 |
| 16 | `src/pages/__tests__/e2e/kernel-lab.spec.ts` | collocated spec | 삭제 | Clear | — | tsc 0 | 〃 |
| 17 | `src/pages/playground/__tests__/e2e/dialog.spec.ts` | collocated spec | 삭제 | Clear | — | tsc 0 | 〃 |

### Phase 3: 삭제 — packages/__tests__/ (dispatch 기반)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 18 | `packages/os-core/src/4-command/__tests__/` (24개) | dispatch() 기반 커맨드 테스트 | 삭제 (headless 재작성 예정) | Clear | — | tsc 0 | 커버리지 감소 (재구축 예정) |
| 19 | `packages/os-core/src/1-listen/__tests__/` (1개) | dispatch 기반 | 삭제 | Clear | — | tsc 0 | 〃 |
| 20 | `packages/os-core/src/2-resolve/__tests__/` (1개) | dispatch 기반 | 삭제 | Clear | — | tsc 0 | 〃 |
| 21 | `packages/os-core/src/3-inject/__tests__/` (2개) | dispatch 기반 | 삭제 | Clear | — | tsc 0 | 〃 |
| 22 | `packages/os-core/src/engine/registries/__tests__/` (5개) | 순수 함수 + config | `tests/unit/os-core/registries/`로 이동 | Clear | — | 기존 PASS | import 경로 변경 |
| 23 | `packages/kernel/src/__tests__/` (2개) | kernel primitive 테스트 | 삭제 | Clear | — | tsc 0 | 〃 |
| 24 | `packages/os-react/src/**/__tests__/` (4개) | dispatch 기반 | 삭제 | Clear | — | tsc 0 | 〃 |
| 25 | `packages/os-sdk/src/**/__tests__/` (9개) | collection 기반 | 삭제 | Clear | — | tsc 0 | 〃 |
| 26 | `packages/os-devtool/src/testing/__tests__/` | 인프라 테스트 | 삭제 | Clear | — | tsc 0 | 〃 |

### Phase 4: 삭제 — tests/ 내 레거시

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 27 | `tests/integration/` (19개) | headless이지만 레거시 패턴 | 삭제 | Clear | — | tsc 0 | 커버리지 감소 |
| 28 | `tests/script/` (9개) | devtool 인프라 테스트 | 삭제 | Clear | — | tsc 0 | 〃 |
| 29 | `tests/e2e/builder/*.test.ts` (2개) | headless E2E 시뮬레이션 (.test.ts) | 삭제 | Clear | — | tsc 0 | 〃 |
| 30 | `tests/e2e/os-core/*.test.ts` (1개) | headless OS 테스트 | 삭제 | Clear | — | tsc 0 | 〃 |
| 31 | `tests/e2e/os-react/*.test.ts` (3개) | headless OS 테스트 | 삭제 | Clear | — | tsc 0 | 〃 |

### Phase 5: 신규 구조 스캐폴딩

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 32 | `tests/headless/` | 존재하지 않음 | 디렉토리 생성 (os/, apps/) | Clear | →27-31 | ls 확인 | 없음 |
| 33 | `tests/unit/` | 존재하지 않음 | 디렉토리 생성 (os-core/, os-sdk/, apps/) | Clear | →22 | ls 확인 | 없음 |
| 34 | `tests/infra/` | 존재하지 않음 | 디렉토리 생성 | Clear | →28 | ls 확인 | 없음 |
| 35 | `tests/headless/os/focus-lab.test.ts` | 없음 | focusScripts.ts → runScenarios headless 전환 | Clear | →12 | vitest PASS | focusScripts API 호환 |

### Phase 6: vitest config 정리

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 36 | `vitest.config.ts` | include: src/__tests__, packages/__tests__, tests/ | include: tests/**/*.test.ts | Clear | →전체 | vitest run PASS | config 근거 확인 필요 |
| 37 | `playwright.config.ts` | testDir 확인 | testDir: tests/e2e/ | Clear | →14,15 | Playwright PASS | config 근거 확인 필요 |

---

## MECE 점검

1. **CE**: Phase 1~6 실행 시 목표("1-Root 5-Tier, 소스에 테스트 없음") 달성? → ✅
2. **ME**: 중복 행? → #12와 #35가 쌍 (삭제+재생성). 중복 아님.
3. **No-op**: Before=After? → #1, #2 유지 행은 명시적 보존 확인용. 실행 비용 0.

---

## 실행 순서 (의존 순)

```
Phase 5 (스캐폴딩) → Phase 3 #22 (이동) → Phase 2 #14,15 (이동)
  → Phase 2 #13 (showcase 이동)
  → Phase 2 나머지 (삭제) → Phase 3 나머지 (삭제) → Phase 4 (삭제)
  → Phase 5 #35 (focus lab headless 전환)
  → Phase 3 #3 (rename)
  → Phase 6 (config 정리)
```

---

## 라우팅

승인 후 → `/go` (Meta 프로젝트: test-structure-standardization) — 코드 수정 + 삭제 + 구조 생성. Red/Green 스킵 (구조 변경이지 기능 변경이 아님).
