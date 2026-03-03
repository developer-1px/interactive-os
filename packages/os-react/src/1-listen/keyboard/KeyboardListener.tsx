/**
 * KeyboardListener — DOM Adapter for keyboard events.
 *
 * Pipeline: KeyboardEvent → sense (DOM) → resolveKeyboard (pure) → dispatch
 *
 * W3C UI Events Module: Keyboard Events (§3.5)
 */

import { resolveKeyboard } from "@os-core/1-listen/keyboard/resolveKeyboard";
import { senseKeyboard } from "@os-core/1-listen/keyboard/senseKeyboard";
import { os } from "@os-core/engine/kernel";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { useEffect } from "react";

// Ensure OS defaults are registered
import "@os-core/2-resolve/osDefaults";

// Register fallback middlewares (side-effect)
import { macFallbackMiddleware } from "@os-core/2-resolve/macFallbackMiddleware";
import { typeaheadFallbackMiddleware } from "@os-core/2-resolve/typeaheadFallbackMiddleware";

os.use(macFallbackMiddleware);
os.use(typeaheadFallbackMiddleware);

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function KeyboardListener() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const input = senseKeyboard(e);
      if (!input) return;

      // "native" tab behavior: OS does not intercept Tab — browser default
      if (
        (input.canonicalKey === "Tab" || input.canonicalKey === "Shift+Tab") &&
        !input.isEditing
      ) {
        const focusState = os.getState().os?.focus;
        const zoneId = focusState?.activeZoneId;
        const entry = zoneId ? ZoneRegistry.get(zoneId) : null;
        if (entry?.config?.tab?.behavior === "native") return;
      }

      const result = resolveKeyboard(input);

      if (result.commands.length > 0) {
        for (const cmd of result.commands) {
          const opts = result.meta
            ? {
                meta: {
                  input: result.meta,
                  pipeline: {
                    sensed: input,
                    resolved: {
                      fallback: result.fallback,
                      preventDefault: result.preventDefault,
                    },
                  },
                },
              }
            : undefined;
          os.dispatch(cmd, opts);
        }
      }

      if (result.fallback) {
        if (os.resolveFallback(e)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      if (result.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return null;
}

KeyboardListener.displayName = "KeyboardListener";
