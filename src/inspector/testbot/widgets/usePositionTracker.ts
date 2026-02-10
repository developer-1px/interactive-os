/**
 * usePositionTracker — Shared observer for stamp position tracking
 *
 * Sets up ONE set of observers (scroll, resize, mutation, ResizeObserver)
 * and batch-updates all stamp positions via requestAnimationFrame.
 * Auto-cleans up on unmount.
 */

import { useEffect, useRef } from "react";
import {
  updateStampPositions,
  useTestBotStore,
} from "../features/TestBotStore";

export function usePositionTracker() {
  const rafId = useRef(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const trackedEls = useRef(new Set<Element>());

  useEffect(() => {
    // ── Batched update via rAF ─────────────────────────────────────
    const scheduleUpdate = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        updateStampPositions();
      });
    };

    // ── Scroll (capture to catch nested scroll containers) ────────
    document.addEventListener("scroll", scheduleUpdate, {
      capture: true,
      passive: true,
    });

    // ── Window resize ─────────────────────────────────────────────
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    // ── MutationObserver (DOM structure changes) ──────────────────
    const mo = new MutationObserver(scheduleUpdate);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // ── ResizeObserver (element size changes) ─────────────────────
    const ro = new ResizeObserver(scheduleUpdate);
    roRef.current = ro;

    // ── Subscribe to stamp changes to observe/unobserve elements ─
    const unsub = useTestBotStore.subscribe((state, prev) => {
      if (state.stamps === prev.stamps) return;

      const currentEls = new Set(state.stamps.map((s) => s.el));

      // Observe new elements
      for (const el of currentEls) {
        if (!trackedEls.current.has(el) && el.isConnected) {
          ro.observe(el);
          trackedEls.current.add(el);
        }
      }

      // Unobserve removed elements
      for (const el of trackedEls.current) {
        if (!currentEls.has(el)) {
          ro.unobserve(el);
          trackedEls.current.delete(el);
        }
      }
    });

    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener("scroll", scheduleUpdate, { capture: true });
      window.removeEventListener("resize", scheduleUpdate);
      mo.disconnect();
      ro.disconnect();
      trackedEls.current.clear();
      unsub();
    };
  }, []);
}
