/**
 * T5: DocsDashboard onClick → OS selectDoc command
 *
 * DocsDashboard uses raw onClick to call onSelect(path).
 * OS way: clicking an item dispatches selectDoc command.
 *
 * For dashboard navigation, first click = immediate action (not re-click).
 * We use selectDoc command dispatched via onAction callback.
 *
 * Note: Uses onTestFailed + dumpDiagnostics (test-observability validation)
 */

import { defineScope } from "@kernel";
import { createOsPage, type OsPage } from "@os/createOsPage";
import { produce } from "immer";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFailed,
  vi,
} from "vitest";

describe("T5: DocsDashboard — selectDoc via OS command", () => {
  let page: OsPage;
  const selectDocSpy = vi.fn();

  beforeEach(() => {
    page = createOsPage();
    page.goto("docs-dashboard-inbox", {
      role: "list",
      items: ["0-inbox/note1.md", "0-inbox/note2.md"],
      onAction: (cursor) => {
        selectDocSpy(cursor.focusId);
      },
    });

    onTestFailed(() => page.dumpDiagnostics());
  });

  afterEach(() => {
    selectDocSpy.mockClear();
    page.cleanup();
  });

  it("#1 Enter on focused item dispatches selectDoc", () => {
    page.keyboard.press("Enter");

    expect(selectDocSpy).toHaveBeenCalledTimes(1);
    expect(selectDocSpy).toHaveBeenCalledWith("0-inbox/note1.md");
  });

  it("#2 navigating then Enter selects correct item", () => {
    page.keyboard.press("ArrowDown");
    page.keyboard.press("Enter");

    expect(selectDocSpy).toHaveBeenCalledWith("0-inbox/note2.md");
  });

  it("#3 click focuses, then Enter activates", () => {
    page.click("0-inbox/note2.md");
    expect(page.focusedItemId()).toBe("0-inbox/note2.md");

    page.keyboard.press("Enter");
    expect(selectDocSpy).toHaveBeenCalledWith("0-inbox/note2.md");
  });
});
