/**
 * BuilderCursor — OCP-compliant visual focus cursor.
 *
 * Highlights the currently focused item with a colored border
 * that follows keyboard navigation.
 *
 * T16-2: Also shows a secondary dashed highlight for panel-driven
 * field focus (highlightedItemId from HighlightContext).
 * This is separate from OS focus — edit stays in each context,
 * only visual highlight syncs.
 *
 * Color and tag come from CursorRegistry — each primitive
 * declares its own metadata via useCursorMeta.
 * This file never changes when new primitives are added.
 *
 * Uses useElementRect for position tracking.
 */

import { useContext, useRef } from "react";
import { findItemElement } from "@/os/2-contexts/itemQueries";
import { useElementRect } from "@/hooks/useElementRect";
import { os } from "@/os/kernel";
import { cursorRegistry } from "./model/cursorRegistry";
import { HighlightContext } from "@/pages/builder/PropertiesPanel";

const DEFAULT_COLOR = "#22c55e";
const HIGHLIGHT_COLOR = "#6366f1"; // indigo-500 for panel highlight

/**
 * Must be placed inside the scroll container.
 * The parent element needs `position: relative`.
 */
export function BuilderCursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevItemRef = useRef<string | null>(null);
  const animatingUntilRef = useRef<number>(0);

  // ── Focus state from OS ──
  const { itemId, isActive, editing } = os.useComputed((s) => {
    const zoneId = "canvas";
    const zoneState = s.os.focus.zones[zoneId];
    return {
      itemId: zoneState?.lastFocusedId ?? null,
      isActive: s.os.focus.activeZoneId === zoneId,
      editing: (zoneState?.editingItemId ?? null) !== null,
    };
  });

  // ── Panel highlight from context ──
  const { highlightedItemId } = useContext(HighlightContext);

  // ── Cursor metadata from registry (OCP: no hardcoded types) ──
  const meta = itemId ? cursorRegistry.get(itemId) : null;
  const tag = meta?.tag ?? "unknown";
  const color = meta?.color ?? DEFAULT_COLOR;

  // ── DOM elements for position tracking ──
  const el = itemId ? findItemElement("canvas", itemId) : null;
  const highlightEl = highlightedItemId
    ? findItemElement("canvas", highlightedItemId)
    : null;

  // ── Track element positions ──
  const container = containerRef.current?.parentElement ?? null;
  const rect = useElementRect(el, container);
  const highlightRect = useElementRect(highlightEl, container);

  // ── Animation detection ──
  const now = performance.now();
  if (prevItemRef.current !== null && prevItemRef.current !== itemId) {
    animatingUntilRef.current = now + 150;
  }
  prevItemRef.current = itemId;
  const animating = now < animatingUntilRef.current;

  // ── Derived visual state ──
  const dimmed = !isActive;

  const pad = 3;

  // Show panel highlight only when it differs from OS focus
  const showPanelHighlight =
    highlightRect &&
    highlightedItemId &&
    highlightedItemId !== itemId;

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
      {/* ── OS Focus Cursor (solid border) ── */}
      {rect && (
        <div
          style={{
            position: "absolute",
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            border: editing
              ? "2px solid #3b82f6"
              : `2px solid ${color}`,
            borderRadius: 4,
            background: editing
              ? "rgba(59, 130, 246, 0.04)"
              : `${color}10`,
            boxShadow: editing
              ? "0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 12px 2px rgba(59, 130, 246, 0.15)"
              : `0 0 0 1px ${color}30`,
            opacity: dimmed ? 0.4 : 1,
            transition: animating
              ? "top 120ms ease-out, left 120ms ease-out, width 120ms ease-out, height 120ms ease-out"
              : "none",
          }}
        >
          {/* Tag Badge */}
          <div
            style={{
              position: "absolute",
              top: -22,
              left: -2,
              background: editing ? "#3b82f6" : color,
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
            {editing ? `✏️ ${tag}` : tag}
          </div>
        </div>
      )}

      {/* ── Panel Highlight (dashed border, indigo) ── */}
      {showPanelHighlight && (
        <div
          style={{
            position: "absolute",
            top: highlightRect.top - pad,
            left: highlightRect.left - pad,
            width: highlightRect.width + pad * 2,
            height: highlightRect.height + pad * 2,
            border: `2px dashed ${HIGHLIGHT_COLOR}`,
            borderRadius: 4,
            background: `${HIGHLIGHT_COLOR}08`,
            boxShadow: `0 0 0 1px ${HIGHLIGHT_COLOR}20`,
            transition:
              "top 120ms ease-out, left 120ms ease-out, width 120ms ease-out, height 120ms ease-out",
          }}
        >
          {/* Panel Highlight Badge */}
          <div
            style={{
              position: "absolute",
              bottom: -20,
              right: -2,
              background: HIGHLIGHT_COLOR,
              color: "white",
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              padding: "1px 5px",
              borderRadius: "0 0 3px 3px",
              whiteSpace: "nowrap",
              lineHeight: "14px",
              letterSpacing: "0.02em",
              opacity: 0.8,
            }}
          >
            📋 form
          </div>
        </div>
      )}
    </div>
  );
}
