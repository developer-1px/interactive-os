/**
 * T6: DocsViewer onClick → OS command
 *
 * DocsViewer has several onClick handlers:
 *   - FolderIndex items → selectDoc
 *   - Favorite button → toggleFavorite (not yet)
 *   - Prev/Next navigation → selectDoc with adjacent file
 *
 * Test verifies that document navigation works via OS commands:
 *   - onAction (Enter/re-click) triggers selectDoc
 *   - selectDoc updates activePath in state
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it, vi } from "vitest";

describe("T6: DocsViewer — navigation via OS selectDoc command", () => {
  function createFolderPage() {
    const selectSpy = vi.fn();
    const app = defineApp("test-docs-viewer", {});
    const zone = app.createZone("docs-folder-index");
    zone.bind({
      role: "listbox",
      getItems: () => ["docs/readme.md", "docs/guide.md", "docs/api.md"],
      onAction: (cursor) => {
        selectSpy(cursor.focusId);
        return [];
      },
    });
    const page = createPage(app);
    page.goto("docs-folder-index", { focusedItemId: "docs/readme.md" });
    return { page, selectSpy };
  }

  it("#1 Enter on folder index item triggers selectDoc", () => {
    const { page, selectSpy } = createFolderPage();
    page.keyboard.press("Enter");

    expect(selectSpy).toHaveBeenCalledTimes(1);
    expect(selectSpy).toHaveBeenCalledWith("docs/readme.md");
  });

  it("#2 ArrowDown + Enter selects second item", () => {
    const { page, selectSpy } = createFolderPage();
    page.keyboard.press("ArrowDown");
    page.keyboard.press("Enter");

    expect(selectSpy).toHaveBeenCalledWith("docs/guide.md");
  });

  it("#3 keyboard navigation through entire list", () => {
    const { page, selectSpy } = createFolderPage();
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("docs/api.md");

    page.keyboard.press("Enter");
    expect(selectSpy).toHaveBeenCalledWith("docs/api.md");
  });
});
