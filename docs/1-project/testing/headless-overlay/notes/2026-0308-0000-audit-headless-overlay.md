# Audit: headless-overlay

> Date: 2026-03-08
> Scope: packages/os-core/src/4-command/overlay/overlay.ts, packages/os-devtool/src/testing/simulate.ts, tests/apg/overlay-lifecycle.test.ts, tests/apg/dialog.apg.test.ts, tests/apg/dropdown-menu.apg.test.ts

## Grep Results

### Facade boundary (src/ -> @os-core)
0 hits from this project. Pre-existing inspector hits (4) are out of scope.

### Prohibited patterns in src/
No src/ files modified by this project.

### OS internal contract check
- OS_OVERLAY_OPEN: reads ZoneRegistry (registry access in command = standard pattern), mutates draft state via immer. Sound.
- simulateClick: added `findZoneByItemId` check before fast path. No new side effects.
- Test files: only @os-core import is `OS_OVERLAY_OPEN` for trigger `onActivate` payload. This is the intended API surface for trigger declarations.

## 0-hit protocol

1. OS primitives used: OS_OVERLAY_OPEN, OS_OVERLAY_CLOSE, OS_ESCAPE, OS_TAB, applyFocusPush/Pop, ZoneRegistry, simulateClick
2. Callback signatures: OS_OVERLAY_OPEN returns `{ state }` (declarative). Sound.
3. bind() methods: all zone bindings use role/getItems/options/triggers — standard patterns.
4. os.dispatch in app code: 0 hits.

## Result

Total violations: 0
- 0 LLM mistakes
- 0 OS gaps
- 0 justified exceptions

Audit PASS.
