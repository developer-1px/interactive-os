# Test Suite Rebalancing Analysis (Doubt Execution)

> **Context**: The `Delete -> Focus Draft` bug revealed a gap in our testing strategy. We have abundant unit tests for command logic but lack integration tests that verify APG behaviors (like focus recovery) in a holistic manner.

## 1. Inventory & Filter Chain Analysis

### A. OS Command Unit Tests (`src/os/3-commands/tests/unit`)
These tests verify individual command reducers in isolation.

| Status | File | Role | Analysis (Filter Chain) |
|:---:|:---|:---|:---|
| 🟢 | `navigate.test.ts` | Core arrow nav logic | **Keep**. Complex logic (stickyX, stickyY) needs unit verification. |
| 🟢 | `focusFinder.test.ts` | Spatial geometric search | **Keep**. Pure algorithm, perfect for unit testing. |
| 🟡 | `select.test.ts` | Selection state update | **Reduce**. Trivial logic (array push/filter). Covered better by integration tests? |
| 🟡 | `delete.test.ts` | Delete command reducer | **Reduce**. The reducer is simple, but the *effect* (focus recovery) is what matters and was missed here because it's an orchestration issue, not a reducer issue. |
| 🟢 | `strategies.test.ts` | Nav strategy resolvers | **Keep**. Core logic. |
| 🟡 | `tab.test.ts` | Tab trapping/cycles | **Redesign**. Tab behavior is heavily dependent on DOM structure and FocusGroup hierarchy. Mocking this is brittle. Should be Integration/E2E. |
| 🟡 | `undo-redo.test.ts` | History state manipulation | **Redesign**. History is a middleware effect. Testing the reducer alone misses the snapshot capture logic. |

### B. App E2E Tests (`src/apps/todo/tests/e2e`)
These tests verify the end-user experience in a real browser.

| Status | File | Role | Analysis |
|:---:|:---|:---|:---|
| 🟢 | `todo.spec.ts` | General functionality | **Keep**. Essential regression suite. |
| 🟢 | `multiselect-interactions.spec.ts` | Mouse/Keyboard selection | **Keep**. Verifies complex browser events (Shift+Click) that are hard to mock. |
| 🟡 | `focus-recovery.spec.ts` | Delete focus behavior | **Merge**. Should be part of a broader "Interaction Robustness" suite or merged into `todo.spec.ts` to reduce file fragmentation. |
| 🟢 | `dogfooding.spec.ts` | Usage scenarios | **Keep**. Validates "Real World" usage flows. |

### C. Missing Layer: Headless Integration
We currently lack a robust layer that tests the **Kernel + OS + App** wiring without a browser.
- `src/os/tests/createIntegrationTest.ts` exists but is underutilized.
- We need tests that dispatch `OS_DELETE` and assert `os.focus.focusedItemId` **without** mocking the command dispatcher.

## 2. Chesterton's Fence Checks

### Why do we have so many unit tests for trivial reducers?
- **Reason**: To verify Redux-style state updates in isolation.
- **Validity**: **Low**. The reducers are mostly Immer producers. The complexity lies in the *interaction* of commands (e.g., Delete triggering Focus), not the state update itself.
- **Decision**: Shift focus from testing *reducers* to testing *behaviors* (Kernel Integration).

### Why are there no Kernel Integration tests for interactions?
- **Reason**: Early focus was on pure logic (Unit) and final output (E2E).
- **Validity**: **Invalid**. The "Middle" layer (OS Orchestration) is where the "Delete -> Focus" gap existed. We need to verify that the OS *orchestrates* correctly.

## 3. Action Plan (Execution)

### Round 1: Rebalance Strategy
1.  **Stop writing unit tests for simple reducers** (e.g., `setSelection`).
2.  **Establish `KernelTestKit`**: A standard way to spin up a headless kernel with an app for testing.
3.  **Migrate "Orchestration Logic" to Integration Tests**:
    - Focus Selection (Select -> Focus sync)
    - Delete Recovery (Delete -> Focus neighbor)
    - Undo/Redo (History -> State restoration)
4.  **Consolidate E2E Tests**: Group by Feature/Story rather than Bug Ticket.

---
**Verdict**:
- 🟡 **Unit Tests**: Reduce redundant reducer tests.
- 🟢 **Complex Logic Units**: Keep (Navigation, Spatial).
- 🔴 **Missing Integration**: **Create new suite**.
- 🟡 **E2E**: Refactor/Merge for better organization.
