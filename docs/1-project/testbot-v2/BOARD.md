# TestBot v2 — BOARD

## 🔴 Now

- [ ] **T8: BDD Visual Replay** ⬅️ Active
  - 아키텍처: todo-bdd.test.ts → vitest shim → 동기 실행 + snapshot 기록 → setPreview 재생
  - Step 1: Vitest Shim — describe/it/expect/vi/beforeEach/afterEach 브라우저 구현
  - Step 2: Browser AppPage — createPage() 이중화 (headless: 현재, browser: snapshot 기록)
  - Step 3: Replay Engine — snapshot 시퀀스 → setPreview() + 딜레이
  - Step 4: Replay UI — 가상 keyboard/mouse + dispatch/diff + pass/fail
  - Step 5: Inspector 통합 — TESTBOT 탭에서 .test.ts 파일 선택 → 재생
  - 선행: os-page 완료 ✅, AppPage 네이밍 확정 ✅
  - Discussion: `discussions/2026-0221-1819-bdd-visual-replay.md`

## ✅ Done

- [x] **T1: Vitest Browser Mode 기반 구축** ✅
  - 73/74 파일 PASS, 832/832 테스트 PASS in Chromium
- [x] **T2: TestStep 타입 + Record Decorator** ✅
  - TestStep 6종, withRecording() decorator, 8 unit tests
- [x] **T3: 데이터 브릿지 (TestBotReporter)** ✅
  - Vitest custom reporter → public/testbot-report.json
- [x] **T4+T5: TestBotV2Panel** ✅
  - File→Suite→Test 계층 뷰, Pass/Fail 진행 바
- [x] **T7: Replay Engine (Preview Layer)** ✅
  - setPreview/clearPreview/isPreviewing on kernel
  - withRecording snapshot 캡처
  - ReplayPanel.tsx 컨트롤

## 💡 Ideas

- T6: 기존 Custom Shim 정리 — test-shim.ts, vitest/index.ts, createApgKernel.browser.ts 삭제
- Inspector State Monitor 통합 — dispatch/diff 시각화 인프라 공유
- APG 패턴 시나리오 확장 (tree, grid, dialog, menu)
- Playwright E2E 동형 실행

## 📎 References

- Product Vision: `6-products/testbot/VISION.md`
- os-page Discussion: `1-project/os-page/`
- BDD Spec: `6-products/todo/spec/keyboard-and-mouse.md`
