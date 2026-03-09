# zero-drift-proof

## Context

Claim: Zero Drift를 경험적으로 증명한다. 1 TestScript가 headless + E2E 양쪽에서 자동 실행되고, 결과 일치가 증거다.

Before → After:
- Before: headless만 CI 실행. E2E는 accordion 1개 proof-of-concept. todo는 수동 loop
- After: 모든 testbot → headless(commit) + E2E(push) 자동 실행. 결과 일치 = Zero Drift 증명

Risks:
- 31 FAIL이 E2E에서도 동일하게 실패하면 노이즈 (→ 별도 프로젝트에서 정리)
- builder는 headless 불가 (builderBlock seamless 미지원) → 면제

Knowledge:
- K1. 3-Engine = 2-Track: Machine(headless+E2E, CI) + Human(TestBot, 수동)
- K2. 게이트 배치: commit=headless 전수, push=headless+E2E 전수
- K3. testbot-todo.ts가 3-engine 공유 소스 기준. scripts/todo는 정리 대상

## Now

## Done
- [x] T1: todo-scripts.test.ts → runScenarios 전환 — 11 tests (10 PASS, 1 pre-existing FAIL §1f) ✅
- [x] T2: scripts/todo.ts 삭제 — tsc 0, 0 remaining imports ✅
- [x] T3: E2E spec: todo — tests/e2e/todo.spec.ts (scenarios → Playwright) ✅
- [x] T4: E2E spec: docs-viewer — tests/e2e/docs-viewer.spec.ts (scenarios → Playwright) ✅
- [x] T5: pre-push hook — .husky/pre-push (vitest + playwright) ✅

## Unresolved

## Ideas
- archive-gate: /archive 시 vitest stop hook으로 FAIL 0 강제 (5-backlog/archive-gate.md)
- extractScripts 버그: testbot-manifest에서 첫 번째 TestScript[]만 반환 → allScripts 누락 (browser TestBot)
