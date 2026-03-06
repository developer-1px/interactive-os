# Playwright Strict Subset — BOARD

> Created: 2026-03-06T17:41
> Domain: testing
> Goal: TestScript ONE format — Playwright strict subset API 확정 → 파일 존재만으로 vitest + TestBot 자동 등록

## Knowledge (from /discussion)

- K1. **API-First, Implementation-Later**: 인터페이스 먼저 확정, 컴파일 에러 허용, LLM 소급적용
- K2. **Playwright Strict Subset Rule**: run() 안의 모든 API는 Playwright에 반드시 존재해야 한다
- K3. **Test Layer Separation**: run() = Playwright subset (interaction), unit test = 제약 없음 (logic), infra = OS API 허용 (setup)

## Done

- [x] T1: types.ts — Page API 정리 (Playwright strict subset 확정) — tsc 0 | 1994 tests ✅
- [x] T2: types.ts — LocatorAssertions 정리 (비-Playwright 메서드 제거) — tsc 0 | 1994 tests ✅
- [x] T3: AppPage — dispatch/state를 AppPageInternal로 분리 — tsc 0 | 1994 tests ✅
- [x] T4: testbot-docs.ts §4 — document.querySelector 제거 — tsc 0 | 1994 tests ✅
- [x] T5: testbot-builder-arrow.ts — document.querySelector 제거 (§0 진단 삭제) — tsc 0 | 1994 tests ✅
- [x] T6: Auto-discovery manifest — dual-glob (eager metadata + lazy scripts) — tsc 0 | 1994 tests ✅

- [x] T7: TestScenario 타입 정의 — `{ zone, items, role, config?, initial?, scripts }` in scripts.ts — tsc 0 ✅
- [x] T8: testbot 파일 규약 확정 — `scenarios` export + `extractScenarios()` — tsc 0 ✅
- [x] T9: ID selector 통일 — `#id` 정규 형식. testbot 파일에 `#` prefix 소급 적용 — tsc 0 ✅
- [x] T10: testbot-docs.ts 마이그레이션 — scenarios export 추가. §4 cross-zone은 브라우저 TestBot 전용 — tsc 0 | 1995 tests ✅
- [x] T11: testbot-builder-arrow.ts 마이그레이션 — scenarios + `#id` 적용 — tsc 0 ✅
- [x] T12: auto-runner adapter 구현 — `runScenarios(scenarios)` in @os-devtool/testing — tsc 0 ✅
- [x] T13: 보일러플레이트 삭제 — docs-testbot.test.ts → 3줄. 187 files 0 fail | 1995 tests ✅

## Now

## Later

- [ ] T14: todo-interaction.test.ts → TestScript + unit test 분리
