/**
 * KeyboardListener — Single-component keyboard handler for the kernel.
 *
 * Pipeline: KeyboardEvent → getCanonicalKey → Keybindings.resolve → kernel.dispatch
 *
 * The kernel's static scope tree handles bubbling automatically.
 * Commands from scoped groups carry their scope; the kernel auto-expands
 * via parentMap. Global commands go directly to GLOBAL.
 */

import { useEffect } from "react";
import { kernel } from "../kernel";
import { getCanonicalKey } from "@os/keymaps/getCanonicalKey";
import { Keybindings, type KeyResolveContext } from "@os/keymaps/keybindings";

// Ensure OS defaults are registered
import "@os/keymaps/osDefaults";

export function KeyboardListener() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.isComposing) return;

      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest("[data-inspector]")) return;

      const canonicalKey = getCanonicalKey(e);

      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      const context: KeyResolveContext = { isEditing };

      const binding = Keybindings.resolve(canonicalKey, context);
      if (!binding) return;

      const args = binding.args ?? [];
      const command = binding.command(...args);

      // Just dispatch — kernel handles scope bubbling via static tree
      kernel.dispatch(command, {
        meta: {
          input: {
            type: "KEYBOARD",
            key: e.key,
            code: canonicalKey,
            elementId:
              target.getAttribute("data-id") ||
              target.getAttribute("data-zone-id") ||
              target.id ||
              undefined,
          },
        },
      });

      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return null;
}

KeyboardListener.displayName = "KeyboardListener";
