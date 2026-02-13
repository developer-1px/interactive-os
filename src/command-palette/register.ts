/**
 * Command Palette Registration
 *
 * Registers TOGGLE_COMMAND_PALETTE command and Meta+K keybinding
 * through the OS keybinding system. Follows the Inspector plugin model.
 *
 * Side-effect import: `import "@/command-palette/register"`
 */

import { OVERLAY_CLOSE, OVERLAY_OPEN } from "@/os/3-commands";
import { kernel } from "@/os/kernel";
import { Keybindings } from "@/os/keymaps/keybindings";

// ── Command ──────────────────────────────────────────────────────

export const TOGGLE_COMMAND_PALETTE = kernel.defineCommand(
  "TOGGLE_COMMAND_PALETTE",
  (ctx) => () => {
    const isOpen = ctx.state.os.overlays.stack.some(
      (e) => e.id === "command-palette",
    );

    if (isOpen) {
      return {
        // biome-ignore lint/suspicious/noExplicitAny: command dispatch type compatibility
        dispatch: OVERLAY_CLOSE({ id: "command-palette" }) as any,
      };
    }

    return {
      dispatch: OVERLAY_OPEN({
        id: "command-palette",
        type: "dialog",
        // biome-ignore lint/suspicious/noExplicitAny: command dispatch type compatibility
      }) as any,
    };
  },
);

// ── Keybinding ───────────────────────────────────────────────────

Keybindings.register({
  key: "Meta+K",
  command: TOGGLE_COMMAND_PALETTE,
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
      const state = kernel.getState();
      const isOpen = state.os.overlays.stack.some(
        (entry) => entry.id === "command-palette",
      );
      if (!isOpen) {
        kernel.dispatch(
          OVERLAY_OPEN({
            id: "command-palette",
            type: "dialog",
            // biome-ignore lint/suspicious/noExplicitAny: command dispatch type compatibility
          }) as any,
        );
      }
    } else {
      lastShiftUp = now;
    }
  });
}
