# BOARD — APG Contract Testing

## 🟢 Complete
Layer A (Widget Contract) 완료. 58 APG tests across 4 patterns. All green.

## ⏳ Done
- [x] Discussion: 테스트 전략 재정립 (2026-02-20)
- [x] **T1: Listbox APG Contract** — 26 tests
- [x] **T2: Dialog APG Contract** — 9 tests (focus trap, escape, focus restore)
- [x] **T3: Grid APG Contract** — 14 tests (4-directional spatial nav, boundary, Home/End)
- [x] **T4: Toolbar APG Contract** — 9 tests (horizontal roving, loop, Tab escape, Home/End)
- [x] **Pruning** — `navigate.test.ts` (296L) + `select.test.ts` (46L) deleted
- [x] **Retrospect** — KPT 회고 완료

## 💡 Ideas (→ Layer B/C)
- Layer B: Capability Regression Tests (delete→focus recovery, tab→selection)
- Layer C: App Integration Tests (Todo, Builder)
- Tree APG (OS에 treeview 공식 지원 시)
