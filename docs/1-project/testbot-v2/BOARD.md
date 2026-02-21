# TestBot v2 — BOARD

## 🔴 Now

- [ ] **T7: Replay Engine** [WIP]
  - 아키텍처: scenario → withRecording (snapshot 포함) → os.setPreview(snapshot) → 실제 앱이 렌더
  - `@kernel`: `setPreview(s)` / `clearPreview()` / `isPreviewing()` — 비파괴적 상태 오버레이
  - `withRecording`: 매 step마다 `kernel.state()` 스냅샷 캡쳐
  - `scenarios/listbox.ts` — 8개 시나리오 (setup + steps 분리)
  - `ReplayPanel.tsx` — 컨트롤 전용 (시각화는 실제 앱이 담당)
  - tsc ✅, 849 tests ✅
  - [x] Step 7: /naming — setPreview/clearPreview/isPreviewing
  - [x] Step 9: /solve — kernel preview layer + ReplayPanel
  - [ ] Step 15: /verify ← 다음
  - **남은 것**: 브라우저에서 Todo와 연동 동작 확인

## ✅ Done

- [x] **T1: Vitest Browser Mode 기반 구축** ✅
  - 73/74 파일 PASS, 832/832 테스트 PASS in Chromium
  - `npm run test:browser` 스크립트
- [x] **T2: TestStep 타입 + Record Decorator** ✅
  - TestStep 6종, withRecording() decorator, 8 unit tests
  - headless + browser 양쪽 검증
- [x] **T3: 데이터 브릿지 (TestBotReporter)** ✅
  - Vitest custom reporter → public/testbot-report.json
  - 75 파일, 840 테스트 구조화 JSON
- [x] **T4+T5: TestBotV2Panel** ✅
  - testbot-report.json 로드 + File→Suite→Test 계층 뷰
  - Pass/Fail 진행 바, 에러 표시, Reload 기능
  - Inspector TESTBOT 탭에 연결

## 💡 Ideas

- T6: 기존 Custom Shim 정리 — test-shim.ts, vitest/index.ts, createApgKernel.browser.ts 삭제
- DOM 교차 검증: attrs() 결과와 실제 DOM 비교
- Replay 시나리오 확장: tree, grid, dialog, menu 패턴

## 📎 References

- Product Vision: `6-products/testbot/VISION.md`
- Divide Report: `6-products/testbot/discussions/2026-0221-1340-testbot-v2-divide.md`
