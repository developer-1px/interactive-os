# combobox-relay — Retrospective

## Session Summary
resolveKeyboard combobox guard relay + QuickPick OS-native migration.
T1-T6 complete: 9 tests, 0 L2 violations (was 12), audit pass, doubt pass.

## Knowledge Harvest
- `simulate.ts` hardcodes `isCombobox: false` — combobox headless testing requires pure function tests on resolveKeyboard directly
- Facade boundary check catches `@os-core` imports in `src/` — ZoneCursor was already re-exported from `@os-sdk/os`

## KPT

### 🔧 Development
- **Keep 🟢**: Root cause tracing (single line resolveKeyboard.ts:88 → 12 violations). Efficient analysis
- **Keep 🟢**: Pure function testing when headless path is limited (isCombobox hardcoded)
- **Problem 🔴**: T2-T5 committed as single batch — harder to bisect
- **Try 🔵**: One logical change = one commit, even during rapid green phase

### 🤝 Collaboration
- **Keep 🟢**: User's initial framing ("onClick 제거 + trigger로 가능한지 + osgap 파악") led directly to root cause

### ⚙️ Workflow
- **Keep 🟢**: /audit caught facade violation (@os-core import in src/)
- **Keep 🟢**: /doubt converged in 1 round — no unnecessary changes produced

## Actions
| # | Action | Status |
|---|--------|--------|
| 1 | Memory: combobox headless testing limitation | ❌ → reflect to memory |
