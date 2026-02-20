/**
 * FocusListener — DOM Adapter for focus events (focusin).
 *
 * Pipeline: FocusEvent → sense (DOM) → OS_SYNC_FOCUS dispatch
 *
 * W3C UI Events Module: Focus Events (§3.3)
 *
 * Handles:
 * - focusin → OS_SYNC_FOCUS (state sync from external focus changes)
 * - MutationObserver → OS_RECOVER (focused element removed from DOM)
 */

import { OS_RECOVER, OS_SYNC_FOCUS } from "@os/3-commands";
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

    // --- Focus Recovery via MutationObserver ---
    let lastFocusedElement: Element | null = null;

    const trackFocus = () => {
      if (document.activeElement && document.activeElement !== document.body) {
        lastFocusedElement = document.activeElement;
      }
    };
    document.addEventListener("focusin", trackFocus);

    const observer = new MutationObserver(() => {
      if (
        document.activeElement === document.body &&
        lastFocusedElement &&
        !document.body.contains(lastFocusedElement)
      ) {
        lastFocusedElement = null;
        os.dispatch(OS_RECOVER(), {
          meta: { input: { type: "OS_FOCUS", key: "Recovery" } },
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      isMounted = false;
      document.removeEventListener("focusin", senseFocusIn, { capture: true });
      document.removeEventListener("focusin", trackFocus);
      observer.disconnect();
    };
  }, []);

  return null;
}
