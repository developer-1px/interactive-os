# 🐛 Command Palette Cursor & Typeahead
> Registration Date: 2026-02-13
> Status: open
> Severity: P2

## Original
커맨드창에서 커서 유지가 안되는데 typeahead 기능이 필요해

## Interpretation
The user reports:
1. **Cursor Position Loss**: The cursor position is not properly maintained (likely jumping or resetting) during interaction in the Command Palette (or Terminal).
2. **Typeahead Request**: There is a need for typeahead (autocomplete/suggestion) functionality to improve usability.

## First Impressions
**Cursor Issue**:
- In `CommandPalette.tsx`, the input is a standard controlled component. Cursor jumps usually happen if:
    - The value is reformatted (trimmed/modified) on every render.
    - The component remounts unexpectedly (key prop changing, or parent unmounting).
    - An external force (like `OS.Zone` or global keyboard handlers) is interfering with focus or selection.

**Typeahead**:
- Likely requests a "shadow" or "ghost" text completion like in standard shells (zsh-autosuggestions) or modern command palettes (Raycast/Spotlight).
- Needs to handle "Tab" or "ArrowRight" to accept.

## Related Issues
- None explicitly linked yet.

## Diagnosis
**Cursor Jump**: The `Dialog` component was passing a new `options` object literal `{{ project: { autoFocus: true } }}` to the `Zone` component on every render. This caused the `FocusGroup` to re-initialize, resetting focus (and thus cursor position) whenever the input content changed.

**Typeahead**: Implemented "Ghost Text" strategy.

## Resolution
- **Fix**: Extracted `DIALOG_ZONE_OPTIONS` to a stable constant in `Dialog.tsx`.
- **Feature**: Added ghost text overlay and `Tab`/`ArrowRight` handlers in `CommandPalette.tsx`.
- **Verification**: Pending user confirmation.
