/**
 * UnifiedInspector — Unified Sections (Refined v10)
 *
 * All detail sections (Pipeline, State, Effects, Kernel) use the SAME
 * visual pattern: [Section Label] → [Uniform Row List]
 * No more mixed styles between sections.
 *
 * v11: Accepts Transaction[] directly. No intermediate InspectorEvent type.
 *      Pipeline inferred via pure function inferPipeline().
 * v12: Focuses on Signal/Noise separation using inferSignal.
 */

import type { Transaction } from "@kernel/core/transaction";
import { inferSignal } from "@kernel/inspector/inferSignal";
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Database,
  Eye,
  GitBranch,
  Hash,
  Keyboard,
  Layers,
  MousePointer2,
  MousePointerClick,
  Package,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
    console.error("Failed to copy instructor context: ", err);
  });
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
  const [manualToggles, setManualToggles] = useState<Set<number>>(new Set());
  const [traceOpen, setTraceOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(false);

  // Compute expanded set: auto-expand latest + preserve manual toggles
  const filteredTx = transactions.filter((tx) => {
    if (showOsEvents) return true;
    const signal = inferSignal(tx);
    return signal.type !== "OS";
  });

  const latestTxId =
    filteredTx.length > 0 ? filteredTx[filteredTx.length - 1]?.id : undefined;
  const expandedIds = new Set(manualToggles);
  // Auto-expand latest only if user hasn't manually collapsed it
  if (latestTxId !== undefined && !manualToggles.has(latestTxId)) {
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

  // Auto-scroll: find the 3rd-from-last item in DOM and scroll its top into view
  // biome-ignore lint/correctness/useExhaustiveDependencies: track tx count changes
  useEffect(() => {
    if (filteredTx.length > prevTxCount.current) {
      if (!isUserScrolled) {
        requestAnimationFrame(() => {
          const el = scrollRef.current;
          if (!el) return;
          const targetIdx = Math.max(0, filteredTx.length - 3);
          const targetEl = el.querySelector(
            `[data-tx-index="${targetIdx}"]`,
          ) as HTMLElement | null;
          if (targetEl) {
            el.scrollTop = targetEl.offsetTop - 60;
          } else {
            el.scrollTop = el.scrollHeight;
          }
        });
      }
    }
    prevTxCount.current = filteredTx.length;
  }, [filteredTx.length, isUserScrolled]);

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

  return (
    <div className="flex flex-col w-full h-full bg-white text-[#333] font-sans text-[10px] select-none">
      <div className="h-8 px-3 border-b border-[#e8e8e8] bg-white flex items-center shrink-0 sticky top-0 z-20">
        <Layers size={14} className="text-[#007acc] mr-2" />
        <span className="font-bold text-[#555]">Inspector</span>
        <span className="ml-2 text-[#999] text-[9px]">
          ({filteredTx.length} events)
        </span>
        <label className="ml-3 flex items-center gap-1.5 cursor-pointer text-[#64748b]">
          <input
            type="checkbox"
            checked={showOsEvents}
            onChange={(e) => setShowOsEvents(e.target.checked)}
            className="w-3 h-3 accent-blue-500 rounded-sm"
          />
          <span className="font-medium text-[9px] tracking-wide">
            OS Events
          </span>
        </label>

        {onClear && filteredTx.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setManualToggles(new Set());
            }}
            className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-[#999] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-colors cursor-pointer border border-[#e5e5e5] bg-white"
          >
            Clear
          </button>
        )}
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
              <div className="p-4 text-center text-[#999] italic">
                No events captured yet.
              </div>
            ) : (
              filteredTx.map((tx, i) => (
                <TimelineNode
                  key={tx.id}
                  tx={tx}
                  index={i + 1}
                  expanded={expandedIds.has(tx.id)}
                  onToggle={() => toggle(tx.id)}
                  dataIndex={i}
                />
              ))
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
              <div className="p-2 bg-[#1e293b] overflow-x-auto">
                <pre className="text-[9px] font-mono text-[#e2e8f0] leading-relaxed whitespace-pre-wrap break-all">
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
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e293b] text-white text-[9px] font-semibold shadow-lg hover:bg-[#334155] transition-all cursor-pointer border-none"
          >
            <ChevronDown size={10} />
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
}: {
  tx: Transaction;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  dataIndex: number;
}) {
  const signal = inferSignal(tx);
  const { type, trigger, command, diff, effects } = signal;

  const isNoOp = type === "NO_OP";
  const opacityClass = isNoOp ? "opacity-40 hover:opacity-100" : "";

  const icon =
    trigger.kind === "MOUSE" ? (
      trigger.raw === "Click" ? (
        <MousePointerClick size={12} className="text-blue-500" />
      ) : (
        <MousePointer2 size={12} className="text-blue-500" />
      )
    ) : trigger.kind === "FOCUS" ? (
      <Eye size={12} className="text-emerald-500" />
    ) : (
      <Keyboard size={12} className="text-slate-500" />
    );

  return (
    <div
      data-tx-index={dataIndex}
      className={`flex flex-col border-b border-[#f0f0f0] transition-opacity ${opacityClass} ${expanded ? "bg-white" : "hover:bg-[#fafafa]"}`}
    >
      <div className="flex items-center w-full">
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle();
          }}
          className="flex-1 flex items-center gap-2 px-2 py-2 cursor-pointer bg-transparent border-none text-left"
        >
          {/* Icon */}
          <div className="w-3.5 flex justify-center shrink-0">{icon}</div>

          {/* Number + Trigger */}
          <span className="font-mono text-[9px] text-[#a0aec0] font-bold select-none">
            #{index}
          </span>
          <span className="font-bold text-[11px] truncate text-[#1e293b]">
            {trigger.raw || "Unknown"}
          </span>

          {/* Element ID Badge */}
          {trigger.elementId && (
            <span
              className="px-1 py-px rounded bg-[#fff0f6] text-[#c2255c] text-[9px] font-mono border border-[#ffdeeb] cursor-help max-w-[80px] truncate"
              title={`Element ID: ${trigger.elementId}`}
              onMouseEnter={() => highlightElement(trigger.elementId, true)}
              onMouseLeave={() => highlightElement(trigger.elementId, false)}
            >
              {trigger.elementId}
            </span>
          )}

          {/* Command Badge */}
          {command.type !== "NO_COMMAND" && (
            <span className="px-1 py-px rounded bg-[#eff6ff] text-[#2563eb] text-[9px] font-semibold border border-[#bfdbfe]">
              {command.type}
            </span>
          )}

          <span className="ml-auto text-[9px] text-[#cbd5e1] font-mono tabular-nums shrink-0">
            {formatTime(tx.timestamp).split(".")[0]}
          </span>
        </button>

        {/* Copy for AI Button */}
        {expanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(formatAiContext(tx, signal));
            }}
            title="Copy Context for AI"
            className="shrink-0 mx-2 p-1.5 rounded-md text-[#94a3b8] hover:bg-[#e0e7ff] hover:text-[#4f46e5] transition-colors cursor-pointer border-none bg-transparent flex items-center gap-1 group"
          >
            <ClipboardCopy size={12} />
            <span className="text-[8px] font-bold uppercase hidden group-hover:inline">
              Copy for AI
            </span>
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="flex flex-col gap-2 pl-9 pr-2 pb-3">
          {/* ── State Mutation (Diff) ── */}
          {diff.length > 0 && (
            <Section title="State Mutation">
              {diff.map((d: { path: string; from?: unknown; to?: unknown }) => (
                <Row key={d.path}>
                  <ArrowRightLeft
                    size={9}
                    className="text-[#94a3b8] shrink-0"
                  />
                  <span
                    className="text-[#475569] font-mono truncate"
                    title={d.path}
                  >
                    {d.path}
                  </span>
                  <span className="ml-auto flex items-center gap-1 shrink-0 font-mono">
                    <span className="text-[#ef4444] line-through opacity-60">
                      {JSON.stringify(d.from)}
                    </span>
                    <span className="text-[#cbd5e1]">→</span>
                    <span className="text-[#16a34a] font-bold">
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
                  <Check size={9} className="text-[#16a34a] shrink-0" />
                  <span className="font-mono text-[#334155]">{key}</span>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Kernel Details ── */}
          {tx.handlerScope && (
            <Section title="Kernel Routine">
              <Row>
                <Hash size={9} className="text-[#94a3b8] shrink-0" />
                <span className="text-[#94a3b8] shrink-0">handler</span>
                <span className="font-mono text-[#2563eb] font-bold">
                  {tx.handlerScope}
                </span>
              </Row>
              <Row>
                <GitBranch size={9} className="text-[#94a3b8] shrink-0" />
                <span className="text-[#94a3b8] shrink-0">path</span>
                <span className="text-[#475569]">
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
    <div className="border-b border-[#e8e8e8]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] hover:bg-[#f0f0f0] transition-colors cursor-pointer border-none text-left"
      >
        <ChevronRight
          size={10}
          className={`text-[#94a3b8] transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="text-[#94a3b8]">{icon}</span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-[#555]">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[8px] text-[#999] font-mono ml-1">
            ({count})
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
        {title}
      </div>
      <div className="flex flex-col gap-px rounded border border-[#f1f5f9] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** Row: The ONE pattern for all data rows within a Section. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] bg-white hover:bg-[#fafafa] transition-colors">
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
        className="w-full flex items-center justify-between px-2 py-1 rounded border border-[#f1f5f9] bg-white text-[#94a3b8] hover:text-[#64748b] hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Database size={9} />
          <span className="font-bold text-[8px] uppercase tracking-wider">
            Snapshot
          </span>
        </div>
        <ChevronDown
          size={10}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-1 p-2 rounded border border-[#e2e8f0] bg-[#1e293b] overflow-x-auto">
          <pre className="text-[9px] font-mono text-[#e2e8f0] leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
