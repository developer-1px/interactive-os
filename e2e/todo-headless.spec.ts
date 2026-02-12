import { expect, test } from "@playwright/test";

/**
 * Todo Headless E2E — Playwright
 *
 * 커널의 dispatch/getState를 page.evaluate()로 직접 호출하여
 * DOM 없이 상태 전이를 검증합니다.
 *
 * window.__todo (e2e-harness.ts)를 통해 커맨드 팩토리에 접근합니다.
 */

// ═══════════════════════════════════════════════════════════════════
// Setup
// ═══════════════════════════════════════════════════════════════════

test.beforeEach(async ({ page }) => {
    await page.goto("/todo");
    await page.waitForFunction(
        () => (window as any).__todo !== undefined,
        null,
        { timeout: 10000 },
    );
});

// ═══════════════════════════════════════════════════════════════════
// 1. CRUD
// ═══════════════════════════════════════════════════════════════════

test.describe("Todo Headless: CRUD", () => {
    test("AddTodo via draft", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                const before = Object.keys(t.getState().data.todos).length;
                t.dispatch(t.cmd.SyncDraft({ text: "Playwright todo" }));
                t.dispatch(t.cmd.AddTodo({}));
                const after = t.getState();
                const afterCount = Object.keys(after.data.todos).length;
                const found = Object.values(after.data.todos).some((x: any) => x.text === "Playwright todo");
                return { before, afterCount, found, draft: after.ui.draft };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.afterCount).toBe(result.before + 1);
        expect(result.found).toBe(true);
        expect(result.draft).toBe("");
    });

    test("AddTodo with explicit text", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.AddTodo({ text: "Explicit text" }));
                const found = Object.values(t.getState().data.todos).some((x: any) => x.text === "Explicit text");
                return { found };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.found).toBe(true);
    });

    test("AddTodo with empty text → no-op", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                const before = Object.keys(t.getState().data.todos).length;
                t.dispatch(t.cmd.SyncDraft({ text: "" }));
                t.dispatch(t.cmd.AddTodo({}));
                const after = Object.keys(t.getState().data.todos).length;
                return { before, after };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.after).toBe(result.before);
    });

    test("DeleteTodo removes item", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.AddTodo({ text: "Delete me" }));
                const target = Object.values(t.getState().data.todos).find((x: any) => x.text === "Delete me") as any;
                t.dispatch(t.cmd.DeleteTodo({ id: target.id }));
                const gone = !Object.values(t.getState().data.todos).some((x: any) => x.text === "Delete me");
                return { gone };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.gone).toBe(true);
    });

    test("ToggleTodo flips completed", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.AddTodo({ text: "Toggle me" }));
                const target = Object.values(t.getState().data.todos).find((x: any) => x.text === "Toggle me") as any;
                t.dispatch(t.cmd.ToggleTodo({ id: target.id }));
                const on = t.getState().data.todos[target.id].completed;
                t.dispatch(t.cmd.ToggleTodo({ id: target.id }));
                const off = t.getState().data.todos[target.id].completed;
                return { on, off };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.on).toBe(true);
        expect(result.off).toBe(false);
    });

    test("ClearCompleted removes only completed", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                const uid = Date.now();
                t.dispatch(t.cmd.AddTodo({ text: `keep_${uid}` }));
                t.dispatch(t.cmd.AddTodo({ text: `clear_${uid}` }));

                const todos = t.getState().data.todos;
                const keepItem = Object.values(todos).find((x: any) => x.text === `keep_${uid}`) as any;
                const clearItem = Object.values(todos).find((x: any) => x.text === `clear_${uid}`) as any;

                if (!keepItem || !clearItem) return { error: "items not created" };

                t.dispatch(t.cmd.ToggleTodo({ id: clearItem.id }));
                t.dispatch(t.cmd.ClearCompleted());

                const after = t.getState().data.todos;
                return {
                    kept: keepItem.id in after,
                    cleared: !(clearItem.id in after),
                };
            } finally {
                t.setState(() => snap);
            }
        });
        if ("error" in result) {
            throw new Error(result.error as string);
        }
        expect(result.kept).toBe(true);
        expect(result.cleared).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Editing Flow
// ═══════════════════════════════════════════════════════════════════

