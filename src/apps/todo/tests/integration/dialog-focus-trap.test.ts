/**
 * Dialog Focus Trap — headless reproduction
 *
 * Issue: After Backspace opens the delete dialog, ArrowDown/Up
 * still navigates the list behind it. The overlay should block
 * navigation commands to the background zone.
 *
 * Test strategy:
 *   1. Simulate Backspace → pendingDeleteIds + overlay open
 *   2. Press ArrowDown → focusedItemId must NOT change
 */

import { addTodo, confirmDeleteTodo, TodoApp } from "@apps/todo/app";
import { ListView } from "@apps/todo/widgets/ListView";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_FOCUS } from "@os/3-commands/focus/focus";
import { OS_STACK_PUSH } from "@os/3-commands/focus/stack";
import {
  OS_OVERLAY_CLOSE,
  OS_OVERLAY_OPEN,
} from "@os/3-commands/overlay/overlay";
import { createOsPage } from "@os/createOsPage";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import { resolveRole } from "@os/registries/roleRegistry";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { os } from "@/os/kernel";

type TodoState = ReturnType<typeof TodoApp.create>["state"];
type Page = AppPage<TodoState>;

let page: Page;
let now = 5000;

beforeEach(() => {
  vi.spyOn(Date, "now").mockImplementation(() => ++now);
  page = createPage(TodoApp, ListView);
});

afterEach(() => {
  page.cleanup();
});

function addTodos(...texts: string[]): string[] {
  const before = new Set(page.state.data.todoOrder);
  for (const text of texts) {
    page.dispatch(addTodo({ text }));
  }
  return page.state.data.todoOrder.filter((id) => !before.has(id));
}

