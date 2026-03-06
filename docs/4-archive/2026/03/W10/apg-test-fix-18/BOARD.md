# apg-test-fix-18

## Context

18 APG test failures across 5 files, 5 distinct root causes.
3 os-core fixes + 3 test fixes. Light project.

## Now

## Done
- [x] T1: checkbox Enter block — `Enter: []` in inputmap + NOOP return in resolveKeyboard | +1 test GREEN
- [x] T2: page.goto fallback registration — `opts.role` enables unbound zone (createTrigger) registration | +11 tests GREEN
- [x] T3: menu-button test — added `role: "menu"` to goto opts | +11 tests GREEN
- [x] T4: tree single-select — singleTreeFactory with `config: { select: { mode: "single" } }` | +3 tests GREEN
- [x] T5: tabs assertion fix — `tab-fonseca` (index 2), not `tab-lange-muller` (index 3) | +1 test GREEN
- [x] T6: meter valueNow init — populate from `config.value.initial` in goto() | +1 test GREEN

Evidence: 141 files, 1465 tests, 0 fail

## Unresolved
