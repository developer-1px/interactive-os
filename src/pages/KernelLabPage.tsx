/**
 * Kernel Lab — Interactive demo page for the kernel engine.
 *
 * Demonstrates: dispatch, defineHandler, defineCommand, defineEffect,
 * transaction log with time-travel.
 */

import { useEffect, useRef, useSyncExternalStore, useState } from "react";
import {
    initKernel,
    dispatch,
    defineHandler,
    defineCommand,
    defineEffect,
    getTransactions,
    travelTo,
    clearTransactions,
    clearAllRegistries,
    type Store,
    type Transaction,
} from "@kernel";

// ─── DB Schema ───

interface DemoDB {
    count: number;
    items: string[];
    lastAction: string;
}

const INITIAL: DemoDB = {
    count: 0,
    items: [],
    lastAction: "(none)",
};

// ─── Kernel Setup (module-level singleton) ───

let store: Store<DemoDB> | null = null;
const effectLog: string[] = [];

function setupKernel() {
    clearAllRegistries();
    clearTransactions();
    effectLog.length = 0;

    store = initKernel<DemoDB>({ ...INITIAL, items: [] });

    // ── Handlers (pure state only) ──

    defineHandler<DemoDB>("increment", (db) => ({
        ...db,
        count: db.count + 1,
        lastAction: "increment",
    }));

    defineHandler<DemoDB>("decrement", (db) => ({
        ...db,
        count: db.count - 1,
        lastAction: "decrement",
    }));

    defineHandler<DemoDB>("reset", () => ({
        ...INITIAL,
        items: [],
        lastAction: "reset",
    }));

    defineHandler<DemoDB>("add-item", (db, payload) => ({
        ...db,
        items: [...db.items, payload as string],
        lastAction: `add-item: "${payload}"`,
    }));

    defineHandler<DemoDB>("remove-last-item", (db) => ({
        ...db,
        items: db.items.slice(0, -1),
        lastAction: "remove-last-item",
    }));

    // ── Commands (with effects) ──

    defineCommand<DemoDB>("increment-and-notify", (ctx) => {
        const db = ctx.db;
        return {
            db: { ...db, count: db.count + 1, lastAction: "increment-and-notify" },
            notify: `Count is now ${db.count + 1}`,
        };
    });

    defineCommand<DemoDB>("batch-add", (ctx) => {
        const db = ctx.db;
        const timestamp = new Date().toLocaleTimeString();
        return {
            db: {
                ...db,
                items: [...db.items, `Item @ ${timestamp}`],
                lastAction: "batch-add",
            },
            notify: `Added item at ${timestamp}`,
            dispatch: { type: "increment" },
        };
    });

    // ── Effects ──

    defineEffect("notify", (message) => {
        effectLog.push(message as string);
    });
}

// ─── React Hook: subscribe to store ───

function useKernelState(): DemoDB {
    if (!store) setupKernel();
    return useSyncExternalStore(
        store!.subscribe,
        store!.getState,
        store!.getState,
    );
}

function useForceUpdate() {
    const [, set] = useState(0);
    return () => set((n) => n + 1);
}

// ─── Components ───

function StatePanel({ db }: { db: DemoDB }) {
    return (
        <div style={panelStyle}>
            <h3 style={headingStyle}>📦 State (db)</h3>
            <pre style={preStyle}>{JSON.stringify(db, null, 2)}</pre>
        </div>
    );
}

function ControlPanel({ forceUpdate }: { forceUpdate: () => void }) {
    const inputRef = useRef<HTMLInputElement>(null);

    const send = (type: string, payload?: unknown) => {
        dispatch({ type, payload });
        forceUpdate();
    };

    return (
        <div style={panelStyle}>
            <h3 style={headingStyle}>🎮 Dispatch</h3>

            <div style={sectionStyle}>
                <h4 style={subheadingStyle}>defineHandler</h4>
                <div style={buttonRowStyle}>
                    <button type="button" style={btnStyle} onClick={() => send("increment")}>
                        + Increment
                    </button>
                    <button type="button" style={btnStyle} onClick={() => send("decrement")}>
                        − Decrement
                    </button>
                    <button type="button" style={{ ...btnStyle, ...dangerStyle }} onClick={() => send("reset")}>
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
                                send("add-item", inputRef.current.value);
                                inputRef.current.value = "";
                            }
                        }}
                    />
                    <button
                        type="button"
                        style={btnStyle}
                        onClick={() => {
                            if (inputRef.current?.value) {
                                send("add-item", inputRef.current.value);
                                inputRef.current.value = "";
                            }
                        }}
                    >
                        + Add
                    </button>
                    <button type="button" style={btnStyle} onClick={() => send("remove-last-item")}>
                        − Remove
                    </button>
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={subheadingStyle}>defineCommand (with effects)</h4>
                <div style={buttonRowStyle}>
                    <button type="button" style={{ ...btnStyle, ...accentStyle }} onClick={() => send("increment-and-notify")}>
                        ⚡ Increment + Notify
                    </button>
                    <button type="button" style={{ ...btnStyle, ...accentStyle }} onClick={() => send("batch-add")}>
                        ⚡ Batch Add (effect + re-dispatch)
                    </button>
                </div>
            </div>
        </div>
    );
}

function EffectLogPanel({ forceUpdate }: { forceUpdate: () => void }) {
    return (
        <div style={panelStyle}>
            <h3 style={headingStyle}>
                💫 Effect Log
                <button
                    type="button"
                    style={{ ...btnSmallStyle, marginLeft: 8 }}
                    onClick={() => { effectLog.length = 0; forceUpdate(); }}
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

function TransactionPanel({ forceUpdate }: { forceUpdate: () => void }) {
    const txs = getTransactions();
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleTravel = (tx: Transaction) => {
        travelTo(tx.id);
        setSelectedId(tx.id);
        forceUpdate();
    };

    return (
        <div style={{ ...panelStyle, flex: 2 }}>
            <h3 style={headingStyle}>
                🕐 Transaction Log ({txs.length})
                <button
                    type="button"
                    style={{ ...btnSmallStyle, marginLeft: 8 }}
                    onClick={() => { clearTransactions(); setSelectedId(null); forceUpdate(); }}
                >
                    Clear
                </button>
            </h3>
            {txs.length === 0 ? (
                <p style={emptyStyle}>Dispatch some commands to see transactions</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 400, overflowY: "auto" }}>
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
                            <span style={txHandlerStyle}>{tx.handlerType}</span>
                            {tx.command.payload !== undefined && (
                                <span style={txPayloadStyle}>
                                    {JSON.stringify(tx.command.payload).slice(0, 30)}
                                </span>
                            )}
                            {tx.effects && (
                                <span style={txFxStyle}>
                                    fx: {Object.keys(tx.effects).filter(k => tx.effects![k] !== undefined).join(", ")}
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
    const forceUpdate = useForceUpdate();

    useEffect(() => {
        setupKernel();
        forceUpdate();
    }, []);

    const db = useKernelState();

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>⚛️ Kernel Lab</h1>
                <p style={subtitleStyle}>
                    dispatch → handler/command → effect → transaction log
                </p>
            </div>

            <div style={gridStyle}>
                <div style={columnStyle}>
                    <StatePanel db={db} />
                    <ControlPanel forceUpdate={forceUpdate} />
                    <EffectLogPanel forceUpdate={forceUpdate} />
                </div>
                <div style={columnStyle}>
                    <TransactionPanel forceUpdate={forceUpdate} />
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
    textAlign: "left",
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
