/**
 * FocusListener — DOM Adapter for focus events (focusin).
 *
 * Pipeline: FocusEvent → sense (DOM) → SYNC_FOCUS dispatch
 *
 * W3C UI Events Module: Focus Events (§3.3)
 *
 * Handles:
 * - focusin → SYNC_FOCUS (state sync from external focus changes)
 * - MutationObserver → RECOVER (focused element removed from DOM)
 */

import { RECOVER, SYNC_FOCUS } from "@os/3-commands";
import { useEffect } from "react";
import { kernel } from "../../kernel";
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

    // FocusIn → SYNC_FOCUS
    const senseFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-inspector]") || !sensorGuard.check()) return;

      // Re-entrance guard: prevents focusin from kernel's el.focus() effect
      if (isDispatching()) return;

      const item = findFocusableItem(target);
      if (!item) return;
      const focusTarget = resolveFocusTarget(item);
      if (!focusTarget) return;

      kernel.dispatch(
        SYNC_FOCUS({ id: focusTarget.itemId, zoneId: focusTarget.groupId }),
        {
          meta: {
            input: {
              type: "FOCUS",
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
        kernel.dispatch(RECOVER(), {
          meta: { input: { type: "FOCUS", key: "Recovery" } },
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
