/**
 * Tree Expand — Pipeline Test
 *
 * Architecture:
 *   mousedown → resolveMouse → OS_FOCUS + OS_SELECT (NO expand for treeitem)
 *   click     → resolveClick → OS_ACTIVATE → expandable? → OS_EXPAND
 *
 * mousedown에서 expand를 하면 click에서 또 expand → double toggle.
 * 따라서 treeitem은 mousedown에서 expand 제외 (KEYBOARD_ONLY_EXPAND_ROLES).
 *
 * 이 테스트는 두 경로를 각각 검증한다:
 * 1. resolveMouse: treeitem → OS_ACTIVATE 안 함
 * 2. resolveClick: activateOnClick → OS_ACTIVATE 함
 * 3. keyboard: ArrowRight/Left → expand 토글 (기존)
 */

import { resolveClick } from "@os/1-listeners/mouse/resolveClick";
import {
  isClickExpandable,
  type MouseInput,
  resolveMouse,
} from "@os/1-listeners/mouse/resolveMouse";
import { createOsPage } from "@os/createOsPage";
import { describe, expect, it, vi } from "vitest";

function baseInput(overrides: Partial<MouseInput> = {}): MouseInput {
  return {
    targetItemId: "folder:api",
    targetGroupId: "test-tree",
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    isLabel: false,
    labelTargetItemId: null,
    labelTargetGroupId: null,
    hasAriaExpanded: true,
    itemRole: "treeitem",
    ...overrides,
  };
}

describe("Tree Expand: mousedown vs click", () => {
  it("mousedown on treeitem does NOT include OS_ACTIVATE", () => {
    const result = resolveMouse(baseInput());
    expect(result.commands.some((c) => c.type === "OS_ACTIVATE")).toBe(false);
    expect(result.commands.some((c) => c.type === "OS_FOCUS")).toBe(true);
    expect(result.commands.some((c) => c.type === "OS_SELECT")).toBe(true);
  });

  it("click with activateOnClick dispatches OS_ACTIVATE (re-click on focused item)", () => {
    const result = resolveClick({
      activateOnClick: true,
      clickedItemId: "folder:api",
      focusedItemId: "folder:api", // same → re-click
    });
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_ACTIVATE");
  });

  it("click without activateOnClick does NOT dispatch", () => {
    const result = resolveClick({
      activateOnClick: false,
      clickedItemId: "folder:api",
      focusedItemId: "folder:api",
    });
    expect(result.commands).toHaveLength(0);
  });

  it("button role treeitem difference — button expands on mousedown", () => {
    expect(isClickExpandable(true, "button")).toBe(true);
    expect(isClickExpandable(true, "treeitem")).toBe(false);
    expect(isClickExpandable(true, "menuitem")).toBe(false);
  });
});

describe("Tree Expand: keyboard (ArrowRight/Left)", () => {
  function treeFactory(focusedItem = "folder:api") {
    const onAction = vi.fn();
    const page = createOsPage();
    page.setItems([
      "folder:api",
      "api/auth",
      "api/users",
      "folder:docs",
      "docs/readme",
    ]);
    page.setExpandableItems(["folder:api", "folder:docs"]);
    page.setTreeLevels({
      "folder:api": 1,
      "api/auth": 2,
      "api/users": 2,
      "folder:docs": 1,
      "docs/readme": 2,
    });
    page.setRole("test-tree", "tree", { onAction });
    page.setConfig({
      navigate: {
        orientation: "vertical",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
        arrowExpand: true,
      },
      select: {
        mode: "single",
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: true,
      },
    });
    page.setActiveZone("test-tree", focusedItem);
    return { page, onAction };
  }

  it("ArrowRight expands folder", () => {
    const { page } = treeFactory("folder:api");
    page.keyboard.press("ArrowRight");
    expect(page.zone()?.expandedItems).toContain("folder:api");
  });

  it("ArrowLeft collapses folder", () => {
    const { page } = treeFactory("folder:api");
    page.keyboard.press("ArrowRight");
    expect(page.zone()?.expandedItems).toContain("folder:api");

    page.keyboard.press("ArrowLeft");
    expect(page.zone()?.expandedItems).not.toContain("folder:api");
  });

  it("Enter on leaf dispatches onAction", () => {
    const { page, onAction } = treeFactory("api/auth");
    page.keyboard.press("Enter");
    expect(onAction).toHaveBeenCalled();
  });
});
