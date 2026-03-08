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

import {
  findFocusableItem,
  isDispatching,
  resolveFocusTarget,
} from "@os-core/1-listen/_shared/domQuery";
import { OS_SYNC_FOCUS } from "@os-core/4-command";
import { os } from "@os-core/engine/kernel";
import { useEffect } from "react";

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
