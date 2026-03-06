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

## Now

- [ ] T4: testbot-docs.ts §4 — document.querySelector 제거 (Playwright 위반)
- [ ] T5: testbot-builder-arrow.ts — document.querySelector 제거
- [ ] T6: Auto-discovery manifest — glob import으로 수동 manifest 대체

## Later

- [ ] T7: Vitest auto-runner adapter
- [ ] T8: todo-interaction.test.ts → TestScript + unit test 분리
