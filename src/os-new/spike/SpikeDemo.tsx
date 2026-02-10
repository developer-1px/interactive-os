/**
 * SpikeDemo — Item + Tab Focus Loop
 *
 * Tab = 다음 아이템, Shift+Tab = 이전 아이템 (순환)
 * Kernel State 기반. DOM 무관.
 */

import { KernelPanel } from "@inspector/panels/KernelPanel.tsx";
import { InspectorRegistry } from "@inspector/stores/InspectorRegistry.ts";
import { useEffect } from "react";
import * as K from "./SpikeKernel";

// ─── Components ───

function Item({ id, label }: { id: string; label: string }) {
  // Mount 시 자동 등록
  useEffect(() => {
    K.kernel.dispatch(K.REGISTER_ITEM(id));
  }, [id]);

  // 포커스 상태 구독
  const isFocused = K.kernel.useComputed((s) => s.items[s.focusedIndex] === id);

  return (
    <div
      data-item-id={id}
      style={{
        padding: "12px 20px",
        margin: "4px 0",
        borderRadius: 8,
        border: isFocused ? "2px solid #4F46E5" : "2px solid transparent",
        background: isFocused ? "#EEF2FF" : "#F8FAFC",
        color: isFocused ? "#4F46E5" : "#64748B",
        fontWeight: isFocused ? 600 : 400,
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 8,
        outline: "none",
      }}
    >
      {isFocused && <span>▸</span>}
      {label}
    </div>
  );
}

function KeyboardListener() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          K.kernel.dispatch(K.FOCUS_PREV());
        } else {
          K.kernel.dispatch(K.FOCUS_NEXT());
        }
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  return null;
}

function FocusIndicator() {
  const focusedIndex = K.kernel.useComputed((s) => s.focusedIndex);
  const itemCount = K.kernel.useComputed((s) => s.items.length);
  const focusedId = K.kernel.useComputed((s) => s.items[s.focusedIndex] ?? "—");

  return (
    <div
      style={{
        marginTop: 16,
        padding: "8px 12px",
        background: "#0F172A",
        color: "#94A3B8",
        borderRadius: 8,
        fontSize: 12,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
      }}
    >
      focus: <span style={{ color: "#E2E8F0" }}>{focusedId}</span> (
      {focusedIndex + 1}/{itemCount})
    </div>
  );
}

export function SpikeDemo() {
  // Register Spike Kernel Inspector Panel
  useEffect(() => {
    return InspectorRegistry.register(
      "SPIKE",
      "Spike Demo",
      <KernelPanel kernel={K.kernel} />,
    );
  }, []);

  return (
    <div
      style={{
        padding: "3rem",
        maxWidth: 400,
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 4 }}>⚛️ Tab Focus Loop</h2>
      <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 24 }}>
        <kbd style={kbdStyle}>Tab</kbd> next ·{" "}
        <kbd style={kbdStyle}>Shift+Tab</kbd> prev
      </p>

      <Item id="item-0" label="Inbox" />
      <Item id="item-1" label="Drafts" />
      <Item id="item-2" label="Sent" />
      <Item id="item-3" label="Archive" />
      <Item id="item-4" label="Trash" />

      <FocusIndicator />
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