test.describe("Todo Headless: Editing", () => {
    test("Start → SyncEditDraft → Save", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.AddTodo({ text: "Original" }));
                const target = Object.values(t.getState().data.todos).find((x: any) => x.text === "Original") as any;

                t.dispatch(t.cmd.StartEdit({ id: target.id }));
                const editingStarted = t.getState().ui.editingId === target.id;
                const draftInit = t.getState().ui.editDraft === "Original";

                t.dispatch(t.cmd.SyncEditDraft({ text: "Modified" }));
                const draftUpdated = t.getState().ui.editDraft === "Modified";

                t.dispatch(t.cmd.UpdateTodoText({ text: "Modified" }));
                const textSaved = t.getState().data.todos[target.id].text === "Modified";
                const editCleared = t.getState().ui.editingId === null;

                return { editingStarted, draftInit, draftUpdated, textSaved, editCleared };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.editingStarted).toBe(true);
        expect(result.draftInit).toBe(true);
        expect(result.draftUpdated).toBe(true);
        expect(result.textSaved).toBe(true);
        expect(result.editCleared).toBe(true);
    });

    test("Cancel preserves original", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.AddTodo({ text: "Keep Me" }));
                const target = Object.values(t.getState().data.todos).find((x: any) => x.text === "Keep Me") as any;

                t.dispatch(t.cmd.StartEdit({ id: target.id }));
                t.dispatch(t.cmd.SyncEditDraft({ text: "Changed" }));
                t.dispatch(t.cmd.CancelEdit());

                return {
                    preserved: t.getState().data.todos[target.id].text === "Keep Me",
                    editCleared: t.getState().ui.editingId === null,
                };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.preserved).toBe(true);
        expect(result.editCleared).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Category
// ═══════════════════════════════════════════════════════════════════

test.describe("Todo Headless: Category", () => {
    test("SelectCategory changes selectedCategoryId", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.SelectCategory({ id: "cat_work" }));
                const workSelected = t.getState().ui.selectedCategoryId === "cat_work";

                t.dispatch(t.cmd.SelectCategory({ id: "cat_inbox" }));
                const inboxSelected = t.getState().ui.selectedCategoryId === "cat_inbox";

                return { workSelected, inboxSelected };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.workSelected).toBe(true);
        expect(result.inboxSelected).toBe(true);
    });

    test("AddTodo assigns to selected category", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.SelectCategory({ id: "cat_work" }));
                t.dispatch(t.cmd.AddTodo({ text: "Work item" }));
                const workItem = Object.values(t.getState().data.todos).find((x: any) => x.text === "Work item") as any;
                return { categoryId: workItem?.categoryId };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.categoryId).toBe("cat_work");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. View Toggle
// ═══════════════════════════════════════════════════════════════════

test.describe("Todo Headless: View", () => {
    test("ToggleView switches list ↔ board", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                const initial = t.getState().ui.viewMode;
                t.dispatch(t.cmd.ToggleView());
                const toggled = t.getState().ui.viewMode;
                t.dispatch(t.cmd.ToggleView());
                const restored = t.getState().ui.viewMode;
                return { initial, toggled, restored };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.toggled).not.toBe(result.initial);
        expect(result.restored).toBe(result.initial);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Draft
// ═══════════════════════════════════════════════════════════════════

test.describe("Todo Headless: Draft", () => {
    test("SyncDraft updates state", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.SyncDraft({ text: "Hello" }));
                const set = t.getState().ui.draft === "Hello";
                t.dispatch(t.cmd.SyncDraft({ text: "" }));
                const cleared = t.getState().ui.draft === "";
                return { set, cleared };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.set).toBe(true);
        expect(result.cleared).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Clipboard (Duplicate)
// ═══════════════════════════════════════════════════════════════════

test.describe("Todo Headless: Clipboard", () => {
    test("DuplicateTodo creates copy", async ({ page }) => {
        const result = await page.evaluate(() => {
            const t = (window as any).__todo;
            const snap = t.getFullState();
            try {
                t.dispatch(t.cmd.AddTodo({ text: "Dup Original" }));
                const target = Object.values(t.getState().data.todos).find((x: any) => x.text === "Dup Original") as any;
                t.dispatch(t.cmd.DuplicateTodo({ id: target.id }));
                const copies = Object.values(t.getState().data.todos).filter((x: any) => x.text === "Dup Original");
                return { copyCount: copies.length };
            } finally {
                t.setState(() => snap);
            }
        });
        expect(result.copyCount).toBe(2);
    });
});
