# Refactoring App Structure & TodoAppShell

## Goal
Decouple the `TodoAppShell` to remove unnecessary structural complexity. Establish a clear "Global OS" layer in `App.tsx` and move app-specific logic (Clipboard, specific Zones) to `TodoPage`.

## User Review Required
> [!IMPORTANT]
> - `TodoAppShell.tsx` will be **DELETED**.
> - `GlobalNav` will now sit outside the `main` Zone of the Todo App, directly in the root layout.
> - `ClipboardManager` will be moved to `TodoPage.tsx`, meaning it will **only be active on the Todo route**, not globally. (Please confirm if this is desired behavior. Given it's in `apps/todo`, this seems correct).

## Proposed Changes

### [Root] src/App.tsx
#### [MODIFY] App.tsx
- Initialize `useTodoEngine` at the top level (or in a `AntigravityRuntime` wrapper).
- Wrap the application in `AntigravityOS`.
- Refactor `MainLayout` to:
  - Render `GlobalNav` (Left).
  - Render `Outlet` (Center/Main).
  - Render `Inspector` (Right, conditional).
- Remove `TodoAppShell` usage.

### [Apps] src/apps/todo
#### [DELETE] TodoAppShell.tsx
- File will be removed.

### [Pages] src/pages
#### [MODIFY] TodoPage.tsx
- Import `Zone` from `@os/ui/Zone`.
- Import `ClipboardManager` from `@apps/todo/features/clipboard/ClipboardManager`.
- Wrap contents in `<Zone id="todo-app" ...>`.
- Include `<ClipboardManager />`.

## Verification Plan
### Manual Verification
- **Navigation**: Verify clicking GlobalNav items works and doesn't trigger unrelated zone logic.
- **Inspector**: Verify Inspector toggles correctly (Cmd+I or state change) and appears on the right without breaking layout.
- **Todo App**: Verify Todo functionality (Sidebar, Panel) works as before within its new Zone.
- **Clipboard**: Verify copy/paste works within Todo page.
