/**
 * useInspectorHotkey — Inspector keybinding via OS Keybinding API.
 *
 * Inspector sits ON TOP of the OS layer, using the OS's public APIs:
 *   - kernel.defineCommand  → Register TOGGLE_INSPECTOR (no-op on state)
 *   - kernel.defineEffect   → Handle the toggleInspector effect
 *   - Keybindings.register  → Bind Meta+I to TOGGLE_INSPECTOR
 *
 * The command returns { toggleInspector: true }, which triggers the effect.
 */

import { useEffect } from "react";
import { Keybindings } from "@/os-new/1-listeners/keybindings";
import { kernel } from "@/os-new/kernel";
import { InspectorStore } from "./InspectorStore";

// ─── Kernel Registration (module scope, singleton) ───

// 1. Define effect handler
kernel.defineEffect("toggleInspector", () => {
  InspectorStore.toggle();
});

// 2. Define command (returns effect map)
const TOGGLE_INSPECTOR = kernel.defineCommand(
  "TOGGLE_INSPECTOR",
  (_ctx) => () => ({ toggleInspector: true }),
);

// ─── React Hook ───

export function useInspectorHotkey() {
  useEffect(() => {
    // Register keybinding: Meta+I → TOGGLE_INSPECTOR
    const unregister = Keybindings.register({
      key: "Meta+i",
      command: TOGGLE_INSPECTOR,
    });

    return unregister;
  }, []);
}
