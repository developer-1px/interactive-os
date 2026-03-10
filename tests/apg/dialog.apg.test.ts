/**
 * APG Dialog (Modal) Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Config: vertical, Tab=trap, Escape=close
 * Unique: focus trap (Tab cycling), overlay focus restore
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createPage } from "@os-testing/page";
import { expect as osExpect } from "@os-testing/expect";
import type { Page } from "@os-testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";
import { assertTabTrap } from "./helpers/contracts";

const expect = osExpect;

// ─── Config ───

const DIALOG_ITEMS = ["close-btn", "input-name", "input-email", "save-btn"];

function createDialogApp(entry: "first" | "last" = "first"): {
  page: Page;
  cleanup: () => void;
} {
  const app = defineApp("test-dialog", {});

  const toolbar = app.createZone("toolbar");
  toolbar.bind("toolbar", {
    getItems: () => ["InvokeBtn"],
    triggers: {
      InvokeBtn: () =>
        OS_OVERLAY_OPEN({
          id: "dialog",
          type: "dialog",
          entry: entry,
        }),
    },
  });

  const dialog = app.createZone("dialog");
  dialog.bind("group", {
    getItems: () => DIALOG_ITEMS,
    options: {
      tab: { behavior: "trap" as const },
      dismiss: { escape: "close" as const },
    },
  });

  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click("InvokeBtn");
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Shared contracts (page.locator → assertions)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Trap", () => {
  assertTabTrap(() => createDialogApp(), {
    firstId: "close-btn",
    lastId: "save-btn",
    factoryAtFirst: () => createDialogApp("first"),
    factoryAtLast: () => createDialogApp("last"),
  });

  it("Tab cycles through all elements without escaping", async () => {
    const { page, cleanup } = createDialogApp();

    await expect(page.locator("#close-btn")).toBeFocused();

    page.keyboard.press("Tab");
    await expect(page.locator("#input-name")).toBeFocused();
    await expect(page.locator("#input-name")).toHaveAttribute("tabindex", "0");

    page.keyboard.press("Tab");
    await expect(page.locator("#input-email")).toBeFocused();

    page.keyboard.press("Tab");
    await expect(page.locator("#save-btn")).toBeFocused();

    page.keyboard.press("Tab");
    await expect(page.locator("#close-btn")).toBeFocused();

    cleanup();
  });
});

describe("APG Dialog: Escape", () => {
  it("Escape: closes overlay and restores focus to invoker", async () => {
    const { page, cleanup } = createDialogApp();

    // Dialog is open, close-btn focused
    await expect(page.locator("#close-btn")).toBeFocused();

    page.keyboard.press("Escape");

    // Focus restores to toolbar trigger
    await expect(page.locator("#InvokeBtn")).toBeFocused();
    await expect(page.locator("#InvokeBtn")).toHaveAttribute("tabindex", "0");

    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Unique: Focus Restore via Overlay Lifecycle
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Restore", () => {
  it("nested dialogs: LIFO focus restore", async () => {
    const app = defineApp("test-dialog-nested", {});

    const toolbar = app.createZone("toolbar");
    toolbar.bind("toolbar", {
      getItems: () => ["Btn1"],
      triggers: {
        Btn1: () =>
          OS_OVERLAY_OPEN({
            id: "dialog-1",
            type: "dialog",
            entry: "first",
          }),
      },
    });

    const d1 = app.createZone("dialog-1");
    d1.bind("group", {
      getItems: () => ["d1-close", "D1NestedBtn"],
      options: {
        tab: { behavior: "trap" as const },
        dismiss: { escape: "close" as const },
      },
      triggers: {
        D1NestedBtn: () =>
          OS_OVERLAY_OPEN({
            id: "dialog-2",
            type: "dialog",
            entry: "first",
          }),
      },
    });

    const d2 = app.createZone("dialog-2");
    d2.bind("group", {
      getItems: () => ["d2-yes", "d2-no"],
      options: {
        tab: { behavior: "trap" as const },
        dismiss: { escape: "close" as const },
      },
    });

    const { page, cleanup } = createPage(app);
    page.goto("/");

    // Open first dialog
    page.click("Btn1");
    await expect(page.locator("#d1-close")).toBeFocused();

    // Navigate to nested trigger and open second dialog
    page.keyboard.press("Tab");
    page.click("D1NestedBtn");
    await expect(page.locator("#d2-yes")).toBeFocused();

    // Escape closes dialog-2 → restores to dialog-1
    page.keyboard.press("Escape");
    await expect(page.locator("#D1NestedBtn")).toBeFocused();

    // Escape closes dialog-1 → restores to toolbar
    page.keyboard.press("Escape");
    await expect(page.locator("#Btn1")).toBeFocused();

    cleanup();
  });
});
