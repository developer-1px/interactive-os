# BOARD — APG Testing Rebalance (Testing Trophy 전략)

## 🔴 Now

(없음 — 현재 라운드 완료)

## ⏳ Done
- [x] **Analysis**: `/doubt` 기반 테스트 스위트 분석 (2026-02-20)
- [x] **Infrastructure: KernelTestKit** — createTestOsKernel.ts (pressKey, click, attrs 포함)
- [x] **Migration: Delete/Focus** — deletion-focus.test.ts
- [x] **Strategy: 2-Tier 설계** — `/discussion` + `/solve` (2026-02-21)
- [x] **T1: APG Contract 업그레이드** — 8개 APG 테스트 pressKey + attrs 전환 ✅
- [x] **T2 재평가** — 19개 분석 → 대부분 단일 리듀서 Unit. 이동 불필요 확인 (2026-02-21)
- [x] **T3: 중복 유닛 제거** — 4개 파일 제거 ✅ (2026-02-21)
  - [x] delete.test.ts (37L) — deletion-focus.test.ts + multi-select-commands에 커버
  - [x] activate.test.ts (30L) — APG tree + zone-cursor에 커버
  - [x] check.test.ts (37L) — APG tree + zone-cursor + resolveKeyboard에 커버
  - [x] sync-focus.test.ts (95L) — focus.test.ts(Integration)에 커버

## 📊 Results

| Metric | Before | After | 변화 |
|--------|:------:|:-----:|:----:|
| Total files | 92 | 88 | -4 |
| Total tests | 811 | 801 | -10 |
| Unit files | 54 (59%) | 50 (56%) | -4 |
| APG quality | dispatch-based | pressKey → attrs | ↑ Tier 1 |
| Integration | 8 (9%) | 8 (9%) | 유지 |
| E2E | 22 (24%) | 22 (25%) | 유지 |

## 💡 Future Ideas
- property-based testing (fast-check) for navigation logic?
- APG shared contract functions (`assertVerticalNav` 등) 확장
- 신규 Integration: field-editing, clipboard-orchestration (실제 갭 발견 시)
