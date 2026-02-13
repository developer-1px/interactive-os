# 🐛 Command Palette Persistent Focus
> Registration Date: 2026-02-13
> Status: open
> Severity: P2

## Original
커맨드창인 경우에는 항상 focus가 유지되어야 하는데 그게 안되네

## Interpretation
The user expects the Command Palette input to maintain focus continuously.
Likely failure scenarios:
1. Clicking on the result list moves focus away from the input.
2. Interacting with scrollbars moves focus.
3. Does `Cmd+K` when already open refocus it?

## First Impressions
The Command Palette should behave like a "Combobox" where the input acts as the primary focus point.
- If the user interacts with the list (e.g. scrolling, clicking), we should decide whether to:
    A) Keep focus in Input (prevent focus theft).
    B) Refocus Input aggressively on any keypress.
- Currently `OS.Item` interactions likely shift focus to the item.

## Related Issues
- `docs/1-project/0-issue/2026-02-13_command-palette-ux.md` (Cursor/Typeahead)
