/**
 * Command Palette Registration
 *
 * Registers TOGGLE_COMMAND_PALETTE command and Meta+K keybinding.
 *
 * Side-effect import: `import "@/command-palette/register"`
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { OS_OVERLAY_CLOSE, OS_OVERLAY_OPEN, os } from "@os-sdk/os";

// ── App ──────────────────────────────────────────────────────────

const CommandPaletteApp = defineApp("command-palette", {});

// ── Command ──────────────────────────────────────────────────────

export const TOGGLE_COMMAND_PALETTE = CommandPaletteApp.command(
  "TOGGLE_COMMAND_PALETTE",
  () => {
    const state = os.getState();
    const isOpen = state.os.overlays.stack.some(
      (e) => e.id === "command-palette",
    );

    if (isOpen) {
      return {
        dispatch: OS_OVERLAY_CLOSE({ id: "command-palette" }),
      };
    }

    return {
      dispatch: OS_OVERLAY_OPEN({
        id: "command-palette",
        type: "dialog",
      }),
    };
  },
  { key: "Meta+K" },
);

// ── Shift+Shift Double-Tap (IntelliJ "Search Everywhere") ────────

let lastShiftUp = 0;

if (typeof window !== "undefined") {
  window.addEventListener("keyup", (e) => {
    if (e.key !== "Shift" || e.metaKey || e.ctrlKey || e.altKey) {
      lastShiftUp = 0;
      return;
    }

    const now = Date.now();
    if (now - lastShiftUp < 300) {
      lastShiftUp = 0;
      // Only open if not already open
      const state = os.getState();
      const isOpen = state.os.overlays.stack.some(
        (entry) => entry.id === "command-palette",
      );
      if (!isOpen) {
        os.dispatch(
          OS_OVERLAY_OPEN({
            id: "command-palette",
            type: "dialog",
          }),
        );
      }
    } else {
      lastShiftUp = now;
    }
  });
}
