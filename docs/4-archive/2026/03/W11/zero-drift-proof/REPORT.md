## /divide Report — 1 TestScript → headless + E2E 자동 실행 (Zero Drift 증명)

### Problem Frame

| | 내용 |
|---|------|
| **Objective** | 매 testbot 스크립트가 headless + E2E 양쪽에서 자동 실행. commit=headless, push=headless+E2E. 결과 일치가 Zero Drift 경험적 증명 |
| **Constraints** | C1. TestScript ONE format 유지 / C2. builder headless 불가 (면제) / C3. E2E는 dev server 필요 / C4. 기존 pre-commit hook 유지 / C5. async/sync 호환 |
| **Variables** | V1. E2E auto-discovery = testbot manifest 기반 / V2. pre-push hook 신설 / V3. 31 FAIL 정리는 별도 프로젝트 |

### Backward Chain

| Depth | Subgoal | 판정 | Evidence |
|-------|---------|------|----------|
| 0 | 1 script → headless + E2E 자동 실행 | ❌ | — |
| 1 | A. 모든 testbot → headless runScenarios | ❌ | — |
| 2 | A1. runScenarios 함수 존재 | ✅ | `packages/os-devtool/src/testing/runScenarios.ts` |
| 2 | A2. docs → runScenarios | ✅ | `tests/headless/apps/docs-viewer/docs-scenarios.test.ts:19` |
| 2 | A3. todo → runScenarios | ❌ | `todo-scripts.test.ts` 수동 loop + 다른 스크립트 소스 |
| 2 | A4. builder → runScenarios | ⛔ | C2 면제 (builderBlock headless 불가) |
| 1 | B. 모든 testbot → E2E 자동 실행 | ❌ | — |
| 2 | B1. Playwright 설정 존재 | ✅ | `playwright.config.ts` |
| 2 | B2. TestScript.run async 호환 | ✅ | `scripts.ts:33` |
| 2 | B3. E2E auto-runner 존재 | ❌ | accordion 1개만. 자동 발견 없음 |
| 2 | B4. Vite alias → Playwright 해석 | ❓→✅ | tsconfig paths로 해결 예정 (S) |
| 2 | B5. route 기반 page.goto | ✅ | testbot-discovery 산출물 |
| 1 | C. CI 게이트 배치 | ❌ | — |
| 2 | C1. pre-commit = headless | ✅ | `.husky/pre-commit` |
| 2 | C2. pre-push = headless + E2E | ❌ | pre-push hook 미존재 |

### Work Packages

| WP | Subgoal | Chain | 크기 |
|----|---------|-------|------|
| 1 | A3. todo → runScenarios 전환 + scripts/todo 정리 | Goal ← A ← A3 | S |
| 2 | B4. Playwright 경로 해석 설정 | Goal ← B ← B4 | S |
| 3 | B3. E2E auto-runner (testbot → Playwright spec 자동 생성) | Goal ← B ← B3 | M |
| 4 | C2. pre-push hook (headless + E2E) | Goal ← C ← C2 | S |

### Residual Uncertainty

- (none)

### Discussion Knowledge

- K1. 3-Engine = 2-Track: Machine(headless+E2E, CI) + Human(TestBot, 수동)
- K2. 게이트 배치: commit=headless 전수, push=headless+E2E 전수, archive=전부
- testbot-todo.ts가 3-engine 공유 소스 기준. @os-devtool/testing/scripts/todo는 정리 대상
