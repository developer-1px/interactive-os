import { deleteTodo, TodoDraft } from "@apps/todo/app";
import { FOCUS } from "@os/3-commands/focus/focus";
import { createHeadlessTest } from "@os/tests/createHeadlessTest";

describe("OS Integration: Deletion Focus Recovery", () => {
  let headless: ReturnType<typeof createHeadlessTest>;

  beforeEach(() => {
    headless = createHeadlessTest();
    // Reset specific app slice if needed, but createHeadlessTest does resetAllAppSlices
  });

  test("When an item is deleted, focus should move to its neighbor (Next)", () => {
    const { dispatch, runtime } = headless;

    // 1. Add Items (A, B, C)
    // We use TodoDraft commands to populate state via normal app logic
    dispatch(TodoDraft.commands.addTodo({ text: "Item A" }));
    dispatch(TodoDraft.commands.addTodo({ text: "Item B" }));
    dispatch(TodoDraft.commands.addTodo({ text: "Item C" }));

    // 2. Resolve IDs from State
    // Access state fresh via runtime.getState()
    const appState = (runtime.getState() as any).apps["todo-v5"];
    const todos = Object.values(appState.data.todos) as any[];
    const itemA = todos.find((t) => t.text === "Item A");
    const itemB = todos.find((t) => t.text === "Item B");
    const itemC = todos.find((t) => t.text === "Item C");

    if (!itemA || !itemB || !itemC) throw new Error("Items not created");

    // 3. Focus Middle Item (B)
    // OS Focus command
    dispatch(FOCUS({ zoneId: "list", itemId: itemB.id }));

    // Assert initial focus state
    const focusState = (runtime.getState() as any).os.focus;
    expect(focusState.zones["list"].focusedItemId).toBe(itemB.id);

    // 4. Delete Middle Item (B)
    dispatch(deleteTodo({ id: itemB.id }));

    // 5. Verify Focus Moved to Neighbor (C)
    const finalFocusState = (runtime.getState() as any).os.focus;
    const finalFocusId = finalFocusState.zones["list"].focusedItemId;
    expect(finalFocusId).toBe(itemC.id);
  });

  test("When the last item is deleted, focus should move to previous (Prev)", () => {
    const { dispatch, runtime } = headless;

    // 1. Add Items (A, B)
    dispatch(TodoDraft.commands.addTodo({ text: "Item A" }));
    dispatch(TodoDraft.commands.addTodo({ text: "Item B" }));

    const appState = (runtime.getState() as any).apps["todo-v5"];
    const todos = Object.values(appState.data.todos) as any[];
    const itemA = todos.find((t) => t.text === "Item A")!;
    const itemB = todos.find((t) => t.text === "Item B")!;

    // 2. Focus Last Item (B)
    dispatch(FOCUS({ zoneId: "list", itemId: itemB.id }));

    // 3. Delete Last Item (B)
    dispatch(deleteTodo({ id: itemB.id }));

    // 4. Verify Focus Moved to Prev (A)
    const finalFocusState = (runtime.getState() as any).os.focus;
    expect(finalFocusState.zones["list"].focusedItemId).toBe(itemA.id);
  });
});
