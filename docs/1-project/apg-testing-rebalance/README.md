# APG Testing Rebalance Project

> **WHY**: The "Delete -> Focus Draft" bug proved that unit tests for reducers are insufficient to catch orchestration issues (e.g., focus recovery), while E2E tests are too slow/heavy for covering all edge cases. We need a robust **Headless Kernel Integration** layer that verifies APG behaviors deterministically.

## Goals

1.  **Orchestration Logic Coverage**: Ensure OS-level behaviors (Focus Recovery, Selection Sync, History Restoration) are tested together.
2.  **APG Compliance**: Verify that keyboard/mouse interactions produce the correct state transitions according to W3C specs.
3.  **Reduce Redundant Unit Tests**: Move away from testing trivial reducers in isolation if the behavior is better covered by integration tests.

## Scope

- **In Scope**:
    - `src/os/tests/createIntegrationTest.ts`: Establish a standard `KernelTestKit`.
    - `src/os/3-commands/tests/integration`: Create new suites for Selection, Deletion, History.
    - `src/apps/todo/tests/e2e`: Refactor/Merge existing tests.
- **Out of Scope**:
    - Changing the actual implementation code (unless bugs are found).
    - UI/Visual E2E tests (style checking).

## Testing Strategy (The Trophy)

1.  **Headless Integration (Kernel + App)**: **Primary Layer**.
    - Load Kernel + App Slice.
    - Dispatch `OS_DELETE`.
    - Assert `os.focus.focusedItemId`.
    - Catches: Selector bugs, Middleware failures, Focus logic gaps.
2.  **E2E (Playwright)**: **Guardrails**.
    - Verify critical paths in real browser.
    - Verify complex DOM events (Shift+Click ranges).
3.  **Unit (Jest)**: **Targeted**.
    - Complex Algorithms (Spatial Navigation, Diff-Patch).
    - Utility Logic (Data structures).
