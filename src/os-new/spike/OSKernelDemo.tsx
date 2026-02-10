/**
 * OS Kernel Demo — End-to-End Verification with KeyboardListener
 *
 * Proves the full keybinding pipeline:
 *   1. KeyboardListener → keybindings.resolve → kernel.dispatch(OS_NAVIGATE)
 *   2. Context:    DOM_ITEMS, DOM_RECTS, ZONE_CONFIG (via ZoneRegistry)
 *   3. Command:    NAVIGATE handler → { state, focus, scroll }
 *   4. Effect:     focus(), scroll() on DOM
 *   5. Hook:       kernel.useComputed re-computes
 *   6. Component:  <Zone> + <Item> re-render
 */

import { KernelPanel } from "@inspector/panels/KernelPanel";
import { InspectorRegistry } from "@inspector/stores/InspectorRegistry";
import { produce } from "immer";
import { useEffect } from "react";
import { KeyboardListener } from "../1-listeners/KeyboardListener";
import { useActiveZone } from "../5-hooks/useActiveZone";
import { Item } from "../6-components/Item";
import { Zone } from "../6-components/Zone";
import { kernel } from "../kernel";

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const ZONE_ID = "os-demo-list";
const ITEMS = ["mail", "calendar", "notes", "photos", "settings"];

// ═══════════════════════════════════════════════════════════════════
// Effects (demo-local, will move to 4-effects/ later)
// ═══════════════════════════════════════════════════════════════════

kernel.defineEffect("focus", (itemId: string) => {
  const el = document.querySelector(
    `[data-item-id="${itemId}"]`,
  ) as HTMLElement | null;
  el?.focus({ preventScroll: true });
});

kernel.defineEffect("scroll", (itemId: string) => {
  const el = document.querySelector(
    `[data-item-id="${itemId}"]`,
  ) as HTMLElement | null;
  el?.scrollIntoView({ block: "nearest" });
});

kernel.defineEffect("click", (itemId: string) => {
  const el = document.querySelector(
    `[data-item-id="${itemId}"]`,
  ) as HTMLElement | null;
  el?.click();
});

// ═══════════════════════════════════════════════════════════════════
// Activate Zone Command (used for click-to-activate)
// ═══════════════════════════════════════════════════════════════════

const ACTIVATE_ZONE = kernel.defineCommand(
  "OS_ACTIVATE_ZONE",
  (ctx) => (zoneId: string) => {
    if (ctx.state.os.focus.activeZoneId === zoneId) return;
    return {
      state: produce(ctx.state, (draft) => {
        draft.os.focus.activeZoneId = zoneId;
      }),
    };
  },
);

// ═══════════════════════════════════════════════════════════════════
// React Components
// ═══════════════════════════════════════════════════════════════════

function DemoItem({ id, label }: { id: string; label: string }) {
  const isFocused = kernel.useComputed(
    (s) => s.os.focus.zones[ZONE_ID]?.focusedItemId === id,
  );
  const isSelected = kernel.useComputed(
    (s) => s.os.focus.zones[ZONE_ID]?.selection.includes(id) ?? false,
  );

  return (
    <Item
      id={id}
      style={{
        padding: "10px 16px",
        margin: "3px 0",
        borderRadius: 8,
        border: isFocused
          ? "2px solid #6366F1"
          : isSelected
            ? "2px solid #A5B4FC"
            : "2px solid transparent",
        background: isFocused ? "#EEF2FF" : isSelected ? "#F5F3FF" : "#F8FAFC",
        color: isFocused ? "#4338CA" : isSelected ? "#6D28D9" : "#64748B",
        fontWeight: isFocused ? 600 : 400,
        transition: "all 0.12s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "default",
        fontSize: 14,
      }}
    >
      {isFocused && <span style={{ fontSize: 12 }}>▸</span>}
      {isSelected && <span style={{ fontSize: 10 }}>✓</span>}
      <span style={{ textTransform: "capitalize" }}>{label}</span>
    </Item>
  );
}

function StateIndicator() {
  const focusedId = kernel.useComputed(
    (s) => s.os.focus.zones[ZONE_ID]?.focusedItemId ?? "—",
  );
  const selCount = kernel.useComputed(
    (s) => s.os.focus.zones[ZONE_ID]?.selection.length ?? 0,
  );
  const activeZone = useActiveZone() ?? "—";

  return (
    <div
      style={{
        marginTop: 16,
        padding: "10px 14px",
        background: "#0F172A",
        color: "#94A3B8",
        borderRadius: 8,
        fontSize: 12,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        lineHeight: 1.8,
      }}
    >
      <div>
        zone: <span style={{ color: "#E2E8F0" }}>{activeZone}</span>
      </div>
      <div>
        focus: <span style={{ color: "#818CF8" }}>{focusedId}</span>
      </div>
      <div>
        selected: <span style={{ color: "#C084FC" }}>{selCount}</span> items
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Demo Component
// ═══════════════════════════════════════════════════════════════════

export function OSKernelDemo() {
  // Activate zone on click/focus within the zone
  useEffect(() => {
    const el = document.getElementById(ZONE_ID);
    if (!el) return;

    const onFocusIn = () => kernel.dispatch(ACTIVATE_ZONE(ZONE_ID));
    el.addEventListener("focusin", onFocusIn);
    return () => el.removeEventListener("focusin", onFocusIn);
  }, []);

  // Auto-activate on mount so arrow keys work immediately
  useEffect(() => {
    kernel.dispatch(ACTIVATE_ZONE(ZONE_ID));
  }, []);

  // Register Inspector Panel
  useEffect(() => {
    return InspectorRegistry.register(
      "OS_KERNEL",
      "OS Kernel",
      <KernelPanel kernel={kernel} />,
    );
  }, []);

  return (
    <div
      style={{
        padding: "3rem",
        maxWidth: 420,
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 4, fontSize: 20 }}>🧪 OS Kernel Demo</h2>
      <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 24 }}>
        <kbd style={kbdStyle}>↑↓</kbd> navigate ·{" "}
        <kbd style={kbdStyle}>Space</kbd> select ·{" "}
        <kbd style={kbdStyle}>Enter</kbd> activate
      </p>

      <Zone id={ZONE_ID} role="listbox">
        {ITEMS.map((item) => (
          <DemoItem key={item} id={item} label={item} />
        ))}
      </Zone>

      <StateIndicator />
      <KeyboardListener />
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: 4,
  border: "1px solid #CBD5E1",
  background: "#F1F5F9",
  fontSize: 11,
  fontFamily: "'SF Mono', monospace",
};
