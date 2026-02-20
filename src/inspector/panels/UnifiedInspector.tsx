/**
 * UnifiedInspector — Unified Sections (Refined v10)
 *
 * Modified to include standard state management inspector features:
 * - Search & Filtering
 * - Time Delta (∆ms)
 * - Session Export (JSON Download)
 * - Expand/Collapse All
 */

import type { Transaction } from "@kernel/core/transaction";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Database,
  Download,
  Eye,
  Keyboard,
  Layers,
  ListMinus,
  ListTree,
  MousePointer2,
  MousePointerClick,
  Package,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { inferSignal } from "../utils/inferSignal";

// ─── Helpers ───

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Failed to copy context: ", err);
  });
}

function downloadSession(transactions: Transaction[]) {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(transactions, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute(
    "download",
    `inspector-session-${Date.now()}.json`,
  );
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function formatAiContext(
  tx: Transaction,
  signal: ReturnType<typeof inferSignal>,
): string {
  const trigger = `**Action**: ${signal.trigger.kind} (Raw: ${signal.trigger.raw}${signal.trigger.elementId ? `, Element: ${signal.trigger.elementId}` : ""})`;
  const command = `**Command**: \`${signal.command.type}\``;
  const payload = `**Payload**: \`${JSON.stringify(signal.command.payload)}\``;

  let diffStr = "**Diff**: None";
  if (signal.diff.length > 0) {
    diffStr =
      "**Diff**:\n" +
      signal.diff
        .map(
          (d) =>
            `  - \`${d.path}\`: \`${JSON.stringify(d.from)}\` -> \`${JSON.stringify(d.to)}\``,
        )
        .join("\n");
  }

  let effectStr = "";
  if (signal.effects.length > 0) {
    effectStr =
      `\n**Effects**: \n` +
      signal.effects.map((e) => `  - \`${e}\``).join("\n");
  }

  return `**[Inspector Captured Event - ${formatTime(tx.timestamp)}]**\n- ${trigger}\n- ${command}\n- ${payload}\n${diffStr}${effectStr}`;
}

// ─── Highlighting ───

function highlightElement(id: string | undefined, active: boolean) {
  if (!id) return;
  const el =
    document.querySelector(`[data-id="${id}"]`) ||
    document.querySelector(`[data-zone-id="${id}"]`) ||
    document.getElementById(id);

  if (el && el instanceof HTMLElement) {
    if (active) {
      el.dataset["inspectorHighlight"] = "true";
      el.style.outline = "2px solid #f06595";
      el.style.outlineOffset = "2px";
      el.style.boxShadow = "0 0 0 4px rgba(240, 101, 149, 0.3)";
      el.style.transition = "all 0.2s";
    } else {
      delete el.dataset["inspectorHighlight"];
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.boxShadow = "";
    }
  }
}

// ─── Component ───

export function UnifiedInspector({
  transactions,
  storeState,
  onClear,
}: {
  transactions: Transaction[];
  storeState?: Record<string, unknown>;
  onClear?: () => void;
}) {
  const [showOsEvents, setShowOsEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualToggles, setManualToggles] = useState<Set<number>>(new Set());
  const [traceOpen, setTraceOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(false);

  // Compute filtered view based on OS Events and Search Query
  const filteredTx = useMemo(() => {
    let result = transactions;

    if (!showOsEvents) {
      result = result.filter((tx) => inferSignal(tx).type !== "OS");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((tx) => {
        const signal = inferSignal(tx);
        // Search in command type, trigger raw, or element ID
        if (signal.command.type.toLowerCase().includes(q)) return true;
        if (signal.trigger.raw.toLowerCase().includes(q)) return true;
        if (signal.trigger.elementId?.toLowerCase().includes(q)) return true;

        // Search in effects
        if (signal.effects.some((e) => e.toLowerCase().includes(q)))
          return true;

        // Search in diff paths
        if (signal.diff.some((d) => d.path.toLowerCase().includes(q)))
          return true;

        return false;
      });
    }

    return result;
  }, [transactions, showOsEvents, searchQuery]);

  const latestTxId =
    filteredTx.length > 0 ? filteredTx[filteredTx.length - 1]?.id : undefined;
  const expandedIds = new Set(manualToggles);

  // Auto-expand latest only if user hasn't manually collapsed it & no active search
  if (
    latestTxId !== undefined &&
    !manualToggles.has(latestTxId) &&
    !searchQuery
  ) {
    expandedIds.add(latestTxId);
  }

  // ── Discord/Slack-style auto-scroll ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const prevTxCount = useRef(transactions.length);

  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setIsUserScrolled(false);
  }, []);

  const handleScroll = useCallback(() => {
    setIsUserScrolled(!isAtBottom());
  }, [isAtBottom]);

  // Auto-scroll logic
  useEffect(() => {
    if (filteredTx.length > prevTxCount.current) {
      if (!isUserScrolled && !searchQuery) {
        requestAnimationFrame(() => {
          const el = scrollRef.current;
          if (!el) return;
          el.scrollTop = el.scrollHeight;
        });
      }
    }
    prevTxCount.current = filteredTx.length;
  }, [filteredTx.length, isUserScrolled, searchQuery]);

  const toggle = (id: number) => {
    setManualToggles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set(filteredTx.map((t) => t.id));
    setManualToggles(all);
  };

  const collapseAll = () => {
    // If we collapse all, we also add the very latest to manualToggles so it doesn't auto-expand
    const next = new Set<number>();
    if (latestTxId !== undefined) next.add(latestTxId);
    setManualToggles(next);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white text-[#333] font-sans text-[10px] select-none">
      <div className="flex flex-col border-b border-[#e0e0e0] bg-white z-20 shrink-0 sticky top-0">
        {/* Top Header Row */}
        <div className="h-7 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-[#007acc]" />
            <span className="font-bold text-[#555] text-[10px]">Inspector</span>
            <span className="text-[#999] text-[9px] font-mono">
              {filteredTx.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <label className="flex items-center gap-1 cursor-pointer text-[#64748b] hover:text-[#333] px-1 py-0.5 rounded hover:bg-[#f5f5f5]">
              <input
                type="checkbox"
                checked={showOsEvents}
                onChange={(e) => setShowOsEvents(e.target.checked)}
                className="w-2.5 h-2.5 accent-blue-500"
              />
              <span className="text-[9px]">OS</span>
            </label>

            <button
              type="button"
              onClick={() => downloadSession(transactions)}
              className="p-1 rounded text-[#94a3b8] hover:text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
              title="Export JSON"
            >
              <Download size={11} />
            </button>

            {onClear && filteredTx.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setManualToggles(new Set());
                  setSearchQuery("");
                }}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold text-[#999] hover:text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer border border-[#e5e5e5]"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Search & Actions Row */}
        <div className="h-6 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center px-1.5 gap-1">
          <div className="flex-1 relative">
            <Search
              size={9}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#b0b0b0]"
            />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[9px] bg-white border border-[#e0e0e0] focus:border-[#3b82f6] rounded pl-5 pr-4 py-0.5 outline-none text-[#334155] placeholder:text-[#ccc]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#ef4444] text-[8px] leading-none"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={expandAll}
            className="p-0.5 text-[#b0b0b0] hover:text-[#3b82f6] rounded"
            title="Expand All"
          >
            <ListTree size={11} />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="p-0.5 text-[#b0b0b0] hover:text-[#333] rounded"
            title="Collapse All"
          >
            <ListMinus size={11} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto"
        >
          {/* ── Trace Log Section ── */}
          <CollapsibleSection
            title="Trace Log"
            icon={<Layers size={9} />}
            open={traceOpen}
            onToggle={() => setTraceOpen(!traceOpen)}
            count={filteredTx.length}
          >
            {filteredTx.length === 0 ? (
              <div className="p-4 text-center text-[#999] italic text-[10px]">
                {searchQuery ? "No match." : "No events yet."}
              </div>
            ) : (
              filteredTx.map((tx, i) => {
                const prevTx = i > 0 ? filteredTx[i - 1] : undefined;
                const timeDeltaMs = prevTx
                  ? tx.timestamp - prevTx.timestamp
                  : 0;
                return (
                  <TimelineNode
                    key={tx.id}
                    tx={tx}
                    index={i + 1}
                    expanded={expandedIds.has(tx.id)}
                    onToggle={() => toggle(tx.id)}
                    dataIndex={i}
                    timeDeltaMs={timeDeltaMs}
                  />
                );
              })
            )}
          </CollapsibleSection>

          {/* ── Store State Section ── */}
          {storeState && (
            <CollapsibleSection
              title="Store State"
              icon={<Package size={9} />}
              open={storeOpen}
              onToggle={() => setStoreOpen(!storeOpen)}
            >
              <div className="p-1.5 bg-[#1e293b] overflow-x-auto">
                <pre className="text-[9px] font-mono text-[#e2e8f0] leading-snug whitespace-pre-wrap break-all">
                  {JSON.stringify(storeState, null, 2)}
                </pre>
              </div>
            </CollapsibleSection>
          )}

          {/* Bottom spacer */}
          {transactions.length > 0 && (
            <div style={{ height: "80%" }} aria-hidden />
          )}
        </div>

        {/* Jump to latest */}
        {isUserScrolled && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#334155] text-white text-[9px] font-semibold hover:bg-[#1e293b] cursor-pointer border-none"
          >
            <ChevronDown size={10} />
            Latest
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineNode({
  tx,
  index,
  expanded,
  onToggle,
  dataIndex,
  timeDeltaMs,
}: {
  tx: Transaction;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  dataIndex: number;
  timeDeltaMs: number;
}) {
  const signal = inferSignal(tx);
  const { type, trigger, command, diff, effects } = signal;

  const isNoOp = type === "NO_OP";
  const opacityClass = isNoOp ? "opacity-50 hover:opacity-100" : "";

  const icon =
    trigger.kind === "MOUSE" ? (
      trigger.raw === "Click" ? (
        <MousePointerClick
          size={12}
          className="text-[#3b82f6]"
          strokeWidth={2.5}
        />
      ) : (
        <MousePointer2 size={12} className="text-[#3b82f6]" strokeWidth={2.5} />
      )
    ) : trigger.kind === "FOCUS" ? (
      <Eye size={12} className="text-[#10b981]" strokeWidth={2.5} />
    ) : (
      <Keyboard size={12} className="text-[#f59e0b]" strokeWidth={2.5} />
    );

  // Styling delta times based on performance thresholds
  const deltaColorClass =
    timeDeltaMs > 500
      ? "text-[#ef4444]"
      : timeDeltaMs > 100
        ? "text-[#f59e0b]"
        : "text-[#94a3b8]";

  return (
    <div
      data-tx-index={dataIndex}
      className={`flex flex-col border-b border-[#eee] transition-opacity ${opacityClass} ${expanded ? "bg-[#f9fafb]" : "hover:bg-[#fafafa]"}`}
    >
      <div className="flex items-center w-full">
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle();
          }}
          className="flex-1 flex items-center gap-1.5 px-2 py-1 cursor-pointer bg-transparent border-none text-left min-w-0"
        >
          {/* Icon */}
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {icon}
          </div>

          {/* # + Trigger + Element */}
          <span className="font-mono text-[8px] text-[#b0b0b0] shrink-0">
            #{index}
          </span>
          <span className="font-semibold text-[10px] truncate text-[#1e293b]">
            {trigger.raw || "Unknown"}
          </span>
          {trigger.elementId && (
            <span
              className="px-0.5 rounded text-[#c2255c] text-[8px] font-mono bg-[#fff0f6] cursor-help max-w-[70px] truncate shrink-0"
              title={`Element: ${trigger.elementId}`}
              onMouseEnter={() => highlightElement(trigger.elementId, true)}
              onMouseLeave={() => highlightElement(trigger.elementId, false)}
              onClick={(e) => e.stopPropagation()}
            >
              {trigger.elementId}
            </span>
          )}

          {/* Command Badge */}
          {command.type !== "NO_COMMAND" && (
            <span className="px-1 py-px rounded bg-[#eff6ff] text-[#2563eb] text-[8px] font-semibold shrink-0">
              {command.type}
            </span>
          )}

          <span className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className={`text-[8px] font-mono ${deltaColorClass}`}>
              +{timeDeltaMs}ms
            </span>
            <span className="text-[8px] text-[#ccc] font-mono tabular-nums hidden sm:inline">
              {formatTime(tx.timestamp).split(".")[0]}
            </span>
          </span>
        </button>

        {/* Copy for AI */}
        {expanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(formatAiContext(tx, signal));
            }}
            title="Copy for AI"
            className="shrink-0 mr-1.5 p-1 rounded text-[#b0b0b0] hover:bg-[#e0e7ff] hover:text-[#4f46e5] cursor-pointer bg-transparent border-none"
          >
            <ClipboardCopy size={11} />
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="flex flex-col gap-1 pl-8 pr-2 pb-2">
          {/* ── State Mutation (Diff) ── */}
          {diff.length > 0 && (
            <Section title="Diff">
              {diff.map((d: { path: string; from?: unknown; to?: unknown }) => (
                <Row key={d.path}>
                  <span
                    className="text-[#475569] font-mono text-[9px] truncate max-w-[40%]"
                    title={d.path}
                  >
                    {d.path}
                  </span>
                  <span className="ml-auto flex items-center gap-1 shrink-0 font-mono overflow-hidden text-[9px]">
                    <span
                      className="text-[#ef4444] line-through opacity-60 truncate max-w-[100px]"
                      title={JSON.stringify(d.from)}
                    >
                      {JSON.stringify(d.from)}
                    </span>
                    <span className="text-[#b0b0b0]">→</span>
                    <span
                      className="text-[#10b981] font-bold truncate max-w-[100px]"
                      title={JSON.stringify(d.to)}
                    >
                      {JSON.stringify(d.to)}
                    </span>
                  </span>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Effects ── */}
          {effects.length > 0 && (
            <Section title="Effects">
              {effects.map((key, idx) => (
                <Row key={`${key}-${idx}`}>
                  <Check
                    size={9}
                    className="text-[#10b981] shrink-0"
                    strokeWidth={3}
                  />
                  <span className="font-mono text-[#334155] text-[9px]">
                    {key}
                  </span>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Kernel Details ── */}
          {tx.handlerScope && (
            <Section title="Kernel">
              <Row>
                <span className="text-[#94a3b8] text-[8px] font-bold w-10 shrink-0">
                  HANDLER
                </span>
                <span className="font-mono text-[#2563eb] font-semibold text-[9px]">
                  {tx.handlerScope}
                </span>
              </Row>
              <Row>
                <span className="text-[#94a3b8] text-[8px] font-bold w-10 shrink-0">
                  PATH
                </span>
                <span className="text-[#475569] text-[9px]">
                  {tx.bubblePath.join(" › ")}
                </span>
              </Row>
            </Section>
          )}

          {/* ── Raw Snapshot ── */}
          {tx.meta && <RawDataToggle data={tx.meta} />}
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Section (top-level panels) ───

function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#e0e0e0]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1 px-2 py-1 bg-[#f8f8f8] hover:bg-[#f0f0f0] cursor-pointer border-none text-left"
      >
        <ChevronRight
          size={10}
          className={`text-[#b0b0b0] transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="text-[#b0b0b0]">{icon}</span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-[#666]">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[8px] text-[#999] font-mono ml-auto">
            ({count})
          </span>
        )}
      </button>
      {open && children}
    </div>
  );
}

// ─── Unified Building Blocks ───

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-wider text-[#999] mb-0.5">
        {title}
      </div>
      <div className="flex flex-col border border-[#eee] rounded overflow-hidden divide-y divide-[#f5f5f5]">
        {children}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] bg-white hover:bg-[#fafafa]">
      {children}
    </div>
  );
}

function RawDataToggle({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2 py-0.5 rounded border border-[#eee] bg-[#fafafa] text-[#999] hover:text-[#555] hover:bg-[#f5f5f5]"
      >
        <div className="flex items-center gap-1">
          <Database size={9} />
          <span className="font-bold text-[8px] uppercase">Snapshot</span>
        </div>
        <ChevronDown
          size={10}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-1 p-1.5 rounded border border-[#ddd] bg-[#1e293b] overflow-x-auto">
          <pre className="text-[9px] font-mono text-[#e2e8f0] leading-snug">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
