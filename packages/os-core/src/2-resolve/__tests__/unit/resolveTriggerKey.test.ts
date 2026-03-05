/**
 * buildTriggerKeymap — Unit tests
 *
 * Verifies that the Trigger layer keymap builder correctly maps
 * TriggerConfig presets to keymaps resolved via resolveChain.
 *
 * Pure function tests. No DOM, no React.
 * Replaces the old resolveTriggerKey tests.
 */

import { resolveChain } from "@os-core/2-resolve/chainResolver";
import {
  buildTriggerKeymap,
  resolveTriggerRole,
} from "@os-core/engine/registries/triggerRegistry";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function resolveKey(
  key: string,
  role: string,
  overlayId = "popup-1",
  isOpen = false,
) {
  const config = resolveTriggerRole(role);
  const keymap = buildTriggerKeymap(
    config,
    {
      overlayId,
      triggerRole: role,
      triggerId: "trigger-1",
    },
    isOpen,
  );
  return resolveChain(key, [keymap]);
}

// ═══════════════════════════════════════════════════════════════════
// Menu Trigger (APG Menu Button Pattern)
// ═══════════════════════════════════════════════════════════════════

describe("buildTriggerKeymap: menu", () => {
  it("Enter → OS_OVERLAY_OPEN", () => {
    const cmd = resolveKey("Enter", "menu");
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
  });

  it("Space → OS_OVERLAY_OPEN", () => {
    const cmd = resolveKey("Space", "menu");
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
  });

  it("ArrowDown → OS_OVERLAY_OPEN", () => {
    const cmd = resolveKey("ArrowDown", "menu");
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
  });

  it("ArrowUp → OS_OVERLAY_OPEN", () => {
    const cmd = resolveKey("ArrowUp", "menu");
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
  });

  it("ArrowLeft → null (not handled)", () => {
    expect(resolveKey("ArrowLeft", "menu")).toBeNull();
  });

  it("Tab → null (not handled)", () => {
    expect(resolveKey("Tab", "menu")).toBeNull();
  });

  it("when overlay is open → null (empty keymap)", () => {
    expect(resolveKey("Enter", "menu", "popup-1", true)).toBeNull();
    expect(resolveKey("ArrowDown", "menu", "popup-1", true)).toBeNull();
  });

  it("overlay command carries correct overlayId", () => {
    const cmd = resolveKey("Enter", "menu", "my-menu");
    expect(cmd!.payload).toEqual(expect.objectContaining({ id: "my-menu" }));
  });
});

// ═══════════════════════════════════════════════════════════════════
// Dialog Trigger
// ═══════════════════════════════════════════════════════════════════

describe("buildTriggerKeymap: dialog", () => {
  it("Enter → OS_OVERLAY_OPEN", () => {
    const cmd = resolveKey("Enter", "dialog");
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
  });

  it("Space → OS_OVERLAY_OPEN", () => {
    const cmd = resolveKey("Space", "dialog");
    expect(cmd).not.toBeNull();
  });

  it("ArrowDown → null (dialog doesn't open on arrow)", () => {
    expect(resolveKey("ArrowDown", "dialog")).toBeNull();
  });

  it("ArrowUp → null (dialog doesn't open on arrow)", () => {
    expect(resolveKey("ArrowUp", "dialog")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tooltip Trigger
// ═══════════════════════════════════════════════════════════════════

describe("buildTriggerKeymap: tooltip", () => {
  it("Enter → null (tooltip doesn't open on keyboard)", () => {
    expect(resolveKey("Enter", "tooltip")).toBeNull();
  });

  it("Space → null", () => {
    expect(resolveKey("Space", "tooltip")).toBeNull();
  });

  it("ArrowDown → null", () => {
    expect(resolveKey("ArrowDown", "tooltip")).toBeNull();
  });
});
