/**
 * FocusListener — DOM Adapter for focus events (focusin).
 *
 * Pipeline: FocusEvent → sense (DOM) → OS_SYNC_FOCUS dispatch
 *
 * W3C UI Events Module: Focus Events (§3.3)
 *
 * Handles:
 * - focusin → OS_SYNC_FOCUS (state sync from external focus changes)
 *
 * Note: Focus recovery after item deletion is handled by Lazy Resolution
 * (resolveItemId in useFocusedItem) — no MutationObserver needed.
 */

import { OS_SYNC_FOCUS } from "@os/3-commands";
import { useEffect } from "react";
import { os } from "../../kernel";
import { sensorGuard } from "../../lib/loopGuard";
import {
  findFocusableItem,
  isDispatching,
  resolveFocusTarget,
} from "../shared";

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

let isMounted = false;

export function FocusListener() {
  useEffect(() => {
    if (isMounted) return;
    isMounted = true;

    // FocusIn → OS_SYNC_FOCUS
    const senseFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-inspector]") || !sensorGuard.check()) return;

      // Re-entrance guard: prevents focusin from kernel's el.focus() effect
      if (isDispatching()) return;

      const item = findFocusableItem(target);
      if (!item) return;
      const focusTarget = resolveFocusTarget(item);
      if (!focusTarget) return;

      os.dispatch(
        OS_SYNC_FOCUS({ id: focusTarget.itemId, zoneId: focusTarget.groupId }),
        {
          meta: {
            input: {
              type: "OS_FOCUS",
              key: e.type,
              elementId: focusTarget.itemId,
            },
          },
        },
      );
    };

    document.addEventListener("focusin", senseFocusIn, { capture: true });

    return () => {
      isMounted = false;
      document.removeEventListener("focusin", senseFocusIn, { capture: true });
    };
  }, []);

  return null;
}
