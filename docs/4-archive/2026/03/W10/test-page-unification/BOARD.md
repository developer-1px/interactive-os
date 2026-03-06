# test-page-unification

## Context

Claim (revised): App-level tests use defineApp+bind+createPage. OS kernel tests keep createOsPage for raw command dispatch. Two Page factories, but with clear separation of concerns.

Original claim "테스트 Page는 하나면 된다" was too aggressive — kernel tests that dispatch raw OS commands (OS_NAVIGATE, OS_FOCUS, OS_STACK_PUSH/POP) need the imperative API. The real win: all app-behavior tests now use the declarative path.

Before → After:
- Before: 2 Page factories used interchangeably. No clear separation.
- After: AppPage for app tests (defineApp+bind), OsPage for kernel tests (raw dispatch). Clear boundary.

Evidence:
- 22 app-level test files converted to defineApp+bind+createPage
- 24 files remain on createOsPage — all justified (kernel tests, blocked infra, pre-existing failures)
- 0 regressions: 925 tests pass, 11 pre-existing failures unchanged
- Infrastructure: page.ts goto enhanced (initial.selection, disallowEmpty/followFocus, aria-checked)
- Infrastructure: ZoneRegistry.clearAll() for test isolation

## Now

(all tasks complete)

## Done

- [x] T1: PoC — listbox.apg.test.ts → defineApp+bind+createPage — 40 tests PASS ✅
- [x] T2: APG bulk migration — 17/25 files converted, 8 blocked | 628 APG tests PASS ✅
  - Infra: page.ts goto enhanced (initial.selection, disallowEmpty/followFocus auto-select, aria-checked via inputmap)
  - Infra: ZoneRegistry.clearAll() for test isolation
- [x] T3: Integration + e2e migration — 5/21 files converted (tab-state, zone-initial-config, headless-autofocus, docs-dashboard-action, docs-viewer-action) | 925 tests PASS ✅
  - 16 remaining files excluded: 4 OS kernel, 3 kernel-scope, 4 devtool, 4 pre-existing failures, 1 OsPage-specific API
- [x] T4: OS command direct exposure — naturally resolved during T2/T3 ✅
- [x] T5: Revised — createOsPage retained for kernel tests. App/kernel boundary established. ✅
- [x] T6: setGrid dead code deleted — 0 callers, interface + implementation removed ✅

## Excluded from scope (24 files on createOsPage — justified)

| Category | Count | Reason |
|----------|-------|--------|
| APG blocked | 8 | Missing infra (setValueNow 5, setRects 1, zone() 1, UI .tsx 1) |
| OS kernel tests | 4 | focus, navigate, item-filter, stale-focus-recovery — raw command dispatch |
| Kernel-scope tests | 3 | docs-sidebar-state, docs-section-nav, docs-arrow-nav — kernel groups/middleware |
| Devtool tests | 4 | format-diagnostics, auto-diagnostics, os-page, pipeline-logging — test OsPage features |
| Pre-existing failures | 4 | dialog-focus-trap, force-deselect, when-router, esc-deselect — test-cleanup WP5/WP8 |
| OsPage-specific API | 1 | zone-e2e-headless — uses locator API |

## Unresolved

## Ideas
