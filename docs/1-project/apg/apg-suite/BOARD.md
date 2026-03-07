# BOARD — apg-suite

> 목표: APG headless 테스트 331 fail → 0 fail. Role defaults resolver가 핵심 병목이다.
> 선행 프로젝트: [apg-test-fidelity](../../../4-archive/2026/03/W10/apg-test-fidelity/BOARD.md), [apg-test-fix-18](../../../4-archive/2026/03/W10/apg-test-fix-18/BOARD.md)

## Baseline (2026-03-07)

22 files, 396 tests, **331 fail / 65 pass**

| File | Pass | Fail | Total | Primary Category |
|------|------|------|-------|-----------------|
| accordion | 1 | 23 | 24 | A |
| button | 2 | 16 | 18 | A |
| carousel | 1 | 25 | 26 | A |
| checkbox | 0 | 7 | 7 | E |
| combobox | 1 | 8 | 9 | A+F |
| dialog | 1 | 5 | 6 | F |
| disallow-empty-initial | 0 | 5 | 5 | F |
| disclosure | 1 | 18 | 19 | A+D |
| dropdown-menu | 1 | 7 | 8 | F |
| feed | 1 | 18 | 19 | A |
| listbox | 33 | 7 | 40 | A |
| menu-button | 3 | 18 | 21 | A+E |
| menu | 3 | 23 | 26 | A |
| meter | 2 | 7 | 9 | E |
| navtree | 3 | 9 | 12 | F |
| radiogroup | 0 | 20 | 20 | A |
| switch | 0 | 12 | 12 | E |
| tabs | 1 | 30 | 31 | A+C |
| toolbar | 3 | 9 | 12 | A |
| tooltip | 2 | 12 | 14 | A |
| tree | 3 | 28 | 31 | A+B |
| treegrid | 3 | 24 | 27 | A+B |

### Root Cause Categories (from apg-test-fidelity audit)

| Cat | Name | Est. Failures | Root Cause |
|-----|------|---------------|------------|
| **A** | Role defaults not applied | ~200+ | headless pipeline ignores role → config mapping |
| **B** | Expansion state not projected | ~20 | aria-expanded undefined for tree/treegrid |
| **C** | Manual tab activation | ~5 | followFocus config not reaching headless |
| **D** | Flow/Multi-zone tab | ~5 | disclosure flow mode + accordion multi-section |
| **E** | Pattern-specific gaps | ~20 | checkbox, switch, meter, button individual issues |
| **F** | Synthetic factory (no App export) | ~50+ | 7 patterns lack App export, factory config drift |

**Key insight**: Category A alone accounts for ~60% of all failures. Single fix location.

---

## Phases

### Phase 1: Role Defaults Resolver (unblocks ~60%)

- [ ] **WP1: resolveRole() in headless pipeline**
  - `page.goto(zoneId, opts)` must apply role defaults when no explicit navigate/select/tab options
  - Location: os-core roleRegistry → headless resolveNavigation/resolveTab
  - Affected: accordion, button, carousel, combobox, feed, listbox, menu, menu-button, radiogroup, tabs, toolbar, tooltip, tree, treegrid
  - Success: ArrowDown/ArrowRight forward navigation works for all role-based zones

### Phase 2: State Pipelines

- [ ] **WP2: Expansion state projection**
  - expandableItems/treeLevels must produce aria-expanded in computeItem
  - Affected: tree (28 fail), treegrid (24 fail)
  - Success: aria-expanded false/true correctly projected

- [ ] **WP3: Select config pipeline**
  - followFocus: false must reach headless select resolver
  - Affected: tabs manual activation (5 fail)
  - Success: navigation does NOT change selection in manual mode

- [ ] **WP4: Tab flow + multi-zone**
  - disclosure flow mode (each item = own tab stop)
  - accordion multi-section expand independence
  - Affected: disclosure (18 fail), accordion subset
  - Success: Tab/Shift+Tab moves between flow items

### Phase 3: Pattern-Specific

- [ ] **WP5: Individual pattern fixes**
  - checkbox: Enter/Space toggle (not just Space)
  - switch: toggle interaction
  - meter: value projection
  - button: activation model
  - menu-button: overlay state + Escape dismiss
  - Success: each pattern's unique behavior works

### Phase 4: Coverage Completion

- [ ] **WP6: Showcase App export standardization**
  - 7 patterns need `App` + `testConfig` export: listbox, toolbar, menu, dialog, dropdown-menu, combobox, navtree
  - Standardize: `export const App`, `export const testConfig = { zoneId, items }`
  - Success: all 22 test files use real app config (no synthetic factory)

- [ ] **WP7: Final sweep**
  - Re-classify remaining failures after WP1-WP6
  - Fix or document as known OS gaps
  - Success: 0 fail or all remaining failures documented with OS gap tickets

---

## Now

(시작 전)

## Done

(없음)

## Unresolved

- WP1 구현 위치: roleRegistry.ts → page.goto()? resolveNavigation()? osDefaults?
- WP6 showcase 리팩토링 범위: Component만? bind config도?
- Category F (synthetic factory) 실패 중 Category A 겹침 비율 미확인
