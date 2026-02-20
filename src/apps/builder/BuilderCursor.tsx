/**
 * BuilderCursor
 *
 * Visual focus cursor for the Builder canvas.
 * Highlights the currently focused item with a colored border
 * that follows keyboard navigation — replaces mouse cursor.
 *
 * Positions are calculated relative to the scroll container,
 * so the highlight scrolls naturally with content.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { os } from "@/os/kernel";
import { ZoneRegistry } from "@/os/2-contexts/zoneRegistry";

/** Zone-scoped element lookup: searches within active zone container first. */
function findItemInZone(zoneId: string | null, itemId: string): HTMLElement | null {
  const zoneEl = zoneId ? ZoneRegistry.get(zoneId)?.element : null;
  if (zoneEl) {
    const scoped = zoneEl.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`);
    if (scoped) return scoped;
  }
  return document.getElementById(itemId);
}

// ── Color palette for Builder levels ──
const LEVEL_COLORS = {
  section: "#a855f7", // purple-500
  group: "#3b82f6", // blue-500
  item: "#22c55e", // green-500
  default: "#6366f1", // indigo-500 (fallback)
};

function getLevelColor(el: HTMLElement): string {
  const level = el.getAttribute("data-level");
  if (level === "section") return LEVEL_COLORS.section;
  if (level === "group") return LEVEL_COLORS.group;
  if (level === "item") return LEVEL_COLORS.item;
  return LEVEL_COLORS.default;
}

interface OverlayState {
  visible: boolean;
  top: number;
  left: number;
  width: number;
  height: number;
  itemId: string;
  zoneId: string;
  color: string;
  animating: boolean;
}

const HIDDEN: OverlayState = {
  visible: false,
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  itemId: "",
  zoneId: "",
  color: "#6366f1",
  animating: false,
};

/**
 * Must be placed inside the scroll container.
 * The parent element needs `position: relative`.
 */
export function BuilderCursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<OverlayState>(HIDDEN);
  const prevItemRef = useRef<string | null>(null);
  const animatingUntilRef = useRef<number>(0);

  const measure = useCallback(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const s = os.getState();
    const zoneId = s.os.focus.activeZoneId;
    const zoneState = zoneId ? s.os.focus.zones[zoneId] : null;
    const itemId = zoneState?.focusedItemId ?? null;
    const el = itemId ? findItemInZone(zoneId, itemId) : null;

    if (!el || !itemId || !zoneId) {
      setState((prev) => (prev.visible ? HIDDEN : prev));
      prevItemRef.current = null;
      return;
    }

    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (elRect.width === 0 && elRect.height === 0) {
      setState((prev) => (prev.visible ? HIDDEN : prev));
      return;
    }

    const now = performance.now();

    // Focus moved → start animation window
    if (prevItemRef.current !== null && prevItemRef.current !== itemId) {
      animatingUntilRef.current = now + 150;
    }
    prevItemRef.current = itemId;

    // Animate if within the animation window
    const animating = now < animatingUntilRef.current;

    // Convert viewport coords to container-relative coords
    const top = elRect.top - containerRect.top + container.scrollTop;
    const left = elRect.left - containerRect.left + container.scrollLeft;

    setState({
      visible: true,
      top,
      left,
      width: elRect.width,
      height: elRect.height,
      itemId,
      zoneId,
      color: getLevelColor(el),
      animating,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;
    let prevEl: HTMLElement | null = null;

    const setupObservers = () => {
      ro?.disconnect();
      mo?.disconnect();
      prevEl = null;

      ro = new ResizeObserver(measure);
      if (container) ro.observe(container);

      // Observe the currently focused element
      const s = os.getState();
      const zoneId = s.os.focus.activeZoneId;
      const zoneState = zoneId ? s.os.focus.zones[zoneId] : null;
      const itemId = zoneState?.focusedItemId;
      const el = itemId ? findItemInZone(zoneId, itemId) : null;
      if (el) {
        ro.observe(el);
        prevEl = el;
      }

      // MutationObserver for sibling/ancestor layout shifts
      if (container) {
        mo = new MutationObserver(measure);
        mo.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style"],
        });
      }
    };

    // Subscribe to kernel state changes
    const unsub = os.subscribe(() => {
      const s = os.getState();
      const zoneId = s.os.focus.activeZoneId;
      const zoneState = zoneId ? s.os.focus.zones[zoneId] : null;
      const newItemId = zoneState?.focusedItemId ?? null;
      const newEl = newItemId ? findItemInZone(zoneId, newItemId) : null;

      if (newEl !== prevEl && ro) {
        if (prevEl) ro.unobserve(prevEl);
        if (newEl) ro.observe(newEl);
        prevEl = newEl;
      }
      measure();
    });

    setupObservers();
    measure();

    return () => {
      unsub();
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [measure]);

  if (!state.visible) {
    return (
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    );
  }

  const pad = 3;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {/* Highlight box */}
      <div
        style={{
          position: "absolute",
          top: state.top - pad,
          left: state.left - pad,
          width: state.width + pad * 2,
          height: state.height + pad * 2,
          border: `2px solid ${state.color}`,
          borderRadius: 4,
          background: `${state.color}10`,
          boxShadow: `0 0 0 1px ${state.color}30`,
          transition: state.animating
            ? "top 120ms ease-out, left 120ms ease-out, width 120ms ease-out, height 120ms ease-out"
            : "none",
        }}
      >
        {/* ID Badge */}
        <div
          style={{
            position: "absolute",
            top: -22,
            left: -2,
            background: state.color,
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
            padding: "2px 6px",
            borderRadius: "4px 4px 0 0",
            whiteSpace: "nowrap",
            lineHeight: "16px",
            letterSpacing: "0.02em",
          }}
        >
          {state.itemId}
        </div>

        {/* Zone Badge */}
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -2,
            color: "#94a3b8",
            fontSize: 9,
            fontWeight: 600,
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
            padding: "1px 5px",
            borderRadius: "0 0 3px 3px",
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(0,0,0,0.08)",
            whiteSpace: "nowrap",
            lineHeight: "14px",
          }}
        >
          zone: {state.zoneId}
        </div>
      </div>
    </div>
  );
}
