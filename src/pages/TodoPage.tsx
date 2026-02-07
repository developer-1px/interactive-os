import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { Zone } from "@os/app/export/primitives/Zone.tsx";
import { CommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { useTestBotRoutes } from "@os/testBot/useTestBotRoutes";

export default function TodoPage() {
  // TestBot scenarios for clipboard operations
  useTestBotRoutes("todo", (bot) => {
    /**
     * Clipboard commands use CommandEngineStore.dispatch() because:
     * - ⌘C/⌘X/⌘V keybindings were removed (handled by ClipboardSensor's native DOM events)
     * - TestBot's synthetic keyup events don't trigger native clipboard events
     * - ClipboardIntent listens for OS_COPY/OS_CUT/OS_PASTE and routes to Zone
     *
     * Selectors: numeric IDs need [id='N'] format (CSS #1 is invalid)
     */
    const copy = () => CommandEngineStore.dispatchOS({ type: "OS_COPY" });
    const cut = () => CommandEngineStore.dispatchOS({ type: "OS_CUT" });
    const paste = () => CommandEngineStore.dispatchOS({ type: "OS_PASTE" });

    // Item selectors for Work category (items 2, 3 are in "Work")
    const ITEM_A = "[id='2']";
    const ITEM_B = "[id='3']";

    bot.describe("Copy → Paste places item and focuses it", async (t) => {
      const snapshot = CommandEngineStore.getAppState("todo");

      try {
        // Click first Work todo item to focus it
        await t.click(ITEM_A);
        await t.expect(ITEM_A).toHaveAttr("data-focused", "true");

        // Copy → Paste via OS commands
        copy();
        await t.wait(100);
        paste();
        await t.wait(300);

        // Verify: a focused item exists (the pasted copy)
        await t.expect("[data-focused=true]").toExist();

        // Verify: the original item lost focus (new pasted item is focused)
        await t.expect(ITEM_A).toNotHaveAttr("data-focused", "true");
      } finally {
        if (snapshot) CommandEngineStore.setAppState("todo", snapshot);
      }
    });

    bot.describe("Cut → Paste moves item and focuses it", async (t) => {
      const snapshot = CommandEngineStore.getAppState("todo");

      try {
        await t.click(ITEM_B);
        await t.expect(ITEM_B).toHaveAttr("data-focused", "true");

        // Cut (item should disappear)
        cut();
        await t.wait(300);
        await t.expect(ITEM_B).toNotExist();

        // Paste (item should reappear and be focused)
        paste();
        await t.wait(300);
        await t.expect("[data-focused=true]").toExist();
      } finally {
        if (snapshot) CommandEngineStore.setAppState("todo", snapshot);
      }
    });

    bot.describe("Undo reverses paste", async (t) => {
      const snapshot = CommandEngineStore.getAppState("todo");

      try {
        // Copy and paste
        await t.click(ITEM_A);

        copy();
        await t.wait(100);
        paste();
        await t.wait(300);

        // Verify paste succeeded (original item lost focus)
        await t.expect(ITEM_A).toNotHaveAttr("data-focused", "true");

        // Undo (⌘Z keybinding still exists)
        await t.press("z", { meta: true });
        await t.wait(500);

        // Verify: focus should be back on original item
        await t.expect(ITEM_A).toHaveAttr("data-focused", "true");
      } finally {
        if (snapshot) CommandEngineStore.setAppState("todo", snapshot);
      }
    });

    bot.describe("Delete restores focus to neighbor", async (t) => {
      const snapshot = CommandEngineStore.getAppState("todo");

      try {
        // Focus item A (first item in Work)
        await t.click(ITEM_A);
        await t.expect(ITEM_A).toHaveAttr("data-focused", "true");

        // Delete via Backspace
        await t.press("Backspace");
        await t.wait(300);

        // Item A should be gone
        await t.expect(ITEM_A).toNotExist();

        // Focus should auto-recover to a neighbor (OS-level)
        await t.expect("[data-focused=true]").toExist();
      } finally {
        if (snapshot) CommandEngineStore.setAppState("todo", snapshot);
      }
    });
  });

  return (
    <Zone id="main" role="toolbar" className="h-full flex">


      {/* 1. Category Navigation (Isolated Component) */}
      <Sidebar />

      {/* 2. Main Work Area (Isolated Component) */}
      <TodoPanel />
    </Zone>
  );
}

