/**
 * OS Guarantees — Data Manipulation State Guarantee Tests
 *
 * Source of Truth: docs/official/os-guarantees.md
 *
 * Tests that the OS maintains correct focus and selection state
 * after data manipulation operations (delete, clipboard, multi-select).
 *
 * Focus recovery mechanism (Lazy Resolution):
 *   1. Focus/Selection IDs are preserved as-is after data changes
 *   2. At read-time, stale IDs are resolved to nearest neighbor
 *   3. When the original item returns (undo), the stored ID resolves back automatically
 *
 * Note: In headless tests, `focusedItemId()` reads raw kernel state.
 * Lazy resolution happens in `useFocusedItem` / `useSelection` hooks.
 * These tests verify that the kernel state preserves original IDs correctly.
 */

import { createOsPage } from "@os/createOsPage";
import { describe, expect, it } from "vitest";
import { resolveItemId, resolveSelection } from "../../../state/resolve";

// ─── Config ───

const ITEMS = ["a", "b", "c", "d", "e"];

const LIST_CONFIG = {
  navigate: {
    orientation: "vertical" as const,
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first" as const,
    recovery: "next" as const,
    arrowExpand: false,
  },
  select: {
    mode: "multiple" as const,
    followFocus: false,
    disallowEmpty: false,
    range: true,
    toggle: false,
  },
};

function createList(focusedItem = "a") {
  const t = createOsPage();
  t.setItems(ITEMS);
  t.setConfig(LIST_CONFIG);
  t.setActiveZone("list", focusedItem);
  return t;
}

// ═══════════════════════════════════════════════════
// §1. Delete + Focus Recovery (Lazy Resolution)
//
// After item removal, stored focusedItemId becomes stale.
// resolveItemId resolves it to nearest neighbor at read-time.
// ═══════════════════════════════════════════════════

describe("OS Guarantee §1: Delete + Focus Recovery (Lazy Resolution)", () => {
  // §1.1 — 단일 아이템 삭제 (중간) → lazy resolve → 다음
  it("§1.1: delete middle item → resolveItemId recovers to next", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" })); // a→b
    t.dispatch(t.OS_NAVIGATE({ direction: "down" })); // b→c
    expect(t.focusedItemId()).toBe("c");

    // Simulate deletion: remove "c" from DOM
    const items = ["a", "b", "d", "e"];
    t.setItems(items);

    // Raw state still has "c" (preserved, not overwritten)
    expect(t.focusedItemId()).toBe("c");
    // resolveItemId resolves the stale "c" → "d" (next at index 2)
    expect(resolveItemId("c", items, 2)).toBe("d");
  });

  // §1.2 — 마지막 아이템 삭제 → lazy resolve → 이전
  it("§1.2: delete last item → resolveItemId recovers to previous", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "end" }));
    expect(t.focusedItemId()).toBe("e");

    const items = ["a", "b", "c", "d"];
    t.setItems(items);

    // resolveItemId resolves "e" (was at index 4) → "d" (last available)
    expect(resolveItemId("e", items, 4)).toBe("d");
  });

  // §1.3 — 유일한 아이템 삭제 → stale pointer, null resolve
  it("§1.3: delete only item → resolveItemId returns null", () => {
    const t = createOsPage();
    t.setItems(["solo"]);
    t.setConfig(LIST_CONFIG);
    t.setActiveZone("list", "solo");

    t.setItems([]);

    // resolveItemId on empty list → null
    expect(resolveItemId("solo", [])).toBeNull();
  });

  // §1.4 — Undo 시 원본 ID 복귀 (zero-cost)
  it("§1.4: undo restores original item → resolveItemId returns original", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("c");

    // Delete
    const afterDelete = ["a", "b", "d", "e"];
    expect(resolveItemId("c", afterDelete, 2)).toBe("d");

    // Undo → "c" is back
    const afterUndo = ["a", "b", "c", "d", "e"];
    expect(resolveItemId("c", afterUndo)).toBe("c"); // ✅ zero-cost restoration
  });

  // §1.5 — 삭제 후 selection lazy filter
  it("§1.5: after delete, selection lazily filters stale IDs", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_SELECT({ targetId: "b", mode: "replace" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
    expect(t.selection()).toEqual(["b", "c", "d"]);

    const remainingItems = ["a", "e"];

    // Lazy resolution: filter stale IDs
    expect(resolveSelection(["b", "c", "d"], remainingItems)).toEqual([]);

    // Undo → selection restored
    expect(resolveSelection(["b", "c", "d"], ITEMS)).toEqual(["b", "c", "d"]);
  });
});

// ═══════════════════════════════════════════════════
// §2. Clipboard
// ═══════════════════════════════════════════════════

