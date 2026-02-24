# TestBot v2 — BOARD

## 🔴 Now

- [ ] **T8: BDD Visual Replay** ⬅️ Active
  - 아키텍처: todo-bdd.test.ts → vitest shim → 동기 실행 + snapshot 기록 → setPreview 재생
  - [x] Step 1: Vitest Shim — expect → @vitest/expect 업그레이드. describe/it/vi 유지.
  - [x] Step 2: Browser AppPage — 이중화 불필요! 같은 headless createPage()가 브라우저에서도 동작.
  - [x] Step 5: Inspector 통합 — BddReplayPanel, REPLAY 탭. 59/59 tests pass in browser.
  - [ ] Step 3: Replay Engine — snapshot 시퀀스 → setPreview() + 딜레이 ← 다음
  - [ ] Step 4: Replay UI — 가상 keyboard/mouse + dispatch/diff + pass/fail
  - Discussion: `discussions/2026-0221-1819-bdd-visual-replay.md`

## ✅ Done

- [x] **T1: Vitest Browser Mode 기반 구축** ✅
- [x] **T2: TestStep 타입 + Record Decorator** ✅
- [x] **T3: 데이터 브릿지 (TestBotReporter)** ✅
- [x] **T4+T5: TestBotV2Panel** ✅
- [x] **T7: Replay Engine (Preview Layer)** ✅

## 💡 Ideas

- T6: 레거시 정리 — test-shim.ts, vitest/index.ts (구 shim), TestDashboard, ReplayPanel(구)
- Inspector State Monitor 통합 — dispatch/diff 시각화 인프라 공유
- APG 패턴 시나리오 확장 (tree, grid, dialog, menu)
- Playwright E2E 동형 실행

## 📎 References

- Product Vision: `6-products/testbot/VISION.md`
- BDD Spec: `6-products/todo/spec/keyboard-and-mouse.md`
- BDD Test: `src/apps/todo/tests/integration/todo-bdd.test.ts`
