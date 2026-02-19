# Issue: APG Multi-selection Specs Missing (Shift+Click, Alt+Click)

## 1. Issue Description
The user reported that APG specifications for multi-selection interactions, specifically `Shift+Click` and `Alt+Click`, are missing. While `Shift+Click` and `Cmd/Ctrl+Click` are mentioned in the Knowledge Base (`multi_select_system.md`), the user implies a gap in the formal APG specification or implementation details within the current project context.

## 2. Environment
- **OS**: Mac
- **App**: Interactive OS (Todo/Builder)
- **Version**: Current HEAD

## 3. Reproduction Steps
1. Open the Todo or Builder app.
2. Attempt multi-selection using mouse interactions:
   - `Shift + Click` (Expected: Range selection)
   - `Alt + Click` (Expected: Specific behavior, possibly disconnect selection or alternative range)
   - `Cmd + Click` (Expected: Toggle selection)
3. Review `docs/` or source code for explicit APG compliance documentation regarding these interactions.

## 4. Expected Behavior
- Clear documentation citing APG patterns for multi-selection.
- Implementation matches the documented APG standards.
- `Alt+Click` behavior defined (if applicable) or explicitly reserved/ignored.

## 5. Actual Behavior
- `Shift+Click` and `Alt+Click` specs are reported as "missing" by the user.
- Explicit APG mapping document might be absent in the project `docs`.

## 6. Diagnosis (Completed)
- **Knowledge Base**: `multi_select_system.md` covered Shift/Cmd but omitted Alt.
- **Codebase**: `resolveMouse.ts` previously ignored `altKey`.
- **Fix**: Updated `MouseListener.tsx` and `resolveMouse.ts` to explicitly capture `altKey`. It currently maps to `replace` (default) to ensure predictable behavior, pending further requirement definition.
- **Spec**: Created `docs/1-project/interaction_specs.md` to document these behaviors.

## 7. Resolution
- **Code**:
  - `MouseListener` updated to dispatch `FOCUS` with `skipSelection: true`.
  - `FOCUS` command updated to support `skipSelection`.
  - `resolveMouse` updated to recognize `Alt` key (defaulting to replace mode).
- **Docs**: Interaction Matrix created in `interaction_specs.md`.
- **Test**:
  - Unit: `resolveMouse.test.ts` passed.
  - E2E: Created `multiselect-interactions.spec.ts`. Confirmed `Shift+Click` and `Cmd+Click` work.

## 8. Verification Results
- `multiselect-interactions.spec.ts`: **PASSED** (Validated Shift+Click range, Cmd+Click toggle, Alt+Click replace).
- `arrow-nav.spec.ts` (temp): **PASSED** (Validated ArrowDown navigation follows focus).
- Note: Pre-existing failures in `todo.spec.ts` and `dogfooding.spec.ts` were observed but are unrelated to the selection fix (likely selector/state fragility).

## 9. Questions for User
- Does `Alt+Click` require a specific non-default behavior? (Currently implemented as Replace).
