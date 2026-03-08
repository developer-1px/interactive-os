/**
 * Combobox Keyboard Relay — resolveKeyboard combobox guard test
 *
 * Tests that resolveKeyboard correctly relays navigation keys
 * to the layer chain when isCombobox=true, instead of returning EMPTY.
 *
 * Why this test should fail: resolveKeyboard.ts:88 currently has
 * `if (input.isCombobox) return EMPTY` which blocks ALL keyboard
 * processing for combobox inputs.
 *
 * @spec docs/1-project/os-core/combobox-relay/spec.md
 */

import {
  type KeyboardInput,
  resolveKeyboard,
} from "@os-core/1-listen/keyboard/resolveKeyboard";
import { OS_ACTIVATE } from "@os-core/4-command/activate/activate";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Base input: combobox active, overlay open, listbox zone has inputmap */
function comboboxInput(overrides: Partial<KeyboardInput> = {}): KeyboardInput {
  return {
    canonicalKey: "ArrowDown",
    key: "ArrowDown",
    isEditing: false,
    isFieldActive: false,
    isComposing: false,
    isDefaultPrevented: false,
    isCombobox: true,

    editingFieldId: null,
    activeFieldType: null,
    focusedItemId: "item-1",
    activeZoneFocusedItemId: "item-1",
    activeZoneInputmap: {
      Enter: [OS_ACTIVATE()],
      click: [OS_ACTIVATE()],
    },

    elementId: "item-1",

    focusedTriggerId: null,
    focusedTriggerRole: null,
    focusedTriggerOverlayId: null,
    isTriggerOverlayOpen: false,

    cursor: {
      focusId: "item-1",
      selection: [],
      anchor: null,
      isExpandable: false,
      isDisabled: false,
      treeLevel: undefined,
    },

    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Feature: combobox keyboard relay", () => {
  describe("navigation keys should relay to layer chain", () => {
    it("#3 Enter on combobox input → OS_ACTIVATE from inputmap", () => {
      const input = comboboxInput({ canonicalKey: "Enter", key: "Enter" });
      const result = resolveKeyboard(input);

      expect(result.commands.length).toBeGreaterThan(0);
      expect(result.commands[0]!.type).toBe("OS_ACTIVATE");
    });

    it("#4 Escape on combobox input → passes through to layer chain", () => {
      const input = comboboxInput({ canonicalKey: "Escape", key: "Escape" });
      const result = resolveKeyboard(input);

      // Escape should NOT return EMPTY — it should fall through to layers.
      // Even if no layer claims it, fallback should be true (not blocked).
      expect(result.fallback || result.commands.length > 0).toBe(true);
    });
  });

  describe("character keys should NOT relay (typing pass-through)", () => {
    it("#7 'a' on combobox input → EMPTY (no commands, no preventDefault)", () => {
      const input = comboboxInput({ canonicalKey: "a", key: "a" });
      const result = resolveKeyboard(input);

      expect(result.commands).toHaveLength(0);
      expect(result.preventDefault).toBe(false);
    });

    it("#8 '1' on combobox input → EMPTY (no commands, no preventDefault)", () => {
      const input = comboboxInput({ canonicalKey: "1", key: "1" });
      const result = resolveKeyboard(input);

      expect(result.commands).toHaveLength(0);
      expect(result.preventDefault).toBe(false);
    });
  });
});
