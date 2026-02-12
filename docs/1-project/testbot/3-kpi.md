# TestBot — KPI

## 성공 기준

| # | 지표 | 현재 값 | 목표 값 | 측정 방법 |
|---|------|---------|---------|-----------|
| 1 | **Todo E2E Pass Rate (TestBot)** | 12/12 (100%) | 12/12 유지 | `window.__TESTBOT__.summary()` |
| 2 | **Todo E2E Pass Rate (Playwright)** | 12/12 (100%) | 12/12 유지 | `npx playwright test e2e/todo/` |
| 3 | **전체 Playwright Pass Rate** | 75/75 (100%) | 100% 유지 | `npx playwright test --reporter=line` |
| 4 | **Playground Spec TestBot 커버리지** | 0/63 | 63/63 | 나머지 Playwright spec을 TestBot에서 실행 |
| 5 | **Shim API 커버리지** | 7/~20 핵심 API | 12+ API | `shim.ts` 내 구현된 Playwright API 수 |
| 6 | **tsc 에러** | 0 | 0 유지 | `npx tsc --noEmit` |

## 부차 지표

| # | 지표 | 설명 |
|---|------|------|
| A | Synthetic Event 폴리필 수 | 네이티브 동작 폴리필이 필요한 키/이벤트 목록 |
| B | 테스트 실행 시간 (TestBot) | `runAll()` 완료까지 걸리는 시간 |
| C | Shim 코드 크기 | `shim.ts` LOC — 복잡도 지표 |
