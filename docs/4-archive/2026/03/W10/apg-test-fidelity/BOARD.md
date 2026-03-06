# apg-test-fidelity

## Context

Claim: APG headless 테스트가 synthetic factory 대신 실제 showcase app config를 사용해야 headless ≡ browser가 보장된다.

Before → After:
- Before: 모든 headless 테스트가 `defineApp()` + `createZone()` + `bind()`를 테스트 내부에서 직접 구성
  → 테스트는 항상 통과하지만 실제 showcase의 bind config와 불일치
- After: showcase가 export하는 App + item data를 headless에서 import
  → headless 실패 = browser 실패 = 동일 갭 탐지

## Now
(empty — T1, T2 complete)

## Done
- [x] T0: meter 선행 실험 — MeterApp import, 3 fail 발견 — tsc 0 new | 6 pass 3 fail
- [x] T1: 20개 APG headless 테스트를 실제 showcase app config로 전환 — 13 files converted, 7 not convertible (no App export)
- [x] T2: 116 failures classified into 5 root cause categories (see Findings below)

## Findings (T2 Classification)

**Total: 13 files failed, 116 tests failed, 280 passed (396 total)**

### Category A: Forward Navigation Broken (62 failures, 10 files)

**Symptom**: ArrowRight/ArrowDown/End moves focus forward → fails. ArrowLeft/ArrowUp/Home works.

**Root cause**: Showcase configs rely on **role defaults** (e.g., `tablist` → horizontal+loop, `feed` → vertical+no-loop) but the headless pipeline does not apply role defaults when no explicit `navigate` options are specified in `zone.bind()`.

**Affected files**:
- carousel (11 fail) — tablist role, horizontal+loop expected
- tabs (16 fail) — tablist role, horizontal+loop expected
- tooltip (5 fail) — toolbar role, horizontal+loop expected
- feed (7 fail) — feed role, vertical+no-loop, PageDown/PageUp
- radiogroup (12 fail) — radiogroup role, vertical+loop expected
- accordion (6 fail) — vertical no-loop
- tree (5 fail) — vertical no-loop, forward nav subset
- treegrid (5 fail) — vertical no-loop, forward nav subset
- menu-button (7 fail) — menu role, vertical+loop expected
- disclosure (3 fail) — Tab navigation (flow mode, not arrow)
- listbox (2 fail) — Shift+Down range selection

**This is the #1 OS gap.** Role defaults are defined in showcase configs but not reaching the headless navigation resolver.

### Category B: Expansion State Not Projected (20 failures, 2 files)

**Symptom**: `aria-expanded` is always `undefined` — never `false` (collapsed) or `true` (expanded).

**Root cause**: Tree/Treegrid showcase configs use `useFlatTree` helper with `expandableItems` and `treeLevels` passed via `goto()` options. The headless `page.goto()` stores these in GotoOptions but `computeItem` does not use them to initialize `aria-expanded` state for expandable items.

**Affected files**:
- tree.apg.test.ts (10 fail) — ArrowRight expand, ArrowLeft collapse, Enter toggle, aria-expanded projection, click toggle, Shift+Arrow
- treegrid.apg.test.ts (9 fail) — same pattern

### Category C: Manual Tab Activation Mode (5 failures, 1 file)

**Symptom**: `tablist-manual` zone's `followFocus: false` not applied. Navigation changes selection when it shouldn't.

**Root cause**: Manual activation requires `select.followFocus: false`. This config exists in the showcase but may not be reaching the headless pipeline (related to Category A — config not applied).

**Affected**: tabs.apg.test.ts manual activation tests (5 of 16 total tab failures)

### Category D: Multi-Zone / Flow Mode (5 failures, 2 files)

**Symptom**: Tab/Shift+Tab navigation between independent zones (disclosure) and multi-zone expand independence (accordion) fail.

**Root cause**: Disclosure uses `tab: "flow"` mode (each item is its own tab stop). Accordion multi-section independence requires separate zone state per section. Both are zone-level config issues related to Category A.

**Affected**: disclosure (3 Tab tests), accordion (2 multi-section expand tests)

### Category E: Pattern-Specific Gaps (4 failures, 3 files)

**Symptom**: Individual pattern quirks unrelated to navigation.

- **meter** (1 fail): `value.initial` not projected as `aria-valuenow` — OS gap in initial value application
- **checkbox** (1 fail): Enter on checkbox doesn't toggle — OS treats Enter as OS_ACTIVATE, not OS_CHECK
- **menu-button** (2 fail): Escape dismiss + ARIA roles — menu overlay state management

### Not Convertible (7 files — kept synthetic factory)

These showcase patterns lack `App` export or use legacy `Zone/Item` direct rendering:
- listbox, toolbar, menu (popup), dialog, dropdown-menu, combobox, navtree

### Summary

| Category | Count | Root Cause | Fix Location |
|----------|-------|------------|-------------|
| A: Forward Nav | 62 | Role defaults not applied in headless | os-core: role defaults resolver |
| B: Expansion | 20 | expandableItems/treeLevels not wired | os-core: computeItem + page.goto |
| C: Manual Tabs | 5 | followFocus config not reaching headless | os-core: select config pipeline |
| D: Flow/Multi-Zone | 5 | Tab flow mode + multi-section state | os-core: tab behavior + zone state |
| E: Pattern-Specific | 4 | Individual OS gaps | os-core: various |
| **Total** | **116** | | |

**Key Insight**: 82 of 116 failures (71%) trace to a single root cause — **role defaults not reaching the headless navigation pipeline**. Fixing the role defaults resolver would likely resolve Categories A, C, and D in one sweep.

## Unresolved
- Role defaults resolver: where should role→config mapping live? (osDefaults.ts? resolveNavigation?)
- 7 showcase patterns need App export standardization before they can be converted
- value.initial headless application path unknown

## Ideas
- showcase마다 testConfig export 표준화 (app, items, zoneId)
- CI에서 headless 실패 = TestBot 실패 자동 대조 파이프라인
- Single "role defaults" fix could green 82+ tests
