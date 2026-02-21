# TestBot v2 — BOARD

## 🔴 Now

- [ ] **T2: TestStep 타입 + Record Decorator** — Complicated
  - TestStep 타입 정의
  - createTestOsKernel에 recording wrapper 추가
  - vitest custom reporter로 JSON 파일 출력
  - [ ] Step 9: /solve

## ✅ Done

- [x] **T1: Vitest Browser Mode 기반 구축** ✅
  - 73/74 파일 PASS, 832/832 테스트 PASS in Chromium

## 💡 Ideas

- T3: 데이터 브릿지 (vitest → Panel) — JSON 파일 방식 유력 (T2에서 reporter로 통합)
- T4: Replay Engine — 기존 CursorOverlay/StampOverlay 재사용
- T5: Panel 리뉴얼 — Suite/Test/Step 계층 탐색 + Replay 컨트롤
- T6: 기존 Custom Shim 정리 — test-shim.ts, vitest/index.ts 삭제

## 📎 References

- Product Vision: `6-products/testbot/VISION.md`
- Divide Report: `6-products/testbot/discussions/2026-0221-1340-testbot-v2-divide.md`
- Vision Discussion: `6-products/testbot/discussions/2026-0221-1322-testbot-v2-vision.md`
- Archive (v1): `4-archive/2026-02-testbot/`
