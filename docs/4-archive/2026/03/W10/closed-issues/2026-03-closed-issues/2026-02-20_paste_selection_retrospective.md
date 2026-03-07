# Retrospective: Paste Selection Fix

**Session Goal:** Fix the bug where pasting multiple items resulted in lost selection (only the last item was selected/focused).
**Result:** Fixed by updating `createCollectionZone.ts` to dispatch `FOCUS` with an explicit `selection` payload, preventing `applyFollowFocus` from clearing the selection. Verified via OS-level integration test.

## KPT Evaluation

### 🔧 Development (Development)
- **Keep 🟢**: Switching from flaky E2E tests to **OS-level command integration tests** (`paste-integration.test.ts`). This aligned perfectly with Rule #6 ("Most fast feedback first") and isolated the logic from rendering issues.
- **Problem 🔴**: 
    1. Initially wasted time on E2E tests (`paste-focus.spec.ts`) that failed due to environment issues (timeouts/blank screens), not logic bugs.
    2. Overlooked the internal logic of the `FOCUS` command (`applyFollowFocus`), which silently overwrites selection if not explicitly provided. This led to a failed first fix attempt.
- **Try 🔵**: 
    1. **Kernel-First verification:** For logic that doesn't strictly depend on DOM events (like paste state updates), *always* prefer Kernel integration tests over E2E.
    2. **Analyze Side Effects:** When chaining commands (Paste -> FOCUS), inspect the downstream command's implementation for side effects on the shared state (Selection).

### 🤝 AI Collaboration (Collaboration)
- **Keep 🟢**: The user's directive ("e2e 말고 커맨드 기반으로...") was crucial in redirecting effort to the most effective testing strategy.
- **Problem 🔴**: I passively waited for this redirection instead of proposing it myself when E2E tests started flaking.
- **Try 🔵**: Proactively suggest "OS-level integration tests" as the primary verification method for state logic, framing E2E as a secondary smoke test.

### ⚙️ Workflow (Workflow)
- **Keep 🟢**: The **Reproduction -> Fix -> Verify** loop was strictly followed.
- **Problem 🔴**: The initial "verification" step relied on E2E, which wasn't robust. The workflow didn't explicitly fallback when the tool (Playwright) proved unreliable for the specific task.
- **Try 🔵**: Add a heuristic to the `/test` phase: "If UI rendering is flaky, fallback to Kernel state verification immediately."

## Self-Correction Action
- **Docs**: Recorded this retrospective.
- **Code**: The integration test `src/apps/todo/tests/integration/paste-integration.test.ts` remains as a permanent regression guard.
