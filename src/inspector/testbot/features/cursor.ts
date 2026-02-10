/**
 * TestBot — Cursor Module (Store-driven)
 *
 * Creates the BotCursor imperative API that TestBot actions call.
 * All methods write to the Zustand store; CursorOverlay.tsx renders.
 */

import type { BotCursor, BubbleVariant } from "../entities/BotCursor";
import {
  addCursorBubble,
  addCursorRipple,
  addStamp,
  clearAllStamps,
  clearCursorBubbles,
  hideCursor,
  setCursorState,
  showCursor,
  useTestBotStore,
} from "./TestBotStore";

// Re-export for consumers that import from this module
export type { BotCursor, BubbleVariant } from "../entities/BotCursor";

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createCursor(): BotCursor {
  let destroyed = false;

  // Show cursor in store (initializes cursorState)
  showCursor();

  // ── Methods ──────────────────────────────────────────────────────

  const moveTo = (
    targetX: number,
    targetY: number,
    durationMs: number,
  ): Promise<void> =>
    new Promise((resolve) => {
      setCursorState({ x: targetX, y: targetY, transitionMs: durationMs });
      setTimeout(resolve, durationMs + 20);
    });

  const trackElement = (el: Element | null) => {
    setCursorState({ trackedEl: el });
  };

  const ripple = () => {
    const cur = useTestBotStore.getState().cursorState;
    if (cur) addCursorRipple(cur.x, cur.y);
  };

  const showBubble = (label: string, variant: BubbleVariant = "default") => {
    addCursorBubble(label, variant);
  };

  const showStatus = (
    type: "pass" | "fail",
    selector?: string,
    el?: Element,
  ) => {
    const targetEl = el ?? (selector ? document.querySelector(selector) : null);
    if (!targetEl) return;
    addStamp(type, targetEl, selector ?? "");
  };

  const showOffScreenPtr = (tx: number, ty: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const padding = 40;

    let cx = Math.max(padding, Math.min(w - padding, tx));
    let cy = Math.max(padding, Math.min(h - padding, ty));

    let rotation = 0;
    if (ty > h) {
      rotation = 0;
      cy = h - padding;
    } else if (ty < 0) {
      rotation = 180;
      cy = padding;
    } else if (tx > w) {
      rotation = -90;
      cx = w - padding;
    } else if (tx < 0) {
      rotation = 90;
      cx = padding;
    }

    setCursorState({
      x: cx,
      y: cy,
      transitionMs: 300,
      offScreen: true,
      offScreenRotation: rotation,
    });
  };

  const hideOffScreenPtr = () => {
    const cur = useTestBotStore.getState().cursorState;
    if (cur?.offScreen) {
      setCursorState({ offScreen: false, offScreenRotation: 0 });
    }
  };

  const clearBubbles = () => {
    clearCursorBubbles();
  };

  const clearStamps = () => {
    clearAllStamps();
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    hideCursor();
    clearAllStamps();
  };

  const getPosition = () => {
    const cur = useTestBotStore.getState().cursorState;
    return cur ? { x: cur.x, y: cur.y } : { x: 0, y: 0 };
  };

  return {
    moveTo,
    trackElement,
    ripple,
    showBubble,
    showStatus,
    showOffScreenPtr,
    hideOffScreenPtr,
    clearBubbles,
    clearStamps,
    destroy,
    getPosition,
  };
}
