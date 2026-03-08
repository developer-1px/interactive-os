# Combobox Relay — Spec

> @plan notes/2026-0309-0600-[plan]-combobox-relay.md

## Decision Table

| # | Context | Input | Expected | S |
|---|---------|-------|----------|---|
| 1 | isCombobox=true, overlay open | ArrowDown | OS_NAVIGATE({direction:"down"}) | ⬜ |
| 2 | isCombobox=true, overlay open | ArrowUp | OS_NAVIGATE({direction:"up"}) | ⬜ |
| 3 | isCombobox=true, overlay open | Enter | commands from inputmap (OS_ACTIVATE) | ⬜ |
| 4 | isCombobox=true, overlay open | Escape | OS_ESCAPE | ⬜ |
| 5 | isCombobox=true, overlay open | Home | OS_NAVIGATE({direction:"first"}) | ⬜ |
| 6 | isCombobox=true, overlay open | End | OS_NAVIGATE({direction:"last"}) | ⬜ |
| 7 | isCombobox=true, overlay open | "a" (character) | EMPTY (no commands — typing pass-through) | ⬜ |
| 8 | isCombobox=true, overlay open | "1" (digit) | EMPTY (no commands — typing pass-through) | ⬜ |
| 9 | combobox listbox zone, click on item | click | OS_ACTIVATE via inputmap.click | ⬜ |
