/**
 * Kernel Lab — Interactive demo page for the kernel engine.
 *
 * Demonstrates: dispatch, createKernel, defineCommand, defineEffect,
 * transaction log with time-travel.
 */

import { KernelPanel } from "@inspector/panels/KernelPanel.tsx";
import { InspectorRegistry } from "@inspector/stores/InspectorRegistry.ts";
import { createKernel, type Transaction } from "@kernel";
import { useEffect, useRef, useState } from "react";
import { useKernelLabBotRoutes } from "./tests/KernelLabBot";

// ─── State Schema ───

interface DemoState {
  count: number;
  items: string[];
  lastAction: string;
}

const INITIAL: DemoState = {
  count: 0,
  items: [],
  lastAction: "(none)",
};

// ─── Effects ───

const effectLog: string[] = [];

// ── Kernel (module-level, registered once) ──

const kernel = createKernel<DemoState>(INITIAL);

// ── Effects ──

const NOTIFY = kernel.defineEffect("NOTIFY", (message: string) => {
  effectLog.push(message);
});

/** Full kernel reset — state + transactions + effect log */
export function resetKernelLab() {
  kernel.reset(INITIAL);
  effectLog.length = 0;
}

const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: {
    ...ctx.state,
    count: ctx.state.count + 1,
    lastAction: "INCREMENT",
  },
}));

const DECREMENT = kernel.defineCommand("DECREMENT", (ctx) => () => ({
  state: {
    ...ctx.state,
    count: ctx.state.count - 1,
    lastAction: "DECREMENT",
  },
}));

const RESET = kernel.defineCommand("RESET", () => () => ({
  state: { ...INITIAL, items: [], lastAction: "RESET" },
}));

const ADD_ITEM = kernel.defineCommand(
  "ADD_ITEM",
  (ctx) => (payload: string) => ({
    state: {
      ...ctx.state,
      items: [...ctx.state.items, payload],
      lastAction: `ADD_ITEM: "${payload}"`,
    },
  }),
);

const REMOVE_LAST_ITEM = kernel.defineCommand(
  "REMOVE_LAST_ITEM",
  (ctx) => () => ({
    state: {
      ...ctx.state,
      items: ctx.state.items.slice(0, -1),
      lastAction: "REMOVE_LAST_ITEM",
    },
  }),
);

const INCREMENT_AND_NOTIFY = kernel.defineCommand(
  "INCREMENT_AND_NOTIFY",
  (ctx) => () => {
    const s = ctx.state;
    return {
      state: { ...s, count: s.count + 1, lastAction: "INCREMENT_AND_NOTIFY" },
      [NOTIFY]: `Count is now ${s.count + 1}`,
    };
  },
);

const BATCH_ADD = kernel.defineCommand("BATCH_ADD", (ctx) => () => {
  const s = ctx.state;
  const timestamp = new Date().toLocaleTimeString();
  return {
    state: {
      ...s,
      items: [...s.items, `Item @ ${timestamp}`],
      lastAction: "BATCH_ADD",
    },
    [NOTIFY]: `Added item at ${timestamp}`,
    dispatch: INCREMENT(),
  };
});

// ─── Components ───

function StatePanel({ state }: { state: DemoState }) {
  return (
    <div style={panelStyle}>
      <h3 style={headingStyle}>📦 State</h3>
      <pre style={preStyle}>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}

function ControlPanel() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={panelStyle}>
      <h3 style={headingStyle}>🎮 Dispatch</h3>

      <div style={sectionStyle}>
        <h4 style={subheadingStyle}>State-only</h4>
        <div style={buttonRowStyle}>
          <button
            type="button"
            style={btnStyle}
            onClick={() => kernel.dispatch(INCREMENT())}
          >
            + Increment
          </button>
          <button
            type="button"
            style={btnStyle}
            onClick={() => kernel.dispatch(DECREMENT())}
          >
            − Decrement
          </button>
          <button
            type="button"
            style={{ ...btnStyle, ...dangerStyle }}
            onClick={() => kernel.dispatch(RESET())}
          >
            ↺ Reset
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input
            ref={inputRef}
            style={inputStyle}
            placeholder="Item name..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputRef.current?.value) {
                kernel.dispatch(ADD_ITEM(inputRef.current.value));
                inputRef.current.value = "";
              }
            }}
          />
          <button
            type="button"
            style={btnStyle}
            onClick={() => {
              if (inputRef.current?.value) {
                kernel.dispatch(ADD_ITEM(inputRef.current.value));
                inputRef.current.value = "";
              }
            }}
          >
            + Add
          </button>
          <button
            type="button"
            style={btnStyle}
            onClick={() => kernel.dispatch(REMOVE_LAST_ITEM())}
          >
            − Remove
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <h4 style={subheadingStyle}>defineCommand (with effects)</h4>
        <div style={buttonRowStyle}>
          <button
            type="button"
            style={{ ...btnStyle, ...accentStyle }}
            onClick={() => kernel.dispatch(INCREMENT_AND_NOTIFY())}
          >
            ⚡ Increment + Notify
          </button>
          <button
            type="button"
            style={{ ...btnStyle, ...accentStyle }}
            onClick={() => kernel.dispatch(BATCH_ADD())}
          >
            ⚡ Batch Add (effect + re-dispatch)
          </button>
        </div>
      </div>
    </div>
  );
}

