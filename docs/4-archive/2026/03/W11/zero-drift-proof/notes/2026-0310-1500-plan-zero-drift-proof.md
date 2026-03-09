# Task Map — zero-drift-proof

> 2026-03-10

## Goal

1 TestScript → headless + E2E 자동 실행. commit=headless, push=headless+E2E.

## Task Map

| # | Task | Before | After | 크기 | 의존 | 검증 |
|---|------|--------|-------|------|------|------|
| T1 | todo-scripts.test.ts → runScenarios 전환 | `todo-scripts.test.ts`: 수동 loop, `@os-devtool/testing/scripts/todo` import | `runScenarios(scenarios, TodoApp, TodoPage)` — testbot-todo.ts 기준 | S | — | vitest run todo-scripts 통과 |
| T2 | scripts/todo.ts 삭제 | `packages/os-devtool/src/testing/scripts/todo.ts`: 하드코딩 ID 레거시 | 삭제 + re-export 제거 | S | →T1 | tsc 0, 기존 tests 유지 |
| T3 | E2E spec: todo | E2E 없음 | `tests/e2e/todo.spec.ts` — testbot-todo scenarios → Playwright test | S | →T1 | playwright test todo 통과 |
| T4 | E2E spec: docs-viewer | E2E 없음 | `tests/e2e/docs-viewer.spec.ts` — testbot-docs scenarios → Playwright test | S | — | playwright test docs 통과 |
| T5 | pre-push hook 설정 | `.husky/pre-push` 없음 | pre-push: vitest + playwright test | S | →T3,T4 | git push 시 hook 실행 확인 |

## Excluded

- builder: headless 불가 (C2 면제)
- APG E2E: 31 FAIL 해소 후 별도 프로젝트
- extractScripts 버그 (browser TestBot only): Ideas에 기록
- Playwright path alias: 상대경로로 충분, 설정 불필요