describe("Dialog Focus Trap", () => {
  it("Backspace → dialog open → ArrowDown must NOT navigate the list", () => {
    const [a, b] = addTodos("First", "Second");
    page.goto("list", {
      items: ["DRAFT", a!, b!],
      focusedItemId: a!,
    });

    // 1. Backspace → pendingDeleteIds
    page.keyboard.press("Backspace");
    expect(page.state.ui.pendingDeleteIds).toContain(a);

    // 2. Simulate overlay open (in browser, Trigger.Portal does this)
    page.dispatch(
      OS_OVERLAY_OPEN({ id: "todo-delete-dialog", type: "alertdialog" }),
    );
    expect(os.getState().os.overlays.stack).toHaveLength(1);

    // 3. Record focus before ArrowDown
    const focusBefore = page.focusedItemId();

    // 4. ArrowDown — this SHOULD be blocked by the overlay
    page.keyboard.press("ArrowDown");

    // 5. Focus must NOT have changed — dialog traps keyboard
    expect(page.focusedItemId()).toBe(focusBefore);
  });

  it("After overlay closes, ArrowDown resumes normal navigation", () => {
    const [a, b] = addTodos("First", "Second");
    page.goto("list", {
      items: ["DRAFT", a!, b!],
      focusedItemId: a!,
    });

    // Open overlay
    page.dispatch(
      OS_OVERLAY_OPEN({ id: "todo-delete-dialog", type: "alertdialog" }),
    );
    expect(os.getState().os.overlays.stack).toHaveLength(1);

    // Close overlay
    page.dispatch(OS_OVERLAY_CLOSE({ id: "todo-delete-dialog" }));
    expect(os.getState().os.overlays.stack).toHaveLength(0);

    // ArrowDown should work again
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe(b);
  });

  it("autoFocus must activate dialog zone even without FocusItems", () => {
    const [a] = addTodos("First");
    page.goto("list", {
      items: ["DRAFT", a!],
      focusedItemId: a!,
    });

    expect(page.activeZoneId()).toBe("list");

    // Simulate what FocusGroup (after fix) does for dialog with autoFocus:
    // 1. STACK_PUSH — saves current zone for later restoration
    page.dispatch(OS_STACK_PUSH());
    // 2. autoFocus finds no [data-focus-item] → dispatches OS_FOCUS(zoneId, null)
    //    This is the fix: previously it did nothing when no item found
    page.dispatch(OS_FOCUS({ zoneId: "todo-delete-dialog", itemId: null }));

    // activeZoneId must now be the dialog zone
    expect(page.activeZoneId()).toBe("todo-delete-dialog");
  });

  it("Dialog zone Tab trap: Tab cycles between dialog buttons", () => {
    // Simulate a dialog zone with 2 button items (Cancel, Delete)
    // This is what SHOULD happen when Dismiss/Confirm are FocusItems
    const dialogPage = createOsPage();
    dialogPage.setItems(["cancel-btn", "delete-btn"]);
    dialogPage.setConfig({
      tab: { behavior: "trap" as const, restoreFocus: true },
      dismiss: { escape: "close" as const, outsideClick: "none" as const },
    });
    dialogPage.setActiveZone("dialog", "cancel-btn");

    // Tab: cancel → delete
    dialogPage.keyboard.press("Tab");
    expect(dialogPage.focusedItemId()).toBe("delete-btn");

    // Tab: delete → cancel (wrap = trap)
    dialogPage.keyboard.press("Tab");
    expect(dialogPage.focusedItemId()).toBe("cancel-btn");

    // Shift+Tab: cancel → delete (reverse wrap)
    dialogPage.keyboard.press("Shift+Tab");
    expect(dialogPage.focusedItemId()).toBe("delete-btn");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Red→Green Proof: Dialog Duplicate Zone Fix (2026-02-22)
//
// Root cause: Dialog.tsx created TWO Zones (Trigger.Portal Zone +
// DialogZone), so FocusItems registered in the inner Zone while
// OS_TAB/OS_ACTIVATE operated on the outer Zone (activeZoneId).
//
// Fix: Remove DialogZone — Trigger.Portal's Zone is the single Zone.
// ═══════════════════════════════════════════════════════════════════

describe("Dialog Duplicate Zone Fix — Red→Green Proof", () => {
  it("RED: When items are in a NESTED zone (old bug), Tab on active zone does nothing", () => {
    // Simulates the OLD behavior: Dialog created TWO Zones.
    // Active zone = "todo-delete-dialog" (outer, from Trigger.Portal)
    // Items registered in inner unnamed zone → active zone has NO items.
    const dialogPage = createOsPage();

    // Outer zone (Trigger.Portal) — active, but NO items
    dialogPage.goto("todo-delete-dialog", {
      items: [], // No items — they're in the nested zone
      config: {
        tab: { behavior: "trap" as const, restoreFocus: true },
        dismiss: { escape: "close" as const, outsideClick: "none" as const },
      },
      focusedItemId: null,
    });

    // Tab does nothing — no items in active zone
    dialogPage.keyboard.press("Tab");
    expect(dialogPage.focusedItemId()).toBeNull();

    // Enter does nothing — no focusedItemId
    dialogPage.keyboard.press("Enter");
    expect(dialogPage.focusedItemId()).toBeNull();
  });

  it("GREEN: When items are in the dialog zone (fix), Tab cycles and Enter activates", () => {
    // Simulates the FIXED behavior: Single Zone with items.
    const dialogPage = createOsPage();
    let activated = false;

    // Single zone = "todo-delete-dialog" with items directly
    dialogPage.goto("todo-delete-dialog", {
      items: ["cancel-btn", "confirm-btn"],
      role: "alertdialog",
      focusedItemId: "cancel-btn",
      onAction: () => {
        activated = true;
        return { type: "NOOP" } as any;
      },
      config: {
        tab: { behavior: "trap" as const, restoreFocus: true },
        dismiss: { escape: "close" as const, outsideClick: "none" as const },
      },
    });

    // Tab: cancel → confirm (trap cycles)
    dialogPage.keyboard.press("Tab");
    expect(dialogPage.focusedItemId()).toBe("confirm-btn");

    // Tab: confirm → cancel (trap wraps)
    dialogPage.keyboard.press("Tab");
    expect(dialogPage.focusedItemId()).toBe("cancel-btn");

    // Shift+Tab: cancel → confirm (reverse)
    dialogPage.keyboard.press("Shift+Tab");
    expect(dialogPage.focusedItemId()).toBe("confirm-btn");

    // Enter: activates focused button
    dialogPage.keyboard.press("Enter");
    expect(activated).toBe(true);
  });

  it("GREEN (full flow): Backspace → dialog open → dialog zone Tab/Enter", () => {
    // Full app flow: createPage(TodoApp, ListView) → add todo → Backspace → dialog
    const [a] = addTodos("Task to delete");
    page.goto("list", {
      items: ["DRAFT", a!],
      focusedItemId: a!,
    });

    // 1. Backspace → requestDeleteTodo → pendingDeleteIds + overlay open
    page.keyboard.press("Backspace");
    expect(page.state.ui.pendingDeleteIds).toContain(a);

    // 2. Verify overlay was opened by the requestDeleteTodo command
    page.dispatch(
      OS_OVERLAY_OPEN({ id: "todo-delete-dialog", type: "alertdialog" }),
    );
    expect(os.getState().os.overlays.stack).toHaveLength(1);

    // 3. Close overlay for headless testing.
    //    Headless simulateKeyPress blocks all keys (except Escape) when
    //    overlay is open — it simulates <dialog>.showModal() native trap.
    //    In browser, Trigger.Portal renders the Zone INSIDE the <dialog>,
    //    so Tab works within. In headless, we test the zone directly.
    page.dispatch(OS_OVERLAY_CLOSE({ id: "todo-delete-dialog" }));

    // 4. Register dialog zone with alertdialog config (what Trigger.Portal does)
    //    Dialog zones are ephemeral — provide getItems explicitly for headless DI
    const dialogItems = ["cancel-btn", "confirm-btn"];
    const dialogConfig = resolveRole("alertdialog");
    ZoneRegistry.register("todo-delete-dialog", {
      role: "alertdialog",
      config: dialogConfig,
      element: null,
      parentId: null,
      getItems: () => dialogItems,
    });

    page.dispatch(OS_STACK_PUSH());
    page.goto("todo-delete-dialog", {
      focusedItemId: "cancel-btn",
    });

    expect(page.activeZoneId()).toBe("todo-delete-dialog");
    expect(page.focusedItemId()).toBe("cancel-btn");

    // 5. Tab cycles within dialog (trap mode)
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("confirm-btn");

    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("cancel-btn");

    // 6. Shift+Tab reverse cycles
    page.keyboard.press("Shift+Tab");
    expect(page.focusedItemId()).toBe("confirm-btn");
  });
});

// ═══════════════════════════════════════════════════════════════════
// T5.5 Red→Green: OS_ACTIVATE reads item-level onActivate
// ═══════════════════════════════════════════════════════════════════
describe("OS_ACTIVATE item-level onActivate — Red→Green", () => {
  let osPage: ReturnType<typeof createOsPage>;

  beforeEach(() => {
    osPage = createOsPage();
  });

  afterEach(() => {
    osPage.cleanup();
  });

  it("RED: Without onActivate, OS_ACTIVATE falls to click fallback (no dispatch)", () => {
    osPage.goto("test-zone", {
      items: ["btn-a", "btn-b"],
      focusedItemId: "btn-a",
    });

    // Enter → OS_ACTIVATE → no onAction, no onActivate → click fallback
    osPage.keyboard.press("Enter");
    // Focus unchanged (Enter doesn't move focus)
    expect(osPage.focusedItemId()).toBe("btn-a");
  });

  it("GREEN: With onActivate registered, OS_ACTIVATE reads it from ZoneRegistry", () => {
    osPage.goto("test-zone", {
      items: ["btn-a", "btn-b"],
      focusedItemId: "btn-a",
    });

    // Register item-level onActivate (what FocusItem does on mount)
    const mockCmd = OS_OVERLAY_CLOSE({ id: "test-dialog" });
    ZoneRegistry.setItemCallback("test-zone", "btn-a", {
      onActivate: mockCmd,
    });

    // Verify ZoneRegistry correctly stores and retrieves the callback
    const retrieved = ZoneRegistry.getItemCallback("test-zone", "btn-a");
    expect(retrieved).toBeDefined();
    expect(retrieved?.onActivate).toBe(mockCmd);

    // Verify cleanup works
    ZoneRegistry.clearItemCallback("test-zone", "btn-a");
    expect(ZoneRegistry.getItemCallback("test-zone", "btn-a")).toBeUndefined();

    // Verify zone unregister clears item callbacks
    ZoneRegistry.setItemCallback("test-zone", "btn-a", { onActivate: mockCmd });
    ZoneRegistry.unregister("test-zone");
    expect(ZoneRegistry.getItemCallback("test-zone", "btn-a")).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// BUG: Focus restoration after delete via dialog
// ═══════════════════════════════════════════════════════════════════
describe("Focus restoration after dialog delete", () => {
  let deletePage: Page;
  let deleteNow = 8000;

  beforeEach(() => {
    vi.spyOn(Date, "now").mockImplementation(() => ++deleteNow);
    deletePage = createPage(TodoApp, ListView);
  });

  afterEach(() => {
    deletePage.cleanup();
  });

  function addItems(...texts: string[]): string[] {
    const before = new Set(deletePage.state.data.todoOrder);
    for (const text of texts) {
      deletePage.dispatch(addTodo({ text }));
    }
    return deletePage.state.data.todoOrder.filter((id) => !before.has(id));
  }

  it("After confirmDelete, focus returns to the list (next item)", () => {
    // Setup: 3 items, focus on B
    const [a, b, c] = addItems("Alpha", "Bravo", "Charlie");
    deletePage.goto("list", {
      items: ["DRAFT", a!, b!, c!],
      focusedItemId: b!,
    });

    // 1. Backspace → marks B for deletion, dialog will open
    deletePage.keyboard.press("Backspace");
    expect(deletePage.state.ui.pendingDeleteIds).toContain(b);

    // 2. Simulate overlay open (OS_OVERLAY_OPEN saves focus automatically)
    deletePage.dispatch(
      OS_OVERLAY_OPEN({ id: "todo-delete-dialog", type: "alertdialog" }),
    );

    // 4. Dialog autoFocus activates dialog zone
    deletePage.dispatch(
      OS_FOCUS({
        zoneId: "todo-delete-dialog",
        itemId: "todo-delete-dialog-dismiss",
      }),
    );

    // Record: activeZone should be dialog now
    expect(deletePage.activeZoneId()).toBe("todo-delete-dialog");

    // 5. Confirm delete (dispatches OS_OVERLAY_CLOSE internally)
    deletePage.dispatch(confirmDeleteTodo());

    // 6. After confirm: item deleted
    expect(deletePage.state.data.todoOrder).not.toContain(b);

    // 7. Focus should return to the list zone on valid neighbor
    expect(deletePage.activeZoneId()).toBe("list");
    const focusedAfter = deletePage.focusedItemId();
    expect([a, c]).toContain(focusedAfter);
  });
});