function EffectLogPanel() {
  const [, refresh] = useState(0);
  return (
    <div style={panelStyle}>
      <h3 style={headingStyle}>
        💫 Effect Log
        <button
          type="button"
          style={{ ...btnSmallStyle, marginLeft: 8 }}
          onClick={() => {
            effectLog.length = 0;
            refresh((n) => n + 1);
          }}
        >
          Clear
        </button>
      </h3>
      {effectLog.length === 0 ? (
        <p style={emptyStyle}>No effects executed yet</p>
      ) : (
        <ul style={listStyle}>
          {effectLog.map((msg, i) => (
            <li key={`${i}-${msg}`} style={listItemStyle}>
              <span style={indexStyle}>#{i}</span> {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TransactionPanel() {
  const txs = kernel.inspector.getTransactions();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleTravel = (tx: Transaction) => {
    kernel.inspector.travelTo(tx.id);
    setSelectedId(tx.id);
  };

  return (
    <div style={{ ...panelStyle, flex: 2 }}>
      <h3 style={headingStyle}>
        🕐 Transaction Log ({txs.length})
        <button
          type="button"
          style={{ ...btnSmallStyle, marginLeft: 8 }}
          onClick={() => {
            kernel.inspector.clearTransactions();
            setSelectedId(null);
          }}
        >
          Clear
        </button>
      </h3>
      {txs.length === 0 ? (
        <p style={emptyStyle}>Dispatch some commands to see transactions</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          {[...txs].reverse().map((tx) => (
            <button
              key={tx.id}
              type="button"
              onClick={() => handleTravel(tx)}
              style={{
                ...txRowStyle,
                ...(selectedId === tx.id ? txSelectedStyle : {}),
              }}
            >
              <span style={txIdStyle}>#{tx.id}</span>
              <span style={txTypeStyle}>{tx.command.type}</span>
              <span style={txHandlerStyle}>{tx.handlerScope}</span>
              {tx.command.payload !== undefined && (
                <span style={txPayloadStyle}>
                  {JSON.stringify(tx.command.payload).slice(0, 30)}
                </span>
              )}
              {tx.effects && (
                <span style={txFxStyle}>
                  fx:{" "}
                  {Object.keys(tx.effects)
                    .filter((k) => tx.effects?.[k] !== undefined)
                    .join(", ")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───

export default function KernelLabPage() {
  const resetKey = useKernelLabBotRoutes();

  // Reset state only — registries stay intact (idempotent, Strict Mode safe)
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey is intentional trigger
  // Reset state only — registries stay intact (idempotent, Strict Mode safe)
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey is intentional trigger
  useEffect(() => {
    resetKernelLab();
  }, [resetKey]);

  // Register Kernel Inspector Panel
  useEffect(() => {
    return InspectorRegistry.register(
      "KERNEL",
      "Kernel Lab",
      <KernelPanel kernel={kernel} />,
    );
  }, []);

  const state = kernel.useComputed((s) => s);

  return (
    <div key={resetKey} style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>⚛️ Kernel Lab</h1>
        <p style={subtitleStyle}>
          dispatch → command → middleware → effect → transaction log
        </p>
      </div>

      <div style={gridStyle}>
        <div style={columnStyle}>
          <StatePanel state={state} />
          <ControlPanel />
          <EffectLogPanel />
        </div>
        <div style={columnStyle}>
          <TransactionPanel />
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───

const pageStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 1200,
  margin: "0 auto",
  fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
  color: "#1e293b",
};

const headerStyle: React.CSSProperties = {
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  marginTop: 4,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
};

const gridStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
};

const columnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  flex: 1,
};

const panelStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
};

const headingStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
};

const subheadingStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 8,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
};

const preStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: 12,
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  overflow: "auto",
  margin: 0,
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 500,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  transition: "all 0.15s",
};

const btnSmallStyle: React.CSSProperties = {
  ...btnStyle,
  padding: "2px 8px",
  fontSize: 11,
};

const dangerStyle: React.CSSProperties = {
  borderColor: "#fca5a5",
  color: "#dc2626",
};

const accentStyle: React.CSSProperties = {
  borderColor: "#a5b4fc",
  color: "#4f46e5",
  background: "#eef2ff",
};

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 12,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  flex: 1,
  outline: "none",
};

const emptyStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  fontStyle: "italic",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const listItemStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 8px",
  background: "#eef2ff",
  borderRadius: 4,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
};

const indexStyle: React.CSSProperties = {
  color: "#94a3b8",
  marginRight: 6,
};

const txRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
  fontSize: 12,
  textAlign: "left" as const,
  width: "100%",
  transition: "all 0.15s",
};

const txSelectedStyle: React.CSSProperties = {
  borderColor: "#818cf8",
  background: "#eef2ff",
  boxShadow: "0 0 0 2px rgba(99,102,241,0.15)",
};

const txIdStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontFamily: "'SF Mono', monospace",
  fontSize: 11,
  minWidth: 24,
};

const txTypeStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#1e293b",
  flex: 1,
};

const txHandlerStyle: React.CSSProperties = {
  fontSize: 10,
  padding: "1px 6px",
  borderRadius: 4,
  background: "#f1f5f9",
  color: "#64748b",
};

const txPayloadStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#94a3b8",
  fontFamily: "'SF Mono', monospace",
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const txFxStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#6366f1",
  fontFamily: "'SF Mono', monospace",
};
