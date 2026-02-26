/**
 * resolvePointer — Unit Tests
 *
 * Tests the pure gesture recognition logic.
 * No DOM, no JSDOM — just input → output.
 *
 * State Machine: IDLE → PENDING → (CLICK | DRAG) → IDLE
 *
 * Spec reference: docs/1-project/unified-pointer-listener/spec.md
 *   §1.1 Gesture Recognizer (S1-1 ~ S1-4)
 *   §1.4 통합 제약 (S4-2)
 */

import {
  createIdleState,
  type GestureState,
  type PointerInput,
  resolvePointerDown,
  resolvePointerMove,
  resolvePointerUp,
} from "@os/1-listeners/pointer/resolvePointer";
import { describe, expect, test } from "vitest";

// ─── Helpers ───

const DRAG_THRESHOLD = 5;

function basePointerDown(overrides: Partial<PointerInput> = {}): PointerInput {
  return {
    clientX: 100,
    clientY: 100,
    button: 0,
    hasDragHandle: false,
    hasItemId: true,
    hasZone: true,
    itemId: "item-1",
    zoneId: "zone-1",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// S1-4: Right click → ignore
// ═══════════════════════════════════════════════════════════════════

describe("resolvePointerDown", () => {
  test("S1-4: right click (button !== 0) → state stays IDLE", () => {
    const state = createIdleState();
    const result = resolvePointerDown(state, basePointerDown({ button: 2 }));
    expect(result.phase).toBe("IDLE");
  });

  test("left click on item → state becomes PENDING", () => {
    const state = createIdleState();
    const result = resolvePointerDown(state, basePointerDown());
    expect(result.phase).toBe("PENDING");
    expect(result.startX).toBe(100);
    expect(result.startY).toBe(100);
    expect(result.itemId).toBe("item-1");
    expect(result.zoneId).toBe("zone-1");
  });

  test("left click on drag-handle → PENDING with hasDragHandle=true", () => {
    const state = createIdleState();
    const result = resolvePointerDown(
      state,
      basePointerDown({ hasDragHandle: true }),
    );
    expect(result.phase).toBe("PENDING");
    expect(result.hasDragHandle).toBe(true);
  });

  test("no item → state stays IDLE", () => {
    const state = createIdleState();
    const result = resolvePointerDown(
      state,
      basePointerDown({ hasItemId: false, itemId: null }),
    );
    // No item to interact with — but zone-only click is still valid for CLICK mode
    // The decision depends on hasZone
    expect(result.phase).toBe("PENDING");
  });

  test("no zone and no item → IDLE (nothing to do)", () => {
    const state = createIdleState();
    const result = resolvePointerDown(
      state,
      basePointerDown({
        hasItemId: false,
        itemId: null,
        hasZone: false,
        zoneId: null,
      }),
    );
    expect(result.phase).toBe("IDLE");
  });
});

// ═══════════════════════════════════════════════════════════════════
// S1-1 & S1-2: Gesture classification (CLICK vs DRAG)
// ═══════════════════════════════════════════════════════════════════

describe("resolvePointerMove", () => {
  test("S1-1: movement below threshold → stays PENDING", () => {
    const state: GestureState = {
      phase: "PENDING",
      startX: 100,
      startY: 100,
      itemId: "item-1",
      zoneId: "zone-1",
      hasDragHandle: false,
    };
    const result = resolvePointerMove(state, {
      clientX: 103,
      clientY: 103,
    });
    expect(result.phase).toBe("PENDING");
  });

  test("S1-2: movement exceeds threshold WITH drag-handle → DRAG", () => {
    const state: GestureState = {
      phase: "PENDING",
      startX: 100,
      startY: 100,
      itemId: "item-1",
      zoneId: "zone-1",
      hasDragHandle: true,
    };
    const result = resolvePointerMove(state, {
      clientX: 100,
      clientY: 100 + DRAG_THRESHOLD + 1,
    });
    expect(result.phase).toBe("DRAG");
  });

  test("S1-3: movement exceeds threshold WITHOUT drag-handle → stays PENDING (no drag)", () => {
    const state: GestureState = {
      phase: "PENDING",
      startX: 100,
      startY: 100,
      itemId: "item-1",
      zoneId: "zone-1",
      hasDragHandle: false,
    };
    const result = resolvePointerMove(state, {
      clientX: 100 + DRAG_THRESHOLD + 1,
      clientY: 100,
    });
    // Without drag handle, threshold exceedance doesn't trigger drag
    expect(result.phase).toBe("PENDING");
  });

  test("IDLE state → no transition", () => {
    const state = createIdleState();
    const result = resolvePointerMove(state, { clientX: 200, clientY: 200 });
    expect(result.phase).toBe("IDLE");
  });

  test("already DRAG state → stays DRAG (no re-transition)", () => {
    const state: GestureState = {
      phase: "DRAG",
      startX: 100,
      startY: 100,
      itemId: "item-1",
      zoneId: "zone-1",
      hasDragHandle: true,
    };
    const result = resolvePointerMove(state, { clientX: 200, clientY: 200 });
    expect(result.phase).toBe("DRAG");
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolvePointerUp
// ═══════════════════════════════════════════════════════════════════

describe("resolvePointerUp", () => {
  test("S1-1: PENDING → pointerup → CLICK gesture result", () => {
    const state: GestureState = {
      phase: "PENDING",
      startX: 100,
      startY: 100,
      itemId: "item-1",
      zoneId: "zone-1",
      hasDragHandle: false,
    };
    const result = resolvePointerUp(state);
    expect(result.gesture).toBe("CLICK");
    expect(result.state.phase).toBe("IDLE");
    if (result.gesture === "CLICK") {
      expect(result.itemId).toBe("item-1");
      expect(result.zoneId).toBe("zone-1");
    }
  });

  test("DRAG → pointerup → DRAG_END gesture result", () => {
    const state: GestureState = {
      phase: "DRAG",
      startX: 100,
      startY: 100,
      itemId: "item-1",
      zoneId: "zone-1",
      hasDragHandle: true,
    };
    const result = resolvePointerUp(state);
    expect(result.gesture).toBe("DRAG_END");
    expect(result.state.phase).toBe("IDLE");
  });

  test("IDLE → pointerup → no gesture", () => {
    const state = createIdleState();
    const result = resolvePointerUp(state);
    expect(result.gesture).toBe("NONE");
    expect(result.state.phase).toBe("IDLE");
  });
});
