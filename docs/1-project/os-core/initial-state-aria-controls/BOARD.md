# initial-state-aria-controls

## Context

Claim: `disallowEmpty: true` = auto-select `getItems()[0]` on mount. `initial` field = optional override (URL routing). `aria-controls` = content panel relationship via `contentRoleMap`, not expand-only.

Before -> After:
- SelectConfig has no `initial` field -> `initial?: string | string[]` optional override
- ExpandConfig has no `initial` field -> `initial?: string[]` optional override
- Zone mount doesn't seed selection/expand -> `disallowEmpty` auto-selects first item; `initial` overrides
- `aria-controls` only in expand block -> content panel roles (tablist->tabpanel) also get `aria-controls`
- 5 APG tests FAIL (I1 x3, A5 x2) -> all GREEN

Risks: `getItems()` availability at Zone mount time. Must not overwrite user-interacted state on re-render.

## Now

(empty — all tasks complete)

## Done

- [x] T1: SelectConfig + ExpandConfig type declarations — tsc 0 new errors
- [x] T2: Zone.tsx initial state seeding — browser runtime select + expand
- [x] T3: page.ts goto() initial state seeding — headless seedInitialState()
- [x] T4: compute.ts aria-controls for content panel roles — getContentRole import + block
- [x] T5: APG test verification — 527 pass | 0 fail | 0 regression | build OK

## Unresolved

## Ideas
