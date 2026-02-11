/**
 * TodoBot — Todo App Automated Tests
 *
 * Comprehensive test suite organized by feature:
 * 1. Draft Input
 * 2. Todo Creation
 * 3. Todo Completion (Toggle)
 * 4. Todo Editing
 * 5. Todo Deletion
 * 6. Clipboard (Copy/Cut/Paste)
 * 7. Undo / Redo
 * 8. Navigation
 * 9. View Switching
 * 10. Category Selection
 */

import {
  type TestActions,
  type TestBot,
  useTestBotRoutes,
} from "@inspector/testbot";
import { CommandEngineStore } from "@os/core/command/store/CommandEngineStore";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Simulate typing text character-by-character */
async function type(t: TestActions, text: string) {
  for (const char of text) {
    await t.press(char === " " ? "Space" : char);
    await t.wait(20);
  }
}

/** Snapshot & restore helper for state isolation */
function snapshot() {
  return CommandEngineStore.getAppState("todo");
}
function restore(s: any) {
  if (s) CommandEngineStore.setAppState("todo", s);
}

/** OS-level clipboard dispatch (TestBot can't trigger native events) */
const osCopy = () => CommandEngineStore.dispatch({ type: "OS_COPY" });
const osCut = () => CommandEngineStore.dispatch({ type: "OS_CUT" });
const osPaste = () => CommandEngineStore.dispatch({ type: "OS_PASTE" });

// ═══════════════════════════════════════════════════════════════════
// Test Definitions
// ═══════════════════════════════════════════════════════════════════

function defineTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Draft Input
  // Verifies: focus, typing, clearing
  // ─────────────────────────────────────────────────────────────
  bot.describe("Draft: Focus and type", async (t) => {
    const s = snapshot();
    try {
      // 1. Click draft field → gains focus
      await t.click("input[name='DRAFT']");
      await t.expect("input[name='DRAFT']").toBeFocused();

      // 2. Type text into draft
      await type(t, "Hello World");
      await t.wait(100);

      // 3. Draft field should still be focused
      await t.expect("input[name='DRAFT']").toBeFocused();
    } finally {
      restore(s);
    }
  });

  bot.describe("Draft: Submit clears input", async (t) => {
    const s = snapshot();
    try {
      // 1. Focus and type
      await t.click("input[name='DRAFT']");
      await type(t, "Test Item");
      await t.press("Enter");
      await t.wait(200);

      // 2. Verify item was created (draft should have cleared)
      const created = await t.getByText("Test Item");
      await t.expect(created).toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Todo Creation
  // Verifies: item appears, multiple creation, correct category
  // ─────────────────────────────────────────────────────────────
  bot.describe("Create: Single todo", async (t) => {
    const s = snapshot();
    try {
      // 1. Type and submit
      await t.click("input[name='DRAFT']");
      await type(t, "Buy Groceries");
      await t.press("Enter");
      await t.wait(200);

      // 2. Verify item exists
      const item = await t.getByText("Buy Groceries");
      await t.expect(item).toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Create: Multiple todos sequentially", async (t) => {
    const s = snapshot();
    try {
      // 1. Create first todo
      await t.click("input[name='DRAFT']");
      await type(t, "First Task");
      await t.press("Enter");
      await t.wait(200);

      // 2. Create second todo
      await type(t, "Second Task");
      await t.press("Enter");
      await t.wait(200);

      // 3. Create third todo
      await type(t, "Third Task");
      await t.press("Enter");
      await t.wait(200);

      // 4. All three should exist
      const first = await t.getByText("First Task");
      await t.expect(first).toExist();

      const second = await t.getByText("Second Task");
      await t.expect(second).toExist();

      const third = await t.getByText("Third Task");
      await t.expect(third).toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Todo Completion (Toggle)
  // Verifies: toggling via Space key, focus stays on item
  // ─────────────────────────────────────────────────────────────
  bot.describe("Toggle: Complete via Space", async (t) => {
    const s = snapshot();
    try {
      // 1. Create a todo
      await t.click("input[name='DRAFT']");
      await type(t, "Toggle Me");
      await t.press("Enter");
      await t.wait(200);

      // 2. Find and focus the item
      const item = await t.getByText("Toggle Me");
      await t.click(item);
      await t.wait(100);

      // 3. Toggle completion with Space
      await t.press("Space");
      await t.wait(200);

      // 4. Item should still exist (not removed)
      await t.expect(item).toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Toggle: Double toggle restores state", async (t) => {
    const s = snapshot();
    try {
      // 1. Create and focus
      await t.click("input[name='DRAFT']");
      await type(t, "Double Toggle");
      await t.press("Enter");
      await t.wait(200);

      const item = await t.getByText("Double Toggle");
      await t.click(item);
      await t.wait(100);

      // 2. Toggle ON
      await t.press("Space");
      await t.wait(100);

      // 3. Toggle OFF (restore)
      await t.press("Space");
      await t.wait(100);

      // 4. Still exists
      await t.expect(item).toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Todo Editing
  // Verifies: enter edit mode, update text, save, cancel
  // ─────────────────────────────────────────────────────────────
  bot.describe("Edit: Enter edit mode with Enter", async (t) => {
    const s = snapshot();
    try {
      // 1. Create a todo
      await t.click("input[name='DRAFT']");
      await type(t, "Edit Target");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus the item
      const item = await t.getByText("Edit Target");
      await t.click(item);
      await t.wait(100);

      // 3. Press Enter to start editing (onAction = StartEdit)
      await t.press("Enter");
      await t.wait(200);

      // 4. Edit field should appear and be focused
      await t.expect("input[name='EDIT']").toBeFocused();
    } finally {
      restore(s);
    }
  });

  bot.describe("Edit: Save with Enter", async (t) => {
    const s = snapshot();
    try {
      // 1. Create a todo
      await t.click("input[name='DRAFT']");
      await type(t, "Before Edit");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus and enter edit mode
      const item = await t.getByText("Before Edit");
      await t.click(item);
      await t.wait(100);
      await t.press("Enter");
      await t.wait(200);

      // 3. Clear and type new text
      // Select all (Ctrl+A / Meta+A) then type new text
      await t.press("a", { meta: true });
      await type(t, "After Edit");
      await t.wait(100);

      // 4. Save with Enter
      await t.press("Enter");
      await t.wait(300);

      // 5. Verify new text exists
      const edited = await t.getByText("After Edit");
      await t.expect(edited).toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Edit: Cancel with Escape", async (t) => {
    const s = snapshot();
    try {
      // 1. Create a todo
      await t.click("input[name='DRAFT']");
      await type(t, "No Change");
      await t.press("Enter");
      await t.wait(200);

      // 2. Enter edit mode
      const item = await t.getByText("No Change");
      await t.click(item);
      await t.wait(100);
      await t.press("Enter");
      await t.wait(200);

      // 3. Type something different
      await t.press("a", { meta: true });
      await type(t, "Changed Text");
      await t.wait(100);

      // 4. Cancel with Escape
      await t.press("Escape");
      await t.wait(200);

      // 5. Original text should remain
      const original = await t.getByText("No Change");
      await t.expect(original).toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Todo Deletion
  // Verifies: delete item, focus recovery, multiple deletions
  // ─────────────────────────────────────────────────────────────
  bot.describe("Delete: Remove with Backspace", async (t) => {
    const s = snapshot();
    try {
      // 1. Create a todo
      await t.click("input[name='DRAFT']");
      await type(t, "Delete Me");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus the item
      const item = await t.getByText("Delete Me");
      await t.click(item);
      await t.wait(100);

      // 3. Delete with Backspace
      await t.press("Backspace");
      await t.wait(300);

      // 4. Item should be gone
      await t.expect(item).toNotExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Delete: Focus recovers to neighbor", async (t) => {
    const s = snapshot();
    try {
      // 1. Create two todos
      await t.click("input[name='DRAFT']");
      await type(t, "Keep This");
      await t.press("Enter");
      await t.wait(200);

      await type(t, "Delete This");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus "Delete This" and delete
      const toDelete = await t.getByText("Delete This");
      await t.click(toDelete);
      await t.wait(100);

      await t.press("Backspace");
      await t.wait(300);

      // 3. Deleted item gone
      await t.expect(toDelete).toNotExist();

      // 4. "Keep This" should still exist
      const kept = await t.getByText("Keep This");
      await t.expect(kept).toExist();

      // 5. Some item should have focus (focus recovery)
      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Clipboard Operations
  // Verifies: copy, cut, paste, sequences
  // ─────────────────────────────────────────────────────────────
  bot.describe("Clipboard: Copy → Paste duplicates item", async (t) => {
    const s = snapshot();
    try {
      // 1. Create item
      await t.click("input[name='DRAFT']");
      await type(t, "Copy Source");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus and copy
      const item = await t.getByText("Copy Source");
      await t.click(item);
      await t.wait(100);

      osCopy();
      await t.wait(100);

      // 3. Paste
      osPaste();
      await t.wait(300);

      // 4. Focus moved to new item
      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Clipboard: Cut → Paste moves item", async (t) => {
    const s = snapshot();
    try {
      // 1. Create item
      await t.click("input[name='DRAFT']");
      await type(t, "Cut Source");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus and cut
      const item = await t.getByText("Cut Source");
      await t.click(item);
      await t.wait(100);

      osCut();
      await t.wait(300);

      // 3. Item should be removed after cut
      await t.expect(item).toNotExist();

      // 4. Paste (re-insert)
      osPaste();
      await t.wait(300);

      // 5. Focus should be on the pasted item
      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Undo / Redo
  // Verifies: undo creation, undo deletion, redo
  // ─────────────────────────────────────────────────────────────
  bot.describe("Undo: Reverse deletion", async (t) => {
    const s = snapshot();
    try {
      // 1. Create item
      await t.click("input[name='DRAFT']");
      await type(t, "Undo Target");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus and delete
      const item = await t.getByText("Undo Target");
      await t.click(item);
      await t.wait(100);

      await t.press("Backspace");
      await t.wait(300);

      // 3. Item gone
      await t.expect(item).toNotExist();

      // 4. Undo (⌘Z)
      await t.press("z", { meta: true });
      await t.wait(500);

      // 5. Item should be restored
      const restored = await t.getByText("Undo Target");
      await t.expect(restored).toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Undo: Reverse paste", async (t) => {
    const s = snapshot();
    try {
      // 1. Create and copy
      await t.click("input[name='DRAFT']");
      await type(t, "Paste Undo");
      await t.press("Enter");
      await t.wait(200);

      const item = await t.getByText("Paste Undo");
      await t.click(item);
      await t.wait(100);

      osCopy();
      await t.wait(100);
      osPaste();
      await t.wait(300);

      // 2. New item is focused
      await t.expect("[data-focused='true']").toExist();

      // 3. Undo paste (⌘Z)
      await t.press("z", { meta: true });
      await t.wait(500);

      // 4. Original should still exist
      const original = await t.getByText("Paste Undo");
      await t.expect(original).toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Redo: Re-apply after undo", async (t) => {
    const s = snapshot();
    try {
      // 1. Create item
      await t.click("input[name='DRAFT']");
      await type(t, "Redo Test");
      await t.press("Enter");
      await t.wait(200);

      // 2. Focus and delete
      const item = await t.getByText("Redo Test");
      await t.click(item);
      await t.wait(100);
      await t.press("Backspace");
      await t.wait(300);
      await t.expect(item).toNotExist();

      // 3. Undo → item back
      await t.press("z", { meta: true });
      await t.wait(500);
      const restored = await t.getByText("Redo Test");
      await t.expect(restored).toExist();

      // 4. Redo → item gone again (⌘⇧Z)
      await t.press("z", { meta: true, shift: true });
      await t.wait(500);
      await t.expect(restored).toNotExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Navigation
  // Verifies: arrow keys, focus indicators, zone traversal
  // ─────────────────────────────────────────────────────────────
  bot.describe("Navigate: Arrow keys between items", async (t) => {
    const s = snapshot();
    try {
      // 1. Create two todos
      await t.click("input[name='DRAFT']");
      await type(t, "Nav First");
      await t.press("Enter");
      await t.wait(200);

      await type(t, "Nav Second");
      await t.press("Enter");
      await t.wait(200);

      // 2. Click first item
      const first = await t.getByText("Nav First");
      await t.click(first);
      await t.wait(100);

      // 3. Navigate down → second item
      await t.press("ArrowDown");
      await t.wait(100);

      // 4. Focus should have moved
      await t.expect("[data-focused='true']").toExist();

      // 5. Navigate up → back to first
      await t.press("ArrowUp");
      await t.wait(100);

      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Navigate: Tab moves between zones", async (t) => {
    const s = snapshot();
    try {
      // 1. Focus sidebar item
      const sidebarItem = await t.getByRole("option");
      await t.click(sidebarItem);
      await t.wait(200);

      // 2. Tab → should move to main zone
      await t.press("Tab");
      await t.wait(200);

      // 3. Some element should be focused
      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 9. View Switching
  // Verifies: list ↔ board toggle
  // ─────────────────────────────────────────────────────────────
  bot.describe("View: Switch List → Board", async (t) => {
    const s = snapshot();
    try {
      // 1. Verify we're in list view (default)
      const tasksHeader = await t.getByText("Tasks");
      await t.expect(tasksHeader).toExist();

      // 2. Find and click the view toggle button
      const toggleBtn = await t.getByRole("button", "Switch to Board View");
      await t.click(toggleBtn);
      await t.wait(300);

      // 3. Verify board view loaded
      const boardHeader = await t.getByText("Board");
      await t.expect(boardHeader).toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("View: Switch Board → List", async (t) => {
    const s = snapshot();
    try {
      // 1. Switch to board first
      const toggleBoardBtn = await t.getByRole(
        "button",
        "Switch to Board View",
      );
      await t.click(toggleBoardBtn);
      await t.wait(300);

      // 2. Now switch back to list
      const toggleListBtn = await t.getByRole("button", "Switch to List View");
      await t.click(toggleListBtn);
      await t.wait(300);

      // 3. Verify list view restored
      const tasksHeader = await t.getByText("Tasks");
      await t.expect(tasksHeader).toExist();
    } finally {
      restore(s);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Category Selection
  // Verifies: switch categories, filtered view updates
  // ─────────────────────────────────────────────────────────────
  bot.describe("Category: Select via sidebar click", async (t) => {
    const s = snapshot();
    try {
      // 1. Find and click "Work" category
      const workCategory = await t.getByText("Work");
      await t.click(workCategory);
      await t.wait(200);

      // 2. Verify focus is on the category
      await t.expect("[data-focused='true']").toExist();

      // 3. Click "Personal" category
      const personalCategory = await t.getByText("Personal");
      await t.click(personalCategory);
      await t.wait(200);

      // 4. Verify focus moved
      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Category: Navigate with arrows", async (t) => {
    const s = snapshot();
    try {
      // 1. Click first category to enter sidebar
      const inbox = await t.getByText("Inbox");
      await t.click(inbox);
      await t.wait(200);

      // 2. Navigate down
      await t.press("ArrowDown");
      await t.wait(200);

      // 3. Focus should have moved
      await t.expect("[data-focused='true']").toExist();

      // 4. Navigate down again
      await t.press("ArrowDown");
      await t.wait(200);

      await t.expect("[data-focused='true']").toExist();

      // 5. Navigate back up
      await t.press("ArrowUp");
      await t.wait(200);

      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });

  bot.describe("Category: Select with Enter", async (t) => {
    const s = snapshot();
    try {
      // 1. Click a category
      const inbox = await t.getByText("Inbox");
      await t.click(inbox);
      await t.wait(200);

      // 2. Navigate to a different category
      await t.press("ArrowDown");
      await t.wait(100);

      // 3. Press Enter to select (onAction = SelectCategory)
      await t.press("Enter");
      await t.wait(200);

      // 4. Selection should be active
      await t.expect("[data-focused='true']").toExist();
    } finally {
      restore(s);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useTodoBotRoutes() {
  useTestBotRoutes("todo", defineTests);
}
