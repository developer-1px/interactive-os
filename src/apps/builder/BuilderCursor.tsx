/**
 * BuilderCursor
 *
 * Visual focus cursor for the Builder canvas.
 * Highlights the currently focused item with a colored border
 * that follows keyboard navigation — replaces mouse cursor.
 *
 * Uses useElementRect for position tracking.
 * Positions are calculated relative to the scroll container,
 * so the highlight scrolls naturally with content.
 */

import { useRef } from "react";
import { findItemElement } from "@/os/2-contexts/itemQueries";
import { useElementRect } from "@/hooks/useElementRect";
import { os } from "@/os/kernel";
import { BuilderApp, findBlockInfo } from "./app";

// ── Color by block type ──
const TYPE_COLORS: Record<string, string> = {
  hero: "#a855f7",
  news: "#f59e0b",
  services: "#3b82f6",
  "service-card": "#3b82f6",
  pricing: "#10b981",
  "pricing-tab": "#10b981",
  tabs: "#6366f1",
  tab: "#6366f1",
  section: "#8b5cf6",
  footer: "#64748b",
};
const DEFAULT_COLOR = "#22c55e";

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

  // ── Block metadata from app state (source of truth) ──
  const blockInfo = BuilderApp.useComputed((s) =>
    itemId ? findBlockInfo(s.data.blocks, itemId) : null,
  );
  const depth = blockInfo?.depth ?? 0;
  const itemType = blockInfo?.type ?? "text";

  // ── DOM element for position tracking ──
  const el = itemId ? findItemElement("canvas", itemId) : null;

  // ── Track element position via pure React hook ──
  const container = containerRef.current?.parentElement ?? null;
  const rect = useElementRect(el, container);

  // ── Animation detection ──
  const now = performance.now();
  if (prevItemRef.current !== null && prevItemRef.current !== itemId) {
    animatingUntilRef.current = now + 150;
  }
  prevItemRef.current = itemId;
  const animating = now < animatingUntilRef.current;

  // ── Derived visual state ──
  const color = TYPE_COLORS[itemType] ?? DEFAULT_COLOR;
  const dimmed = !isActive;

  // Top-level blocks (depth 0) don't show cursor
  if (!rect || depth === 0) {
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
        {/* ID Badge */}
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
          {editing ? `✏️ ${itemType}` : itemType}
        </div>
      </div>
    </div>
  );
}
