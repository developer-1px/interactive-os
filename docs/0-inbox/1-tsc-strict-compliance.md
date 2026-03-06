# TSC Strict Compliance — 316 Remaining Errors

> Created: 2026-03-07
> Status: Backlog
> Priority: High (blocks CI gate)

## Context

675 TSC errors existed. 359 were resolved in quick-win batches (exports, imports, paths, unused vars, bracket notation). 316 remain — all from 3 systemic strict TS settings.

## Root Causes (3)

### RC-1: CommandFactory void Payload (34 errors — TS2345)

`defineCommand("TYPE", handler)` infers `P = void` when the handler uses optional payload `(payload?: T)`. Callers pass `{ id: "..." }` but type expects `void`.

**Files**: 22 files (triggerRegistry, overlay.test, todo/app, command-palette, etc.)
**Fix**: Update `defineCommand` generic inference to propagate `P` from handler's parameter type, not default to `void`. Kernel-level change.

### RC-2: noUncheckedIndexedAccess (100+ errors — TS2345, TS2532)

`array[0]` returns `T | undefined`, not `T`. Test files pass `items[0]` to functions expecting `string`.

**Files**: ~60 files (APG tests, integration tests, OS core)
**Fix options**:
1. Add `!` non-null assertions where array bounds are guaranteed
2. Add `?? ""` / `?? fallback` guards
3. Use helper `first(arr)` that asserts non-undefined

### RC-3: exactOptionalPropertyTypes (100+ errors — TS2322, TS2379, TS2353)

`{ prop: string | undefined }` is not assignable to `{ prop?: string }` with `exactOptionalPropertyTypes: true`. Affects every function returning objects where properties might be undefined.

**Files**: ~50 files (resolveKeyboard, osDefaults, zone configs, etc.)
**Fix options**:
1. Refactor function signatures: `undefined` → omit property, or use `null`
2. Add conditional spreads: `...(val !== undefined ? { prop: val } : {})`

### Other (82 errors)

| Code | Count | Description |
|------|-------|-------------|
| TS2352 | 15 | Type assertion: `as` expressions with incompatible types |
| TS2353 | 21 | Object literal type excess (related to RC-3) |
| TS2769 | 5 | No overload matches |
| TS2614 | 4 | Module has no default export |
| TS2741/2739 | 6 | Missing/incompatible properties |
| TS2339 | 3 | Property doesn't exist |
| TS18047/18048 | 5 | Possibly null/undefined |
| Others | 13 | Various |

## Recommended Approach

1. **RC-1 first** — Kernel `defineCommand` generic fix. Highest leverage (34 errors, 1 root fix)
2. **RC-2 second** — Mechanical but tedious. Consider a `strictFirst(arr)` helper
3. **RC-3 third** — Most files affected. Pattern: conditional spread or explicit null

## Affected Files (110 total)

```
packages/os-core/   — 42 files
packages/os-react/  — 10 files
packages/os-sdk/    — 9 files
packages/os-devtool/— 8 files
src/                — 28 files
tests/              — 13 files
```
