/**
 * T5: DocsDashboard onClick → OS selectDoc command
 *
 * DocsDashboard uses raw onClick to call onSelect(path).
 * OS way: clicking an item dispatches selectDoc command.
 *
 * For dashboard navigation, first click = immediate action (not re-click).
 * We use selectDoc command dispatched via onAction callback.
 */

import { defineApp } from "@os-sdk/app/defineApp/index";
import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it, vi } from "vitest";

describe("T5: DocsDashboard — selectDoc via OS command", () => {
  function createDashboardPage() {
    const selectDocSpy = vi.fn();
    const app = defineApp("test-docs-dashboard", {});
    const zone = app.createZone("docs-dashboard-inbox");
    zone.bind({
      role: "listbox",
      getItems: () => ["0-inbox/note1.md", "0-inbox/note2.md"],
      onAction: (cursor) => {
        selectDocSpy(cursor.focusId);
        return [];
      },
    });
    const page = createPage(app);
    page.goto("docs-dashboard-inbox", { focusedItemId: "0-inbox/note1.md" });
    return { page, selectDocSpy };
  }

  it("#1 Enter on focused item dispatches selectDoc", () => {
    const { page, selectDocSpy } = createDashboardPage();
    page.keyboard.press("Enter");

    expect(selectDocSpy).toHaveBeenCalledTimes(1);
    expect(selectDocSpy).toHaveBeenCalledWith("0-inbox/note1.md");
  });

  it("#2 navigating then Enter selects correct item", () => {
    const { page, selectDocSpy } = createDashboardPage();
    page.keyboard.press("ArrowDown");
    page.keyboard.press("Enter");

    expect(selectDocSpy).toHaveBeenCalledWith("0-inbox/note2.md");
  });

  it("#3 click focuses, then Enter activates", () => {
    const { page, selectDocSpy } = createDashboardPage();
    page.click("0-inbox/note2.md");
    expect(page.focusedItemId()).toBe("0-inbox/note2.md");

    page.keyboard.press("Enter");
    expect(selectDocSpy).toHaveBeenCalledWith("0-inbox/note2.md");
  });
});
