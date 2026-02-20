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
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
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
  const [disabledGroups, setDisabledGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [manualToggles, setManualToggles] = useState<Set<number>>(new Set());
  const [traceOpen, setTraceOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(false);

  // Discover all groups from the actual transactions (kernel is source of truth)
  const allGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const tx of transactions) {
      groups.add(inferSignal(tx).group);
    }
    return Array.from(groups).sort();
  }, [transactions]);

  const toggleGroup = (group: string) => {
    setDisabledGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Compute filtered view based on group toggles and search
  const filteredTx = useMemo(() => {
    let result = transactions;

    if (disabledGroups.size > 0) {
      result = result.filter(
        (tx) => !disabledGroups.has(inferSignal(tx).group),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((tx) => {
        const signal = inferSignal(tx);
        if (signal.command.type.toLowerCase().includes(q)) return true;
        if (signal.trigger.raw.toLowerCase().includes(q)) return true;
        if (signal.trigger.elementId?.toLowerCase().includes(q)) return true;
        if (signal.effects.some((e) => e.toLowerCase().includes(q)))
          return true;
        if (signal.diff.some((d) => d.path.toLowerCase().includes(q)))
          return true;
        return false;
      });
    }

    return result;
  }, [transactions, disabledGroups, searchQuery]);

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
  const prevLatestId = useRef<number | undefined>(undefined);

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

  // Auto-scroll when a NEW transaction arrives (not on filter change)
  useEffect(() => {
    if (latestTxId === undefined || latestTxId === prevLatestId.current) return;
    prevLatestId.current = latestTxId;

    if (isUserScrolled || searchQuery) return;

    // Double rAF: first waits for React commit, second waits for layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        // Find the last rendered node and scroll it into view
        const lastNode = el.querySelector(
          `[data-tx-index="${filteredTx.length - 1}"]`,
        );
        if (lastNode) {
          lastNode.scrollIntoView({ block: "end", behavior: "auto" });
        } else {
          el.scrollTop = el.scrollHeight;
        }
      });
    });
  }, [latestTxId, isUserScrolled, searchQuery, filteredTx.length]);

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
                  setDisabledGroups(new Set());
                }}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold text-[#999] hover:text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer border border-[#e5e5e5]"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Group Filter Pills — dynamically discovered from kernel scopes */}
        {allGroups.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 border-t border-[#f0f0f0] bg-[#fafafa] overflow-x-auto">
            {allGroups.map((group) => {
              const active = !disabledGroups.has(group);
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={`px-1.5 py-px rounded text-[8px] font-semibold cursor-pointer border transition-colors whitespace-nowrap ${
                    active
                      ? "bg-[#1e293b] text-white border-[#1e293b]"
                      : "bg-white text-[#b0b0b0] border-[#e0e0e0] line-through"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        )}

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

  // Hide command badge if it's the exact same string as the trigger
  const showCommandBadge =
    command.type !== "NO_COMMAND" && command.type !== trigger.raw;

  return (
    <div
      data-tx-index={dataIndex}
      className={`flex flex-col border-b border-[#eee] transition-opacity ${opacityClass} ${expanded ? "bg-[#f8fafc]" : "hover:bg-[#fafafa]"}`}
    >
      <div className="flex items-start w-full">
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle();
          }}
          className="flex-1 flex items-start gap-1.5 px-2 py-1.5 cursor-pointer bg-transparent border-none text-left min-w-0"
        >
          {/* Icon */}
          <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-px">
            {icon}
          </div>

          {/* # */}
          <span className="font-mono text-[8px] text-[#94a3b8] shrink-0 mt-0.5 w-3 text-right">
            {index}
          </span>

          {/* Trigger + Element + Command */}
          <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0 pr-1">
            <span className="font-semibold text-[10px] text-[#1e293b] break-all leading-snug tracking-tight">
              {trigger.raw || "Unknown"}
            </span>

            {trigger.elementId && (
              <span
                className="px-1 py-0.5 rounded text-[#c2255c] text-[8.5px] font-mono bg-[#fff0f6] border border-[#ffdeeb] cursor-help break-all leading-none"
                title={`Element: ${trigger.elementId}`}
                onMouseEnter={() => highlightElement(trigger.elementId, true)}
                onMouseLeave={() => highlightElement(trigger.elementId, false)}
                onClick={(e) => e.stopPropagation()}
              >
                {trigger.elementId}
              </span>
            )}

            {showCommandBadge && (
              <span className="px-1 py-0.5 rounded bg-[#eff6ff] text-[#2563eb] text-[8.5px] font-semibold border border-[#bfdbfe] break-all leading-none shadow-sm">
                {command.type}
              </span>
            )}
          </div>

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
        <div className="flex flex-col gap-1.5 pl-8 pr-2 pb-2.5">
          {/* ── Diff (primary info) ── */}
          {diff.length > 0 && (
            <Section title="State Diff">
              <div className="flex flex-col gap-1.5 mt-1">
                {diff.map(
                  (d: { path: string; from?: unknown; to?: unknown }, i) => (
                    <div
                      key={`${d.path}-${i}`}
                      className="flex flex-col gap-0.5 font-mono text-[9.5px]"
                    >
                      <div className="text-[#334155] font-semibold break-all bg-[#f1f5f9] px-1 py-0.5 rounded-sm inline-block self-start">
                        {d.path}
                      </div>
                      {(d.from !== undefined || d.to !== undefined) && (
                        <div className="flex flex-col gap-[1px] ml-1 mt-0.5 border-l-2 border-[#e2e8f0] pl-1.5">
                          {d.from !== undefined && (
                            <DiffValue value={d.from} type="removed" />
                          )}
                          {d.to !== undefined && (
                            <DiffValue value={d.to} type="added" />
                          )}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </Section>
          )}

          {/* ── Effects + Kernel: inline summary ── */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[8px] text-[#94a3b8] font-mono">
            {effects.length > 0 && (
              <span title={effects.join(", ")}>fx: {effects.join(", ")}</span>
            )}
            {tx.handlerScope && tx.handlerScope !== "unknown" && (
              <span>scope: {tx.handlerScope}</span>
            )}
            {tx.bubblePath?.length > 1 && (
              <span>path: {tx.bubblePath.join(" › ")}</span>
            )}
          </div>
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

function DiffValue({
  value,
  type,
}: {
  value: unknown;
  type: "removed" | "added";
}) {
  const str =
    typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  const lines = str.split("\n");
  const isLarge = lines.length > 7 || str.length > 150;

  const prefix = type === "removed" ? "-" : "+";
  const colorClass =
    type === "removed"
      ? "text-[#b91c1c] bg-[#fef2f2] border-[#fecaca]"
      : "text-[#15803d] bg-[#f0fdf4] border-[#bbf7d0]";

  if (!isLarge) {
    return (
      <div
        className={`px-1 py-0.5 rounded-sm whitespace-pre-wrap break-all border ${colorClass}`}
      >
        {prefix} {str}
      </div>
    );
  }

  const summaryText =
    typeof value === "object" && value !== null
      ? Array.isArray(value)
        ? `Array(${value.length})`
        : `Object { ... }`
      : "Long String ...";

  return (
    <details className={`px-1 py-0.5 rounded-sm border ${colorClass} group`}>
      <summary className="cursor-pointer outline-none flex items-center select-none list-none text-[9.5px]">
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100">
          <span className="shrink-0 font-bold">{prefix}</span>
          <span className="group-open:hidden italic">{summaryText}</span>
          <span className="hidden group-open:inline italic">Collapse</span>
        </div>
      </summary>
      <div className="mt-1 whitespace-pre-wrap break-all text-[9.5px] border-t border-black/10 pt-1">
        {str}
      </div>
    </details>
  );
}
