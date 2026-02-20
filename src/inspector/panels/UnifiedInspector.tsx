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
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Database,
  Download,
  Eye,
  GitBranch,
  Hash,
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
      <div className="flex flex-col border-b border-[#e8e8e8] bg-white z-20 shrink-0 sticky top-0">
        {/* Top Header Row */}
        <div className="h-9 px-3 flex items-center justify-between">
          <div className="flex items-center">
            <Layers size={14} className="text-[#007acc] mr-2" />
            <span className="font-bold text-[#555] text-[11px] mr-2">
              Inspector
            </span>
            <span className="text-[#999] text-[9px] bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">
              {filteredTx.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#64748b] hover:text-[#333] transition-colors py-1 px-2 rounded hover:bg-[#f8f9fa]">
              <input
                type="checkbox"
                checked={showOsEvents}
                onChange={(e) => setShowOsEvents(e.target.checked)}
                className="w-3 h-3 accent-blue-500 rounded-sm"
              />
              <span className="font-semibold text-[9px] tracking-wide">
                OS Events
              </span>
            </label>

            <button
              type="button"
              onClick={() => downloadSession(transactions)}
              className="p-1.5 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              title="Export Session as JSON"
            >
              <Download size={13} />
            </button>

            {onClear && filteredTx.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setManualToggles(new Set());
                  setSearchQuery("");
                }}
                className="px-2 py-1 rounded text-[9px] font-bold tracking-widest text-[#999] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors cursor-pointer border border-[#e5e5e5] bg-white"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Search & Actions Row */}
        <div className="h-8 border-t border-[#f1f5f9] bg-[#fafafa] flex items-center px-2 gap-2">
          <div className="flex-1 relative">
            <Search
              size={10}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            />
            <input
              type="text"
              placeholder="Filter by command, element, path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[10px] bg-white border border-[#e2e8f0] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] rounded px-6 py-1 outline-none text-[#334155] placeholder:text-[#cbd5e1] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#ef4444] font-bold text-[8px]"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={expandAll}
              className="p-1 text-[#94a3b8] hover:text-[#3b82f6] hover:bg-[#eff6ff] rounded transition-colors"
              title="Expand All"
            >
              <ListTree size={12} />
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="p-1 text-[#94a3b8] hover:text-[#334155] hover:bg-[#e2e8f0] rounded transition-colors"
              title="Collapse All"
            >
              <ListMinus size={12} />
            </button>
          </div>
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
            icon={<Layers size={10} />}
            open={traceOpen}
            onToggle={() => setTraceOpen(!traceOpen)}
            count={filteredTx.length}
          >
            {filteredTx.length === 0 ? (
              <div className="p-8 text-center text-[#94a3b8] italic text-[11px]">
                {searchQuery
                  ? "No events match your search."
                  : "No events captured yet."}
              </div>
            ) : (
              filteredTx.map((tx, i) => {
                // Calculate time delta from previous event in the array
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
              icon={<Package size={10} />}
              open={storeOpen}
              onToggle={() => setStoreOpen(!storeOpen)}
            >
              <div className="p-2 bg-[#1e293b] overflow-x-auto shadow-inner">
                <pre className="text-[10px] font-mono text-[#e2e8f0] leading-relaxed whitespace-pre-wrap break-all custom-scrollbar">
                  {JSON.stringify(storeState, null, 2)}
                </pre>
              </div>
            </CollapsibleSection>
          )}

          {/* Bottom spacer — allows latest items to sit near top */}
          {transactions.length > 0 && (
            <div style={{ height: "80%" }} aria-hidden />
          )}
        </div>

        {/* Jump to latest indicator — shows when user scrolled up */}
        {isUserScrolled && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0f172a] text-white text-[10px] font-semibold shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:bg-[#334155] hover:-translate-y-0.5 transition-all cursor-pointer border-none"
          >
            <ChevronDown size={12} />
            Jump to latest
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
      className={`flex flex-col border-b border-[#f1f5f9] transition-opacity ${opacityClass} ${expanded ? "bg-[#f8fafc]" : "hover:bg-[#f8fafc]"}`}
    >
      <div className="flex items-center w-full group">
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle();
          }}
          className="flex-1 flex items-center gap-2.5 px-2 py-2 cursor-pointer bg-transparent border-none text-left"
        >
          {/* Icon */}
          <div className="w-5 h-5 flex items-center justify-center shrink-0 bg-white rounded shadow-sm border border-[#e2e8f0] group-hover:border-[#cbd5e1] transition-colors">
            {icon}
          </div>

          <div className="flex flex-col justify-center">
            {/* Element ID Badge + Trigger */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[11px] truncate text-[#1e293b]">
                {trigger.raw || "Unknown"}
              </span>
              {trigger.elementId && (
                <span
                  className="px-1 py-px rounded bg-[#fff0f6] text-[#c2255c] text-[9px] font-mono border border-[#ffdeeb] cursor-help max-w-[80px] truncate"
                  title={`Element ID: ${trigger.elementId}`}
                  onMouseEnter={() => highlightElement(trigger.elementId, true)}
                  onMouseLeave={() =>
                    highlightElement(trigger.elementId, false)
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  {trigger.elementId}
                </span>
              )}
            </div>

            {/* Number + Delta */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[9px] text-[#94a3b8] font-bold">
                #{index}
              </span>
              <span className="w-0.5 h-0.5 rounded-full bg-[#cbd5e1]" />
              <span
                className={`text-[8px] font-mono tracking-tighter uppercase ${deltaColorClass}`}
              >
                +{timeDeltaMs}ms
              </span>
            </div>
          </div>

          {/* Command Badge */}
          <div className="ml-auto flex flex-col items-end gap-1">
            {command.type !== "NO_COMMAND" && (
              <span className="px-1.5 py-0.5 rounded bg-[#eff6ff] text-[#2563eb] text-[9px] font-semibold border border-[#bfdbfe]">
                {command.type}
              </span>
            )}
          </div>
        </button>

        <span className="text-[9px] text-[#cbd5e1] font-mono tabular-nums shrink-0 p-2 hidden sm:block">
          {formatTime(tx.timestamp).split(".")[0]}
        </span>

        {/* Copy for AI Button */}
        {expanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(formatAiContext(tx, signal));
            }}
            title="Copy Context for AI"
            className="shrink-0 mx-2 p-1.5 rounded-md text-[#94a3b8] hover:bg-[#e0e7ff] hover:text-[#4f46e5] border border-transparent hover:border-[#c7d2fe] transition-all cursor-pointer bg-white shadow-sm flex items-center gap-1 group/btn"
          >
            <ClipboardCopy
              size={12}
              className="group-hover/btn:scale-110 transition-transform"
            />
            <span className="text-[8px] font-bold uppercase hidden group-hover/btn:inline-block">
              Copy for AI
            </span>
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="flex flex-col gap-2 pl-10 pr-3 pb-4">
          {/* ── State Mutation (Diff) ── */}
          {diff.length > 0 && (
            <Section
              title="State Mutation"
              icon={<ArrowRightLeft size={9} className="text-pink-500" />}
            >
              {diff.map((d: { path: string; from?: unknown; to?: unknown }) => (
                <Row key={d.path}>
                  <ArrowRightLeft
                    size={10}
                    className="text-[#94a3b8] shrink-0"
                  />
                  <span
                    className="text-[#475569] font-mono text-[10px] truncate max-w-[40%] bg-white px-1 py-0.5 rounded border border-[#e2e8f0]"
                    title={d.path}
                  >
                    {d.path}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 shrink-0 font-mono overflow-hidden">
                    <span
                      className="text-[#ef4444] line-through opacity-70 truncate max-w-[120px]"
                      title={JSON.stringify(d.from)}
                    >
                      {JSON.stringify(d.from)}
                    </span>
                    <span className="text-[#94a3b8]">→</span>
                    <span
                      className="text-[#10b981] font-bold truncate max-w-[120px] bg-[#ecfdf5] px-1 py-0.5 rounded border border-[#d1fae5]"
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
            <Section
              title="Effects"
              icon={<Check size={9} className="text-emerald-500" />}
            >
              {effects.map((key, idx) => (
                <Row key={`${key}-${idx}`}>
                  <Check
                    size={10}
                    className="text-[#10b981] shrink-0"
                    strokeWidth={3}
                  />
                  <span className="font-mono text-[#334155]">{key}</span>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Kernel Details ── */}
          {tx.handlerScope && (
            <Section
              title="Kernel Routine"
              icon={<Hash size={9} className="text-blue-500" />}
            >
              <Row>
                <Hash size={10} className="text-[#94a3b8] shrink-0" />
                <span className="text-[#94a3b8] shrink-0 w-12 uppercase text-[8px] font-bold tracking-wider">
                  handler
                </span>
                <span className="font-mono text-[#2563eb] font-bold bg-[#eff6ff] px-1 py-0.5 rounded border border-[#bfdbfe]">
                  {tx.handlerScope}
                </span>
              </Row>
              <Row>
                <GitBranch size={10} className="text-[#94a3b8] shrink-0" />
                <span className="text-[#94a3b8] shrink-0 w-12 uppercase text-[8px] font-bold tracking-wider">
                  path
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {tx.bubblePath.map((pb, idx) => (
                    <span
                      key={`${pb}-${idx}`}
                      className="flex items-center gap-1"
                    >
                      <span className="text-[#475569] font-medium">{pb}</span>
                      {idx < tx.bubblePath.length - 1 && (
                        <ChevronRight size={10} className="text-[#cbd5e1]" />
                      )}
                    </span>
                  ))}
                </div>
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
    <div className="border-b border-[#e2e8f0]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-4 py-2.5 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors cursor-pointer border-none text-left"
      >
        <ChevronRight
          size={12}
          className={`text-[#94a3b8] transition-transform ${open ? "rotate-90" : ""}`}
        />
        <div className="w-5 h-5 flex items-center justify-center bg-white border border-[#e2e8f0] rounded text-[#64748b] shadow-sm">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#475569]">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[10px] text-[#3b82f6] font-mono font-bold bg-[#eff6ff] px-2 py-0.5 rounded-full border border-[#bfdbfe] ml-auto">
            {count}
          </span>
        )}
      </button>
      {open && children}
    </div>
  );
}

// ─── Unified Building Blocks ───

/** Section: The ONE pattern for all detail groups. Label + bordered row list. */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#64748b] mb-1.5 ml-1">
        {icon}
        {title}
      </div>
      <div className="flex flex-col border border-[#e2e8f0] bg-white rounded-md shadow-sm overflow-hidden divide-y divide-[#f1f5f9]">
        {children}
      </div>
    </div>
  );
}

/** Row: The ONE pattern for all data rows within a Section. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] bg-white hover:bg-[#fafafa] transition-colors">
      {children}
    </div>
  );
}

function RawDataToggle({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:text-[#334155] hover:bg-[#f1f5f9] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database size={10} />
          <span className="font-bold text-[9px] uppercase tracking-widest">
            Snapshot
          </span>
        </div>
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-md border border-[#cbd5e1] bg-[#1e293b] overflow-x-auto shadow-inner">
          <pre className="text-[10px] font-mono text-[#e2e8f0] leading-relaxed custom-scrollbar">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
