/**
 * resolveClick — Unit Tests
 *
 * Tree interaction model:
 *   - New item click (clicked ≠ focused) → no-op (mousedown handled focus+select)
 *   - Re-click on already-focused item → OS_ACTIVATE
 *   - aria-current="page" → OS_ACTIVATE immediately
 */

import { resolveClick } from "@os/1-listeners/mouse/resolveClick";
import { describe, expect, test } from "vitest";

describe("resolveClick", () => {
  test("re-click on already-focused item → OS_ACTIVATE", () => {
    const result = resolveClick({
      activateOnClick: true,
      clickedItemId: "item-1",
      focusedItemId: "item-1",
    });
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_ACTIVATE");
  });

  test("new item click (clicked ≠ focused) → no-op (mousedown already handled)", () => {
    const result = resolveClick({
      activateOnClick: true,
      clickedItemId: "item-2",
      focusedItemId: "item-1",
    });
    expect(result.commands).toHaveLength(0);
  });

  test("aria-current=page → OS_ACTIVATE immediately (even if different from focused)", () => {
    const result = resolveClick({
      activateOnClick: true,
      clickedItemId: "item-2",
      focusedItemId: "item-1",
      isCurrentPage: true,
    });
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_ACTIVATE");
  });

  test("activateOnClick + no clickedItemId → no commands", () => {
    const result = resolveClick({
      activateOnClick: true,
      clickedItemId: null,
      focusedItemId: "item-1",
    });
    expect(result.commands).toHaveLength(0);
  });

  test("no activateOnClick → no commands", () => {
    const result = resolveClick({
      activateOnClick: false,
      clickedItemId: "item-1",
      focusedItemId: "item-1",
    });
    expect(result.commands).toHaveLength(0);
  });
});
