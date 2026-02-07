/**
 * OS Navigation Middleware (Built-in)
 *
 * Consumes `effects` array from app state:
 * - FOCUS_ID: sets focus to a specific item (cross-zone capable)
 * - SCROLL_INTO_VIEW: scrolls element into view
 *
 * After processing, clears the effects queue.
 * Apps get this automatically — no manual wiring needed.
 */

import { FocusData } from "@os/features/focus/lib/focusData";
import { produce } from "immer";

interface EffectLike {
    type: string;
    [key: string]: any;
}

interface WithEffects {
    effects?: EffectLike[];
}

export const navigationMiddleware = <S extends WithEffects>(
    nextState: S,
    _action: { type: string; payload?: any },
    _prevState: S,
): S => {
    const effects = nextState.effects;
    if (!effects || effects.length === 0) return nextState;

    // --- FOCUS_ID Effect ---
    const focusEffect = effects.find(
        (e): e is { type: "FOCUS_ID"; id: string | number } =>
            e.type === "FOCUS_ID",
    );

    if (focusEffect && focusEffect.id != null) {
        const targetId = String(focusEffect.id);
        const targetEl = document.getElementById(targetId);

        if (targetEl) {
            const activeGroupId = FocusData.getActiveZoneId();
            let resolved = false;

            // 1st: Check if target is in the current active zone
            if (activeGroupId) {
                const data = FocusData.getById(activeGroupId);
                if (data) {
                    const zoneEl = document.getElementById(activeGroupId);
                    if (zoneEl && zoneEl.contains(targetEl)) {
                        data.store.setState({ focusedItemId: targetId });
                        targetEl.focus({ preventScroll: false });
                        resolved = true;
                    }
                }
            }

            // 2nd: Cross-zone teleport — scan all zones
            if (!resolved) {
                const allZoneIds = FocusData.getOrderedZones();
                for (const zoneId of allZoneIds) {
                    const zoneEl = document.getElementById(zoneId);
                    if (zoneEl && zoneEl.contains(targetEl)) {
                        const data = FocusData.getById(zoneId);
                        if (data) {
                            FocusData.setActiveZone(zoneId);
                            data.store.setState({ focusedItemId: targetId });
                            targetEl.focus({ preventScroll: false });
                            resolved = true;
                            break;
                        }
                    }
                }
            }

            // 3rd: Raw DOM fallback
            if (!resolved) {
                targetEl.focus({ preventScroll: false });
            }
        }
    }

    // --- SCROLL_INTO_VIEW Effect ---
    const scrollEffect = effects.find(
        (e): e is { type: "SCROLL_INTO_VIEW"; id: string | number } =>
            e.type === "SCROLL_INTO_VIEW",
    );

    if (scrollEffect && scrollEffect.id != null) {
        const el = document.getElementById(String(scrollEffect.id));
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }

    // Clear effects queue
    return produce(nextState, (draft: any) => {
        draft.effects = [];
    }) as S;
};
