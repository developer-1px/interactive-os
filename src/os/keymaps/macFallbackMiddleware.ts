/**
 * macFallbackMiddleware — Mac key normalization as kernel middleware.
 *
 * When KeyboardListener misses (no keybinding found for the raw key),
 * this middleware tries Mac-specific normalization (e.g., Cmd+↑ → Home)
 * and resolves the normalized key through Keybindings.
 *
 * Specific bindings (1st pass) always take priority over normalized ones.
 * This middleware only fires on miss (fallback), so no interference.
 */

import type { BaseCommand, Middleware } from "@kernel";
import { isEditingElement, resolveIsEditingForKey } from "./fieldKeyOwnership";
import { getCanonicalKey, getMacFallbackKey } from "./getCanonicalKey";
import { Keybindings, type KeyResolveContext } from "./keybindings";

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const macFallbackMiddleware: Middleware = {
  id: "mac-normalize",
  fallback: (event: Event): BaseCommand | null => {
    if (!isMac) return null;
    if (!(event instanceof KeyboardEvent)) return null;

    const canonicalKey = getCanonicalKey(event);
    const fallbackKey = getMacFallbackKey(canonicalKey);
    if (!fallbackKey) return null;

    const target = event.target as HTMLElement;
    const isEditing = isEditingElement(target);
    const isFieldActive = isEditing
      ? resolveIsEditingForKey(target, fallbackKey)
      : false;

    const context: KeyResolveContext = { isEditing, isFieldActive };
    const binding = Keybindings.resolve(fallbackKey, context);
    if (!binding) return null;

    const args = binding.args ?? [];
    return binding.command(...args) as BaseCommand;
  },
};
