/**
 * SpikeDemo — Item + Tab Focus Loop
 *
 * Tab = 다음 아이템, Shift+Tab = 이전 아이템 (순환)
 * Kernel State 기반. DOM 무관.
 */

import {
  createKernel,
  dispatch,
  initKernel,
  state,
  useComputed,
} from "@kernel";
import { useEffect } from "react";

// ─── State ───

interface OSState {
  focusedIndex: number;
  items: string[];
}

const INITIAL: OSState = { focusedIndex: 0, items: [] };

// ─── Kernel ───

const kernel = createKernel({ state: state<OSState>() });

// ─── Commands ───

const REGISTER_ITEM = kernel.defineCommand(
  "REGISTER_ITEM",
  (ctx) => (itemId: string) => {
    if (ctx.state.items.includes(itemId)) return; // 중복 방지
    return {
      state: {
        ...ctx.state,
        items: [...ctx.state.items, itemId],
      },
    };
  },
);

const FOCUS_NEXT = kernel.defineCommand("FOCUS_NEXT", (ctx) => () => {
  const { items, focusedIndex } = ctx.state;
  if (items.length === 0) return;
  return {
    state: {
      ...ctx.state,
      focusedIndex: (focusedIndex + 1) % items.length,
    },
  };
});

const FOCUS_PREV = kernel.defineCommand("FOCUS_PREV", (ctx) => () => {
  const { items, focusedIndex } = ctx.state;
  if (items.length === 0) return;
  return {
    state: {
      ...ctx.state,
      focusedIndex: (focusedIndex - 1 + items.length) % items.length,
    },
  };
});

// ─── Init ───

initKernel<OSState>(INITIAL);

// ─── Components ───

function Item({ id, label }: { id: string; label: string }) {
  // Mount 시 자동 등록
  useEffect(() => {
    dispatch(REGISTER_ITEM(id));
  }, [id]);

  // 포커스 상태 구독
  const isFocused = useComputed((s: OSState) => s.items[s.focusedIndex] === id);

  return (
    <div
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
          dispatch(FOCUS_PREV());
        } else {
          dispatch(FOCUS_NEXT());
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
  const focusedIndex = useComputed((s: OSState) => s.focusedIndex);
  const itemCount = useComputed((s: OSState) => s.items.length);
  const focusedId = useComputed((s: OSState) => s.items[s.focusedIndex] ?? "—");

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
