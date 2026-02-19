import { createHeadlessTest } from "@os/tests/createHeadlessTest";
import { TodoDraft, listCollection } from "@apps/todo/app";
import { FOCUS } from "@os/3-commands/focus/focus";

describe("OS Integration: Cut Focus Recovery", () => {
    let headless: ReturnType<typeof createHeadlessTest>;

    beforeEach(() => {
        headless = createHeadlessTest();
    });

    test("When selected items are CUT, focus should move to nearest unselected neighbor (Next -> Prev)", () => {
        const { dispatch, kernel } = headless;

        // 1. Setup: [A, B, C, D]
        dispatch(TodoDraft.commands.addTodo({ text: "A" }));
        dispatch(TodoDraft.commands.addTodo({ text: "B" }));
        dispatch(TodoDraft.commands.addTodo({ text: "C" }));
        dispatch(TodoDraft.commands.addTodo({ text: "D" }));

        const appState = (kernel.getState() as any).apps['todo-v5'];
        const todos = Object.values(appState.data.todos) as any[];
        const get = (txt: string) => todos.find(t => t.text === txt)!;
        const [a, b, c, d] = ["A", "B", "C", "D"].map(get);

        // 2. Select Range [B, C] manually (simulating Shift+Up)
        headless.resetZone("list", {
            selection: [b.id, c.id],
            focusedItemId: b.id,
        });

        // Ensure list is active
        dispatch(FOCUS({ zoneId: "list", itemId: b.id }));

        // Verify State
        let focusState = (kernel.getState() as any).os.focus.zones['list'];
        expect(focusState.focusedItemId).toBe(b.id);
        expect(focusState.selection).toContain(b.id);
        expect(focusState.selection).toContain(c.id);
        expect(focusState.selection).toHaveLength(2);

        // Mock clipboardWrite effect to avoid Kernel "Unknown effect" warning/error
        // This is necessary because the test kernel might not have the effect registered if defineApp namespacing mismatches
        try {
            kernel.defineEffect("clipboardWrite", () => Promise.resolve());
        } catch (e) {
            // Ignore if already defined
        }

        // 3. Perform CUT
        // Pass IDs explicitly AND focusId for recovery
        dispatch(listCollection.cut({ ids: [b.id, c.id], focusId: b.id }));

        // 4. Verify Items B and C are removed
        const newAppState = (kernel.getState() as any).apps['todo-v5'];
        const newTodos = Object.values(newAppState.data.todos) as any[];
        const initialCount = todos.length;
        expect(newTodos.find(t => t.id === b.id)).toBeUndefined();
        expect(newTodos.find(t => t.id === c.id)).toBeUndefined();
        expect(newTodos).toHaveLength(initialCount - 2);

        // 5. Verify Focus Recovery -> Should be D (Next neighbor of the block [B,C])
        const finalFocusState = (kernel.getState() as any).os.focus.zones['list'];
        expect(finalFocusState.focusedItemId).toBe(d.id);
    });
});
