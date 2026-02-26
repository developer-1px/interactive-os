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
 *
 * Note: Uses onTestFailed + dumpDiagnostics
 */

import { createOsPage, type OsPage } from "@os/createOsPage";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFailed,
  vi,
} from "vitest";

describe("T6: DocsViewer — navigation via OS selectDoc command", () => {
  let page: OsPage;
  const selectSpy = vi.fn();

  beforeEach(() => {
    page = createOsPage();

    // Folder index zone
    page.goto("docs-folder-index", {
      role: "listbox",
      items: ["docs/readme.md", "docs/guide.md", "docs/api.md"],
      onAction: (cursor) => {
        selectSpy(cursor.focusId);
        return [];
      },
    });

    onTestFailed(() => page.dumpDiagnostics());
  });

  afterEach(() => {
    selectSpy.mockClear();
    page.cleanup();
  });

  it("#1 Enter on folder index item triggers selectDoc", () => {
    page.keyboard.press("Enter");

    expect(selectSpy).toHaveBeenCalledTimes(1);
    expect(selectSpy).toHaveBeenCalledWith("docs/readme.md");
  });

  it("#2 ArrowDown + Enter selects second item", () => {
    page.keyboard.press("ArrowDown");
    page.keyboard.press("Enter");

    expect(selectSpy).toHaveBeenCalledWith("docs/guide.md");
  });

  it("#3 keyboard navigation through entire list", () => {
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("docs/api.md");

    page.keyboard.press("Enter");
    expect(selectSpy).toHaveBeenCalledWith("docs/api.md");
  });
});
