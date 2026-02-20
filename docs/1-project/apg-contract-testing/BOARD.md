# BOARD — APG Contract Testing

## 🔴 Now
(empty — cycle complete)

## ⏳ Done
- [x] Discussion: 테스트 전략 재정립 (2026-02-20)
- [x] **T1: Listbox APG Contract** — 26 tests, all passed
- [x] **T2: Dialog APG Contract** — 9 tests (focus trap, escape, focus restore)
- [x] **Pruning** — `navigate.test.ts` (296L) + `select.test.ts` (46L) deleted. APG + integration이 대체.

## 💡 Ideas
- Grid APG Contract Test (2D navigation, cell selection)
- Tree APG Contract Test (expand/collapse, typeahead)
- Dialog APG Contract Test (focus trap, escape restore)
- Toolbar APG Contract Test (horizontal roving tabindex)
- Layer B: Capability Regression Tests (navigate, select, tab configs)
- Layer C: App Integration Tests (Todo, Builder)
