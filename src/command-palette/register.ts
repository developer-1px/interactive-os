/**
 * Command Palette Registration
 *
 * Registers TOGGLE_COMMAND_PALETTE command and Meta+K keybinding
 * through the OS keybinding system. Follows the Inspector plugin model.
 *
 * Side-effect import: `import "@/command-palette/register"`
 */

import { Keybindings } from "@/os-new/1-listeners/keybindings";
import { OVERLAY_CLOSE, OVERLAY_OPEN } from "@/os-new/3-commands";
import { kernel } from "@/os-new/kernel";

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