describe("OS Guarantee §2: Clipboard", () => {
  // §2.1 — Copy는 상태 변화 없음
  it("§2.1: copy does not change focus or selection", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_SELECT({ targetId: "c", mode: "replace" }));

    const focusBefore = t.focusedItemId();
    const selBefore = [...t.selection()];

    // OS_COPY passes cursor to onCopy callback — no state mutation
    expect(t.focusedItemId()).toBe(focusBefore);
    expect(t.selection()).toEqual(selBefore);
  });
});

// ═══════════════════════════════════════════════════
// §3. Multi-Select + Operation
// ═══════════════════════════════════════════════════

describe("OS Guarantee §3: Multi-Select + Operation", () => {
  // §3.1 — 선택 후 삭제 → lazy filter로 남은 항목 자동 필터
  it("§3.1: delete selected → resolveSelection filters stale", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_SELECT({ targetId: "b", mode: "replace" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
    expect(t.selection()).toEqual(["b", "c", "d"]);

    const remaining = ["a", "e"];
    expect(resolveSelection(["b", "c", "d"], remaining)).toEqual([]);
  });

  // §3.2 — 빈 selection에서 Delete → focusId stale, lazy resolve
  it("§3.2: delete with no selection → resolveItemId to next", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("c");

    const remaining = ["a", "b", "d", "e"];
    expect(resolveItemId("c", remaining, 2)).toBe("d");
  });

  // §3.3 — 전체 삭제 → 빈 리스트
  it("§3.3: delete all → resolveItemId returns null", () => {
    const t = createList("a");
    t.dispatch(t.OS_SELECT({ targetId: "a", mode: "replace" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "end", select: "range" }));

    expect(resolveItemId("e", [])).toBeNull();
    expect(resolveSelection(["a", "b", "c", "d", "e"], [])).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════
// §6. Expand / Collapse
//
// §0: 변화 주체에 머무름. Expand/Collapse는 부모가 주체.
// ═══════════════════════════════════════════════════

describe("OS Guarantee §6: Expand / Collapse", () => {
  // §6.1 — 펼치기: 포커스 = 부모 유지
  it("§6.1: expand keeps focus on parent", () => {
    const t = createList("b");
    expect(t.focusedItemId()).toBe("b");

    t.dispatch(t.OS_EXPAND({ itemId: "b", action: "expand" }));

    expect(t.focusedItemId()).toBe("b"); // unchanged
  });

  // §6.2 — 접기: 포커스 = 부모 유지
  it("§6.2: collapse keeps focus on parent", () => {
    const t = createList("b");
    t.dispatch(t.OS_EXPAND({ itemId: "b", action: "expand" }));

    t.dispatch(t.OS_EXPAND({ itemId: "b", action: "collapse" }));

    expect(t.focusedItemId()).toBe("b"); // unchanged
  });

  // §6: expandedItems 상태가 정확히 변경되는지
  it("expand toggles expandedItems state", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    t.dispatch(t.OS_EXPAND({ itemId: "b" }));
    expect(t.zone()?.expandedItems).toContain("b");

    t.dispatch(t.OS_EXPAND({ itemId: "b" }));
    expect(t.zone()?.expandedItems).not.toContain("b");
  });
});

// ═══════════════════════════════════════════════════
// §7. Field (편집 모드)
//
// §0: 위치 불변 = 포커스 변화 없음.
// ═══════════════════════════════════════════════════

describe("OS Guarantee §7: Field (Edit Mode)", () => {
  // §7.1 — 편집 진입: editingItemId = focusedItemId
  it("§7.1: OS_FIELD_START_EDIT sets editingItemId to focused item", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("c");

    t.dispatch(t.OS_FIELD_START_EDIT());

    expect(t.zone()?.editingItemId).toBe("c");
    expect(t.focusedItemId()).toBe("c"); // unchanged
  });

  // §7.1 — 이미 편집 중인 아이템에 다시 진입: no-op
  it("§7.1: double OS_FIELD_START_EDIT is no-op", () => {
    const t = createList("a");
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    t.dispatch(t.OS_FIELD_START_EDIT());

    const stateBefore = t.zone()?.editingItemId;
    t.dispatch(t.OS_FIELD_START_EDIT());

    expect(t.zone()?.editingItemId).toBe(stateBefore);
  });

  // §7: 포커스 없으면 진입 불가
  it("no focused item → OS_FIELD_START_EDIT is no-op", () => {
    const t = createOsPage();
    t.setItems(ITEMS);
    t.setConfig(LIST_CONFIG);
    t.setActiveZone("list", null);

    t.dispatch(t.OS_FIELD_START_EDIT());

    expect(t.zone()?.editingItemId).toBeNull();
  });
});
