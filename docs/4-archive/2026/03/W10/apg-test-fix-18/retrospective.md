# Retrospective: apg-test-fix-18

> 2026-03-07 | 18 APG test failures resolved

## Session Summary
Fixed all 18 remaining APG test failures (5 files, 5 root causes). 141 files, 1465 tests, 0 fail.

## Knowledge Harvest
| # | Knowledge | Reflected |
|---|-----------|-----------|
| K1 | `Enter: []` in inputmap = explicit key blocking. resolveKeyboard must return NOOP (not null) to prevent global fallback | MEMORY.md |
| K2 | createTrigger zones are NOT registered in zoneBindingEntries — need `opts.role` in page.goto() for headless testing | MEMORY.md |
| K3 | `config.value.initial` was declared but never consumed by zone init — page.goto now populates valueNow | MEMORY.md |

## KPT
### Development
- Keep: Parallel agent diagnosis of 5 root causes was efficient (3 agents, ~90s each)
- Keep: NOOP vs null distinction in the 3-layer responder chain is a critical design insight
- Problem: None

### Workflow
- Keep: Direct plan→green pipeline for clear mechanical fixes
