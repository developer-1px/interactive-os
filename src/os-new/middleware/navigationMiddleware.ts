/**
 * OS Navigation Middleware (Built-in)
 *
 * Consumes `effects` array from app state:
 * - FOCUS_ID: sets focusedItemId in zone store (React handles actual .focus())
 * - SCROLL_INTO_VIEW: scrolls element into view
 *
 * After processing, clears the effects queue.
 * Apps get this automatically — no manual wiring needed.
 */

import type { Middleware } from "@os/core/command/model/createCommandStore";
import { FocusData } from "@os/core/focus/lib/focusData";
import { produce } from "immer";

interface EffectLike {
  type: string;
  [key: string]: any;
}

interface WithEffects {
  effects?: EffectLike[];
}

export const navigationMiddleware: Middleware<any, any> =
  (next) => (state, action) => {
    // Execute command first (POST middleware)
    const nextState = next(state, action);

    const effects = (nextState as WithEffects).effects;
    if (!effects || effects.length === 0) return nextState;

    // --- FOCUS_ID Effect ---
    const focusEffect = effects.find(
      (e): e is { type: "FOCUS_ID"; id: string | number; zoneId?: string } =>
        e.type === "FOCUS_ID",
    );

    if (focusEffect && focusEffect.id != null) {
      const targetId = String(focusEffect.id);

      // Determine which zone to update
      const zoneId = focusEffect.zoneId || FocusData.getActiveZoneId();

      if (zoneId) {
        const zoneData = FocusData.getById(zoneId);
        if (zoneData) {
          // Only set state — React (FocusItem useEffect) will handle .focus()
          zoneData.store.setState({ focusedItemId: targetId });
        }
      }
    }

    // --- SCROLL_INTO_VIEW Effect ---
    const scrollEffect = effects.find(
      (e): e is { type: "SCROLL_INTO_VIEW"; id: string | number } =>
        e.type === "SCROLL_INTO_VIEW",
    );

    if (scrollEffect && scrollEffect.id != null) {
      // Defer to next frame so React has rendered
      requestAnimationFrame(() => {
        const el = document.getElementById(String(scrollEffect.id));
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }

    // Clear effects queue
    return produce(nextState, (draft: any) => {
      draft.effects = [];
    });
  };
