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

function copyAllToClipboard(transactions: Transaction[]) {
  const lines = transactions.map((tx) => {
    const signal = inferSignal(tx);
    return formatAiContext(tx, signal);
  });
  const text = lines.join("\n\n---\n\n");
  copyToClipboard(text);
}

/** Truncate large JSON values for LLM readability */
function truncateValue(value: unknown, path: string): string {
  // History snapshots are noise — summarize
  if (/history\.(past|future)\[\d+\]$/.test(path)) {
    return "[history entry]";
  }
  if (/\.snapshot$/.test(path) || /\.snapshot\./.test(path)) {
    return "[snapshot]";
  }
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  const json = JSON.stringify(value);
  if (!json) return "undefined";
  if (json.length > 200) {
    return json.slice(0, 120) + "…[truncated, " + json.length + " chars]";
  }
  return json;
}

function formatAiContext(
  tx: Transaction,
  signal: ReturnType<typeof inferSignal>,
): string {
  const trigger = `**Action**: ${signal.trigger.kind} (Raw: ${signal.trigger.raw}${signal.trigger.elementId ? `, Element: ${signal.trigger.elementId}` : ""})`;
  const command = `**Command**: \`${signal.command.type}\``;
  const payload = `**Payload**: \`${truncateValue(signal.command.payload, "payload")}\``;

  let diffStr = "**Diff**: None";
  if (signal.diff.length > 0) {
    // Filter out noisy history snapshot diffs entirely
    const meaningful = signal.diff.filter(
      (d) =>
        !/history\.(past|future)\[\d+\]\.(snapshot|timestamp)/.test(d.path),
    );
    if (meaningful.length > 0) {
      diffStr =
        "**Diff**:\n" +
        meaningful
          .map(
            (d) =>
              `  - \`${d.path}\`: \`${truncateValue(d.from, d.path)}\` -> \`${truncateValue(d.to, d.path)}\``,
          )
          .join("\n");
    } else {
      diffStr = "**Diff**: [history only]";
    }
  }

  let effectStr = "";
  if (signal.effects.length > 0) {
    effectStr =
      `\n**Effects**: \n` +
      signal.effects.map((e) => `  - \`${e}\``).join("\n");
  }

  return `**[Inspector Captured Event - ${formatTime(tx.timestamp)}]**\n- ${trigger}\n- ${command}\n- ${payload}\n${diffStr}${effectStr}`;
}

// ─── Array-Index Diff Grouping ───

interface DiffEntry {
  index?: string;
  from?: unknown;
  to?: unknown;
}

interface DiffGroup {
  basePath: string;
  entries: DiffEntry[];
}

const ARRAY_INDEX_RE = /^(.+)\[(\d+)\]$/;

// ─── Consecutive Event Grouping ───

type DisplayEntry =
  | { kind: "single"; tx: Transaction; filteredIndex: number }
  | { kind: "group"; representative: Transaction; count: number; txs: Transaction[]; filteredIndex: number };

/** Group consecutive transactions with the same command type into collapsed entries */
function groupConsecutive(txs: Transaction[]): DisplayEntry[] {
  if (txs.length === 0) return [];
  const entries: DisplayEntry[] = [];
  let i = 0;
  while (i < txs.length) {
    const current = txs[i]!;
    const cmdType = current.command?.type ?? "NO_COMMAND";
    let j = i + 1;
    while (j < txs.length && (txs[j]!.command?.type ?? "NO_COMMAND") === cmdType) {
      j++;
    }
    const runLength = j - i;
    if (runLength >= 2) {
      entries.push({
        kind: "group",
        representative: txs[j - 1]!, // last one (most recent state)
        count: runLength,
        txs: txs.slice(i, j),
        filteredIndex: i,
      });
    } else {
      entries.push({ kind: "single", tx: current, filteredIndex: i });
    }
    i = j;
  }
  return entries;
}

