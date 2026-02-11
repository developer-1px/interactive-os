/**
 * Inspector Keybinding Registration
 *
 * Registers TOGGLE_INSPECTOR command and Meta+I keybinding
 * through the OS keybinding system. Inspector uses the OS as
 * infrastructure but owns its own registration — a plugin model.
 *
 * Side-effect import: `import "@inspector/register"`
 */

import { Keybindings } from "@/os-new/keymaps/keybindings";
import { kernel } from "@/os-new/kernel";
import { InspectorStore } from "./stores/InspectorStore";

// ── Command ──────────────────────────────────────────────────────
// Pure side-effect command: toggles the Inspector store.
// No kernel state mutation needed.

export const TOGGLE_INSPECTOR = kernel.defineCommand(
  "TOGGLE_INSPECTOR",
  (_ctx) => () => {
    InspectorStore.toggle();
    return undefined;
  },
);

// ── Keybinding ───────────────────────────────────────────────────
// No `when` → always active, regardless of editing/navigating state.

Keybindings.register({
  key: "Meta+I",
  command: TOGGLE_INSPECTOR,
});
