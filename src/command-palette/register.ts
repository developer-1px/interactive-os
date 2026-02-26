/**
 * Command Palette Registration
 *
 * Registers TOGGLE_COMMAND_PALETTE command and Meta+K keybinding
 * through the OS keybinding system. Follows the Inspector plugin model.
 *
 * Side-effect import: `import "@/command-palette/register"`
 */

import { OS_OVERLAY_CLOSE, OS_OVERLAY_OPEN } from "@/os/3-commands";
import { os } from "@/os/kernel";
import { Keybindings } from "@/os/keymaps/keybindings";

// ── Command ──────────────────────────────────────────────────────

export const TOGGLE_COMMAND_PALETTE = os.defineCommand(
  "TOGGLE_COMMAND_PALETTE",
  (ctx) => () => {
    const isOpen = ctx.state.os.overlays.stack.some(
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
);

// ── Keybinding ───────────────────────────────────────────────────

Keybindings.register({
  key: "Meta+K",
  command: TOGGLE_COMMAND_PALETTE(),
});

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
