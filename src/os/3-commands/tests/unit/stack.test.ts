/**
 * Focus Stack Unit Tests — OS SPEC §8
 *
 * Tests STACK_PUSH / STACK_POP pure state transitions:
 * - PUSH saves current focus (zone + item) to stack
 * - POP restores saved focus and removes entry
 * - POP on empty stack is no-op
 * - POP with invalid entry (no zoneId) removes but doesn't restore
 * - Multiple push/pop: LIFO ordering
 * - triggeredBy metadata is preserved
 *
 * Uses kernel directly — these are OS-level commands.
 */

import { FOCUS } from "@os/3-commands/focus/focus";
import { STACK_POP, STACK_PUSH } from "@os/3-commands/focus/stack";
import { kernel } from "@os/kernel";
import { initialOSState } from "@os/state/initial";
import { beforeEach, describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function resetState() {
  kernel.setState((prev) => ({
    ...prev,
    os: JSON.parse(JSON.stringify(initialOSState)),
  }));
}

function setupFocus(zoneId: string, itemId: string) {
  kernel.dispatch(FOCUS({ zoneId, itemId }));
}

function getStack() {
  return kernel.getState().os.focus.focusStack;
}

function getActiveZone() {
  return kernel.getState().os.focus.activeZoneId;
}

function getFocusedItem(zoneId: string) {
  return kernel.getState().os.focus.zones[zoneId]?.focusedItemId ?? null;
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Focus Stack (SPEC §8)", () => {
  beforeEach(() => resetState());

  describe("STACK_PUSH", () => {
    it("saves current focus state to stack", () => {
      setupFocus("z1", "item-a");
      kernel.dispatch(STACK_PUSH());

      const stack = getStack();
      expect(stack).toHaveLength(1);
      expect(stack[0]).toEqual({
        zoneId: "z1",
        itemId: "item-a",
      });
    });

    it("saves triggeredBy metadata", () => {
      setupFocus("z1", "item-a");
      kernel.dispatch(STACK_PUSH({ triggeredBy: "modal-open" }));

      const stack = getStack();
      expect(stack[0]?.triggeredBy).toBe("modal-open");
    });

    it("pushes empty zoneId when no active zone", () => {
      kernel.dispatch(STACK_PUSH());

      const stack = getStack();
      expect(stack).toHaveLength(1);
      expect(stack[0]?.zoneId).toBe("");
      expect(stack[0]?.itemId).toBeNull();
    });

    it("multiple pushes create LIFO stack", () => {
      setupFocus("z1", "item-a");
      kernel.dispatch(STACK_PUSH());

      setupFocus("z2", "item-b");
      kernel.dispatch(STACK_PUSH());

      const stack = getStack();
      expect(stack).toHaveLength(2);
      expect(stack[0]?.zoneId).toBe("z1");
      expect(stack[1]?.zoneId).toBe("z2");
    });
  });

  describe("STACK_POP", () => {
    it("restores focus from stack", () => {
      setupFocus("z1", "item-a");
      kernel.dispatch(STACK_PUSH());

      // Move focus elsewhere
      setupFocus("z2", "item-b");
      expect(getActiveZone()).toBe("z2");

      // Pop should restore z1/item-a
      kernel.dispatch(STACK_POP());

      expect(getActiveZone()).toBe("z1");
      expect(getFocusedItem("z1")).toBe("item-a");
      expect(getStack()).toHaveLength(0);
    });

    it("is no-op on empty stack", () => {
      const before = JSON.stringify(kernel.getState().os.focus);
      kernel.dispatch(STACK_POP());
      const after = JSON.stringify(kernel.getState().os.focus);
      expect(before).toBe(after);
    });

    it("handles invalid entry (empty zoneId) — pops without restoring", () => {
      // Push with no active zone → empty zoneId entry
      kernel.dispatch(STACK_PUSH());
      expect(getStack()).toHaveLength(1);

      // Now set some focus
      setupFocus("z1", "item-a");

      // Pop the invalid entry — should not change focus
      kernel.dispatch(STACK_POP());
      expect(getStack()).toHaveLength(0);
      expect(getActiveZone()).toBe("z1"); // unchanged
      expect(getFocusedItem("z1")).toBe("item-a"); // unchanged
    });

    it("LIFO: pops most recent entry first", () => {
      setupFocus("z1", "item-a");
      kernel.dispatch(STACK_PUSH());
      setupFocus("z2", "item-b");
      kernel.dispatch(STACK_PUSH());

      // Move away
      setupFocus("z3", "item-c");

      // First pop → z2/item-b
      kernel.dispatch(STACK_POP());
      expect(getActiveZone()).toBe("z2");
      expect(getFocusedItem("z2")).toBe("item-b");
      expect(getStack()).toHaveLength(1);

      // Second pop → z1/item-a
      kernel.dispatch(STACK_POP());
      expect(getActiveZone()).toBe("z1");
      expect(getFocusedItem("z1")).toBe("item-a");
      expect(getStack()).toHaveLength(0);
    });

    it("restores focus to zone that had no previous item", () => {
      setupFocus("z1", "item-a");
      kernel.dispatch(STACK_PUSH());

      // Manually push entry with null itemId
      kernel.setState((prev) => ({
        ...prev,
        os: {
          ...prev.os,
          focus: {
            ...prev.os.focus,
            focusStack: [
              ...prev.os.focus.focusStack,
              { zoneId: "z-empty", itemId: null },
            ],
          },
        },
      }));

      expect(getStack()).toHaveLength(2);

      // Pop restores z-empty, no specific item
      kernel.dispatch(STACK_POP());
      expect(getActiveZone()).toBe("z-empty");
      expect(getStack()).toHaveLength(1);
    });
  });
});
