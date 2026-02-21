# TestBot v2 — BOARD

## 🔴 Now

- [x] **T1: Vitest Browser Mode 기반 구축** — Complicated ✅
  - @vitest/browser + @vitest/browser-playwright 설치 ✅
  - vitest.browser.config.ts 생성 (Vitest 4.0 factory provider) ✅
  - `npm run test:browser` 스크립트 추가 ✅
  - 결과: **73/74 파일 PASS, 832/832 테스트 PASS**
  - 1 실패: `builder-canvas-clipboard.test.ts` (navigator.clipboard read-only in real browser — JSDOM 전용 mock)
  - [x] Step 9: /solve ✅

## ✅ Done

(없음)

## 💡 Ideas

- T2: TestStep 타입 + Record Decorator — pressKey/click/attrs 기록 레이어
- T3: 데이터 브릿지 (vitest → Panel) — JSON 파일 방식 유력 (Complex, 결정 보류)
- T4: Replay Engine — 기존 CursorOverlay/StampOverlay 재사용
- T5: Panel 리뉴얼 — Suite/Test/Step 계층 탐색 + Replay 컨트롤
- T6: 기존 Custom Shim 정리 — test-shim.ts, vitest/index.ts 삭제

## 📎 References

- Product Vision: `6-products/testbot/VISION.md`
- Divide Report: `6-products/testbot/discussions/2026-0221-1340-testbot-v2-divide.md`
- Vision Discussion: `6-products/testbot/discussions/2026-0221-1322-testbot-v2-vision.md`
- Archive (v1): `4-archive/2026-02-testbot/`