/** Groups diffs that share the same base path (e.g. todoOrder[4], todoOrder[5]) */
function groupDiffs(
  diffs: Array<{ path: string; from?: unknown; to?: unknown }>,
): DiffGroup[] {
  const groups: DiffGroup[] = [];
  const groupMap = new Map<string, DiffGroup>();

  for (const d of diffs) {
    const m = ARRAY_INDEX_RE.exec(d.path);
    if (m) {
      const basePath = m[1]!;
      const index = m[2]!;
      let group = groupMap.get(basePath);
      if (!group) {
        group = { basePath, entries: [] };
        groupMap.set(basePath, group);
        groups.push(group);
      }
      group.entries.push({ index, from: d.from, to: d.to });
    } else {
      groups.push({
        basePath: d.path,
        entries: [{ from: d.from, to: d.to }],
      });
    }
  }

  return groups;
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

  // Group consecutive identical commands into collapsed entries
  const displayEntries = useMemo(
    () => groupConsecutive(filteredTx),
    [filteredTx],
  );

  const lastEntry = displayEntries.length > 0 ? displayEntries[displayEntries.length - 1] : undefined;
  const latestTxId = lastEntry
    ? lastEntry.kind === "single" ? lastEntry.tx.id : lastEntry.representative.id
    : undefined;
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
  const isProgrammaticScroll = useRef(false);

  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    const lastNode = el.querySelector(`[data-tx-index]:last-of-type`);
    if (lastNode) {
      lastNode.scrollIntoView({ block: "start", behavior: "auto" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    setIsUserScrolled(false);
    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false;
    });
  }, []);

  const handleScroll = useCallback(() => {
    // Ignore scroll events caused by our own programmatic scrolling
    if (isProgrammaticScroll.current) return;
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
        isProgrammaticScroll.current = true;
        // Scroll last node to the TOP of the viewport so it's fully visible
        const lastNode = el.querySelector(
          `[data-tx-index="${filteredTx.length - 1}"]`,
        );
        if (lastNode) {
          lastNode.scrollIntoView({ block: "start", behavior: "auto" });
        } else {
          el.scrollTop = el.scrollHeight;
        }
        requestAnimationFrame(() => {
          isProgrammaticScroll.current = false;
        });
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
    <div className="flex flex-col w-full h-full bg-white text-[#333] font-sans text-[10px]">
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
              onClick={() => copyAllToClipboard(transactions)}
              className="p-1 rounded text-[#94a3b8] hover:text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
              title="Copy All to Clipboard"
            >
              <ClipboardCopy size={11} />
            </button>

            {onClear && transactions.length > 0 && (
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
                  className={`px-1.5 py-px rounded text-[8px] font-semibold cursor-pointer border transition-colors whitespace-nowrap ${active
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
            {displayEntries.length === 0 ? (
              <div className="p-4 text-center text-[#999] italic text-[10px]">
                {searchQuery ? "No match." : "No events yet."}
              </div>
            ) : (
              displayEntries.map((entry, i) => {
                if (entry.kind === "group") {
                  const { representative, count, filteredIndex } = entry;
                  const firstTx = entry.txs[0]!;
                  const prevEntry = i > 0 ? displayEntries[i - 1] : undefined;
                  const prevTx = prevEntry
                    ? prevEntry.kind === "single" ? prevEntry.tx : prevEntry.representative
                    : undefined;
                  const timeDeltaMs = prevTx
                    ? representative.timestamp - prevTx.timestamp
                    : 0;
                  const totalDurationMs = representative.timestamp - firstTx.timestamp;
                  return (
                    <CollapsedGroup
                      key={`group-${representative.id}`}
                      representative={representative}
                      count={count}
                      index={filteredIndex + 1}
                      dataIndex={filteredIndex}
                      timeDeltaMs={timeDeltaMs}
                      totalDurationMs={totalDurationMs}
                    />
                  );
                }
                const { tx, filteredIndex } = entry;
                const prevEntry = i > 0 ? displayEntries[i - 1] : undefined;
                const prevTx = prevEntry
                  ? prevEntry.kind === "single" ? prevEntry.tx : prevEntry.representative
                  : undefined;
                const timeDeltaMs = prevTx
                  ? tx.timestamp - prevTx.timestamp
                  : 0;
                return (
                  <TimelineNode
                    key={tx.id}
                    tx={tx}
                    index={filteredIndex + 1}
                    expanded={expandedIds.has(tx.id)}
                    onToggle={() => toggle(tx.id)}
                    dataIndex={filteredIndex}
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

// ─── Collapsed Group (consecutive identical commands) ───

function CollapsedGroup({
  representative,
  count,
  index,
  dataIndex,
  timeDeltaMs,
  totalDurationMs,
}: {
  representative: Transaction;
  count: number;
  index: number;
  dataIndex: number;
  timeDeltaMs: number;
  totalDurationMs: number;
}) {
  const signal = inferSignal(representative);
  const { trigger, command } = signal;

  const icon =
    trigger.kind === "MOUSE" ? (
      trigger.raw === "Click" ? (
        <MousePointerClick
          size={12}
          className="text-[#94a3b8]"
          strokeWidth={2.5}
        />
      ) : (
        <MousePointer2 size={12} className="text-[#94a3b8]" strokeWidth={2.5} />
      )
    ) : trigger.kind === "OS_FOCUS" ? (
      <Eye size={12} className="text-[#94a3b8]" strokeWidth={2.5} />
    ) : (
      <Keyboard size={12} className="text-[#94a3b8]" strokeWidth={2.5} />
    );

  const deltaColorClass =
    timeDeltaMs > 500
      ? "text-[#ef4444]"
      : timeDeltaMs > 100
        ? "text-[#f59e0b]"
        : "text-[#94a3b8]";

  const cmdType = command.type !== "NO_COMMAND" ? command.type : trigger.raw;

  return (
    <div
      data-tx-index={dataIndex}
      className="flex items-center gap-1.5 px-2 py-1 border-b border-[#eee] opacity-40 hover:opacity-70 transition-opacity"
    >
      {/* Icon */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {icon}
      </div>

      {/* # */}
      <span className="font-mono text-[8px] text-[#b0b0b0] shrink-0 w-3 text-right">
        {index}
      </span>

      {/* Command name */}
      <span className="font-semibold text-[10px] text-[#94a3b8] tracking-tight">
        {cmdType}
      </span>

      {/* ×N badge */}
      <span className="px-1.5 py-px rounded-full bg-[#f1f5f9] text-[#64748b] text-[8.5px] font-bold border border-[#e2e8f0] tabular-nums">
        ×{count}
      </span>

      {/* Duration */}
      {totalDurationMs > 0 && (
        <span className="text-[8px] font-mono text-[#b0b0b0]">
          {totalDurationMs}ms
        </span>
      )}

      {/* Delta */}
      <span className={`ml-auto text-[8px] font-mono ${deltaColorClass}`}>
        +{timeDeltaMs}ms
      </span>
    </div>
  );
}

// ─── Single Transaction Entry ───

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
    ) : trigger.kind === "OS_FOCUS" ? (
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
        <div className="flex flex-col gap-1.5 pl-6 pr-2 pb-2">
          {/* ── Pipeline: Sensed & Resolved ── */}
          {signal.pipeline && (
            <div className="flex flex-col gap-1 mt-0.5">
              {!!signal.pipeline.sensed && (
                <div className="flex flex-col font-mono text-[9.5px]">
                  <div className="text-[#475569] font-semibold break-all mt-1 mb-1 inline-flex items-center self-start">
                    DOM SENSE
                  </div>
                  <div className="flex flex-col gap-1 ml-1.5 border-l border-[#e2e8f0] pl-2.5">
                    <div className="flex flex-col gap-[1px] w-full">
                      <DiffValue
                        value={signal.pipeline.sensed}
                        type="changed-from"
                      />
                    </div>
                  </div>
                </div>
              )}
              {!!signal.pipeline.resolved && (
                <div className="flex flex-col font-mono text-[9.5px]">
                  <div className="text-[#475569] font-semibold break-all mt-1 mb-1 inline-flex items-center self-start">
                    PURE RESOLVE
                  </div>
                  <div className="flex flex-col gap-1 ml-1.5 border-l border-[#e2e8f0] pl-2.5">
                    <div className="flex flex-col gap-[1px] w-full">
                      <DiffValue
                        value={signal.pipeline.resolved}
                        type="changed-to"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FINAL ARIA Snapshot ── */}
          {trigger.elementId && (
            <div className="flex flex-col gap-1 mt-0.5">
              <div className="flex flex-col font-mono text-[9.5px]">
                <div className="text-[#8b5cf6] font-semibold break-all mt-1 mb-1 inline-flex items-center self-start">
                  FINAL ARIA
                </div>
                <div className="flex flex-col gap-1 ml-1.5 border-l border-[#ede9fe] pl-2.5">
                  <AriaSnapshot elementId={trigger.elementId} />
                </div>
              </div>
            </div>
          )}

          {/* ── Diff (primary info) ── */}
          {diff.length > 0 && (
            <div className="flex flex-col gap-1 mt-0.5">
              {groupDiffs(diff).map((group, gi) => (
                <div
                  key={`${group.basePath}-${gi}`}
                  className="flex flex-col font-mono text-[9.5px]"
                >
                  {/* Base path label - Spacing & Typography (Context) */}
                  <div className="text-[#475569] font-semibold break-all mt-1.5 mb-1 inline-flex items-center self-start">
                    {group.basePath}
                    {group.entries.length > 1 && (
                      <span className="text-[#94a3b8] font-normal ml-1.5 text-[8.5px]">
                        ×{group.entries.length}
                      </span>
                    )}
                  </div>
                  {/* Entries - Lines (Structural Connection) */}
                  <div className="flex flex-col gap-1 ml-1.5 border-l border-[#e2e8f0] pl-2.5">
                    {group.entries.map((entry, ei) => (
                      <div
                        key={`${entry.index ?? ei}`}
                        className="flex flex-col gap-[1px]"
                      >
                        {entry.index !== undefined && (
                          <span className="text-[8.5px] text-[#94a3b8] font-mono leading-none mb-0.5">
                            [{entry.index}]
                          </span>
                        )}
                        {entry.from !== undefined && entry.to !== undefined ? (
                          <div className="flex flex-col gap-[1px] w-full">
                            <DiffValue value={entry.from} type="changed-from" />
                            <DiffValue value={entry.to} type="changed-to" />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-[1px] w-full">
                            {entry.from !== undefined && (
                              <DiffValue value={entry.from} type="removed" />
                            )}
                            {entry.to !== undefined && (
                              <DiffValue value={entry.to} type="added" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

function AriaSnapshot({ elementId }: { elementId: string }) {
  const [snapshot, setSnapshot] = useState<Record<
    string,
    string | null
  > | null>(null);

  useEffect(() => {
    // Wait for DOM updates to flush after kernel transaction
    const raf = requestAnimationFrame(() => {
      // Small timeout to ensure async renders land
      setTimeout(() => {
        const el =
          document.querySelector(`[data-id="${elementId}"]`) ||
          document.querySelector(`[data-zone-id="${elementId}"]`) ||
          document.getElementById(elementId);

        if (el) {
          setSnapshot({
            role: el.getAttribute("role"),
            "aria-current": el.getAttribute("aria-current"),
            "aria-selected": el.getAttribute("aria-selected"),
            "aria-checked": el.getAttribute("aria-checked"),
            "aria-expanded": el.getAttribute("aria-expanded"),
            tabIndex: el.getAttribute("tabIndex"),
          });
        } else {
          setSnapshot({ error: "Element not found" });
        }
      }, 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [elementId]);

  if (!snapshot)
    return (
      <div className="text-[9px] text-[#94a3b8] italic px-1">Capturing...</div>
    );
  if (snapshot["error"])
    return (
      <div className="text-[9px] text-[#ef4444] italic px-1">
        {snapshot["error"]}
      </div>
    );

  // Filter out nulls for cleaner display
  const filtered = Object.fromEntries(
    Object.entries(snapshot).filter(([_, v]) => v !== null),
  );
  if (Object.keys(filtered).length === 0)
    return (
      <div className="text-[9px] text-[#94a3b8] italic px-1">
        No ARIA attributes
      </div>
    );

  return (
    <div className="flex flex-col gap-[1px] w-full">
      <DiffValue value={filtered} type="changed-to" />
    </div>
  );
}

function DiffValue({
  value,
  type,
}: {
  value: unknown;
  type: "removed" | "added" | "changed-from" | "changed-to";
}) {
  const str =
    typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  const lines = str.split("\n");
  const isLarge = lines.length > 7 || str.length > 150;

  let prefix = "";
  let surfaceClass = "";
  let textClass = "";

  // Surfaces (Backgrounds) specifically for the diff payloads
  switch (type) {
    case "removed":
      prefix = "-";
      surfaceClass = "bg-[#fef2f2]";
      textClass = "text-[#991b1b]";
      break;
    case "added":
      prefix = "+";
      surfaceClass = "bg-[#f0fdf4]";
      textClass = "text-[#166534]";
      break;
    case "changed-from":
      prefix = "";
      surfaceClass = "bg-[#f8fafc]";
      textClass = "text-[#64748b] line-through";
      break;
    case "changed-to":
      prefix = "→";
      surfaceClass = "bg-[#e2e8f0]/50";
      textClass = "text-[#0f172a] font-medium";
      break;
  }

  const prefixNode = (
    <span className="inline-block w-5 shrink-0 text-center font-bold text-black/20 select-none">
      {prefix}
    </span>
  );

  if (!isLarge) {
    return (
      <div
        className={`py-0.5 px-0.5 rounded-sm whitespace-pre-wrap break-all flex ${surfaceClass} ${textClass}`}
      >
        {prefixNode}
        <span>{str}</span>
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
    <details
      className={`py-0.5 px-0.5 rounded-sm flex flex-col group ${surfaceClass} ${textClass}`}
    >
      <summary className="cursor-pointer outline-none flex items-center select-none list-none text-[9.5px]">
        <div className="flex items-center w-full opacity-80 hover:opacity-100">
          {prefixNode}
          <span className="group-open:hidden italic">{summaryText}</span>
          <span className="hidden group-open:inline italic">Collapse</span>
        </div>
      </summary>
      <div className="whitespace-pre-wrap break-all text-[9.5px] mt-1 pl-5 pb-1">
        {str}
      </div>
    </details>
  );
}
