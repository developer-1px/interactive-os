import { beforeEach, describe, expect, it } from "vitest";
import { createIntegrationTest } from "@/os/tests/createIntegrationTest";
import { _resetClipboardStore } from "@/os/collection/createCollectionZone";
import { addTodo, TodoApp, TodoList } from "../../app";

describe("Todo Integration: Paste & Focus (OS Level)", () => {
  let testContext: ReturnType<
    typeof createIntegrationTest<import("../../model/appState").AppState>
  >;

  beforeEach(() => {
    _resetClipboardStore();
    testContext = createIntegrationTest(TodoApp);
    testContext.resetZone("list");
  });

  it("should select and focus newly pasted items", async () => {
    const { dispatch } = testContext;
    const initialCount = testContext.state.data.todoOrder.length;

    // 2. Setup: Add items
    dispatch(addTodo({ text: "Item 1" }));
    dispatch(addTodo({ text: "Item 2" }));

    // Dynamic check
    const afterAddCount = testContext.state.data.todoOrder.length;

    expect(afterAddCount).toBe(initialCount + 2);

    // Get IDs of added items (last 2)
    const [, id2] = testContext.state.data.todoOrder.slice(-2);

    // 3. Copy Item 2
    dispatch(TodoList.commands.copyTodo({ ids: [id2!] }));

    // 4. Paste
    dispatch(TodoList.commands.pasteTodo({ afterId: id2! }));

    // 5. Verify Result (App State)
    const finalCount = testContext.state.data.todoOrder.length;
    expect(finalCount).toBe(afterAddCount + 1);

    const newId = testContext.state.data.todoOrder[finalCount - 1]; // Last item

    // 6. Verify OS Selection
    // Re-read OS state too!
    const zoneState = testContext.os.focus.zones["list"]!;
    expect(zoneState.selection).toEqual([newId]);
    expect(zoneState.focusedItemId).toBe(newId);
  });

  it("should handle multi-item paste selection", async () => {
    const { dispatch } = testContext;
    const initialCount = testContext.state.data.todoOrder.length;

    // Setup
    dispatch(addTodo({ text: "Item A" }));
    dispatch(addTodo({ text: "Item B" }));
    dispatch(addTodo({ text: "Item C" }));

    // Dynamic ID retrieval (use slice on fresh state)
    const [idA, idB, idC] = testContext.state.data.todoOrder.slice(-3);

    // Copy A and B
    dispatch(TodoList.commands.copyTodo({ ids: [idA!, idB!] }));

    // Paste
    dispatch(TodoList.commands.pasteTodo({ afterId: idC! }));

    // Verify
    const finalCount = testContext.state.data.todoOrder.length;
    expect(finalCount).toBe(initialCount + 3 + 2); // Orig + 3 added + 2 pasted

    const pastedIds = testContext.state.data.todoOrder.slice(-2); // Last 2 are pasted

    // Re-read OS state
    const zoneState = testContext.os.focus.zones["list"]!;

    // Both pasted items should be selected
    expect(zoneState.selection).toHaveLength(2);
    expect(zoneState.selection).toEqual(expect.arrayContaining(pastedIds));

    // Focus should be on the last one
    expect(zoneState.focusedItemId).toBe(pastedIds[1]);
  });
});
