# Plan: OG-019 Initial State + OG-020 aria-controls

> Claim: `disallowEmpty: true` = auto-select `getItems()[0]` on mount. `initial` = optional override. `aria-controls` = content panel relationship (contentRoleMap), not expand relationship.

## MECE Transformation Table

| # | Target | Before | After | Cynefin | Depends | Verify | Risk |
|---|--------|--------|-------|---------|---------|--------|------|
| 1 | `FocusGroupConfig.ts:SelectConfig` | `{ mode, followFocus, disallowEmpty, range, toggle, scope?, aria? }` — no `initial` field | Add `initial?: string \| string[]` — optional override for which item(s) to select on mount | Clear | — | tsc 0 | Type-only change, no runtime impact alone |
| 2 | `FocusGroupConfig.ts:ExpandConfig` | `{ mode }` — no `initial` field | Add `initial?: string[]` — optional override for which items to expand on mount | Clear | — | tsc 0 | Type-only change, no runtime impact alone |
| 3 | `Zone.tsx` (os-react, useMemo block ~L171) | Seeds `value.initial` only. No `select.initial` or `expand.initial` seeding. `disallowEmpty` not enforced at mount | Add initial selection seeding: `config.select.initial ?? (disallowEmpty && items[0])`. Add initial expand seeding: `config.expand.initial`. Write to `zone.items[id]["aria-selected"]` / `["aria-expanded"]` via `ensureZone` + `setState` | Clear | →#1, →#2 | Existing APG tests I1 go GREEN (4 tests: accordion I1 + tabs-auto I1 + tabs-manual I1 + tabs-manual M1) | Must guard `getItems()` availability at mount time. Must not overwrite user-interacted state on re-render |
| 4 | `page.ts:goto()` (~L183) | Calls `registerZoneFromBinding()` only. No initial state seeding. `setupZone()` has it but `goto()` doesn't | After zone registration loop, seed initial selection/expand per zone (same logic as #3). Mirror `setupZone` lines 232-259 | Clear | →#1, →#2 | Same 4 APG I1 tests go GREEN in headless | Must happen after `registerZoneFromBinding` so `ZoneRegistry.get()` returns config |
| 5 | `compute.ts:computeItem()` (~L117-128) | `aria-controls` only set inside `expandMode !== "none"` block. Tablist (select-based visibility) gets no `aria-controls` | After expand block, add content panel block: if `getContentRole(entry.role)` exists AND item has content panel, set `attrs["aria-controls"] = "panel-{itemId}"` | Clear | — | APG A5 tests go GREEN (2 tests: tabs-auto A5 + tabs-manual A5) | Must import `getContentRole` from roleRegistry. Must not double-set for expand roles (accordion already gets it from expand block) |
| 6 | APG test verification | 5 tests 🔴 FAIL (I1 x3, A5 x2) | 5 tests 🟢 PASS. Total regression = 0 | Clear | →#3, →#4, →#5 | `vitest run tests/apg/` — all pass. `vitest run` — no regression | — |

## MECE Check

1. **CE**: #1-#2 = type declarations. #3 = browser runtime seeding. #4 = headless runtime seeding. #5 = aria-controls projection. #6 = verification. All 5 failing tests covered (I1 x3 by #3/#4, A5 x2 by #5). Complete.
2. **ME**: #3 (Zone.tsx) and #4 (page.ts) are separate runtimes (browser vs headless). No overlap.
3. **No-op**: None. All rows change behavior.

## Routing

Approved -> `/project` (new os-core project: `initial-state-aria-controls`) — OS-core Heavy, 6 tasks, resolves OG-019 + OG-020.
