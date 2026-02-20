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
 * v13: Premium dark UI redesign.
 */

import type { Transaction } from "@kernel/core/transaction";
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
      el.style.outline = "2px solid #ec4899";
      el.style.outlineOffset = "2px";
      el.style.boxShadow = "0 0 15px rgba(236, 72, 153, 0.5)";
      el.style.transition = "all 0.2s ease-out";
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
    <div className="flex flex-col w-full h-full bg-[#0B0F19] text-slate-200 font-sans text-[11px] select-none selection:bg-blue-500/30">
      <div className="h-10 px-4 border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl flex items-center shrink-0 sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2.5 shadow-lg shadow-blue-500/20">
          <Layers size={13} className="text-white" />
        </div>
        <span className="font-semibold text-slate-100 tracking-wide text-[12px]">
          Inspector
        </span>
        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono text-[9px] border border-white/5">
          {filteredTx.length}
        </span>

        <label className="ml-4 flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors group">
          <div className="relative flex items-center justify-center w-3.5 h-3.5">
            <input
              type="checkbox"
              checked={showOsEvents}
              onChange={(e) => setShowOsEvents(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-full h-full rounded border border-slate-600 bg-white/5 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
              <Check
                size={10}
                className="text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                strokeWidth={3}
              />
            </div>
          </div>
          <span className="font-medium text-[10px] tracking-wide">
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
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border border-transparent hover:border-red-500/20 bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            Clear
          </button>
        )}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto custom-scrollbar"
        >
          {/* ── Trace Log Section ── */}
          <CollapsibleSection
            title="Trace Log"
            icon={<Layers size={11} />}
            open={traceOpen}
            onToggle={() => setTraceOpen(!traceOpen)}
            count={filteredTx.length}
          >
            {filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic opacity-60">
                <Layers
                  size={32}
                  className="mb-3 text-slate-700"
                  strokeWidth={1.5}
                />
                <span>Waiting for events...</span>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredTx.map((tx, i) => (
                  <TimelineNode
                    key={tx.id}
                    tx={tx}
                    index={i + 1}
                    expanded={expandedIds.has(tx.id)}
                    onToggle={() => toggle(tx.id)}
                    dataIndex={i}
                  />
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* ── Store State Section ── */}
          {storeState && (
            <CollapsibleSection
              title="Store State"
              icon={<Package size={11} />}
              open={storeOpen}
              onToggle={() => setStoreOpen(!storeOpen)}
            >
              <div className="p-3 bg-[#070A10] overflow-x-auto border-t border-white/5 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <pre className="text-[10px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
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
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full flex justify-center">
            <button
              type="button"
              onClick={scrollToBottom}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-semibold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-blue-400/30"
            >
              <ChevronDown size={12} className="animate-bounce" />
              Jump to latest
            </button>
          </div>
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
  const opacityClass = isNoOp ? "opacity-30 hover:opacity-100" : "opacity-100";

  const triggerStyles =
    trigger.kind === "MOUSE"
      ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
      : trigger.kind === "FOCUS"
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : "text-amber-400 bg-amber-500/10 border-amber-500/20";

  const icon =
    trigger.kind === "MOUSE" ? (
      trigger.raw === "Click" ? (
        <MousePointerClick
          size={12}
          className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]"
        />
      ) : (
        <MousePointer2
          size={12}
          className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]"
        />
      )
    ) : trigger.kind === "FOCUS" ? (
      <Eye
        size={12}
        className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
      />
    ) : (
      <Keyboard
        size={12}
        className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"
      />
    );

  return (
    <div
      data-tx-index={dataIndex}
      className={`flex flex-col border-b border-white/5 transition-all duration-300 ${opacityClass} ${expanded ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}
    >
      <div className="flex items-center w-full group">
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle();
          }}
          className="flex-1 flex items-center gap-3 px-3 py-2.5 cursor-pointer bg-transparent border-none text-left focus:outline-none"
        >
          {/* Icon */}
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-lg border shadow-inner transition-colors duration-300 ${triggerStyles} group-hover:bg-opacity-20`}
          >
            {icon}
          </div>

          {/* Number + Trigger */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[12px] truncate text-slate-100 group-hover:text-blue-300 transition-colors">
                {trigger.raw || "Unknown"}
              </span>
              {/* Element ID Badge */}
              {trigger.elementId && (
                <span
                  onClick={(e) => e.stopPropagation()}
                  className="px-1.5 py-0.5 rounded-md bg-pink-500/10 text-pink-300 text-[9px] font-mono border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0)] hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-shadow cursor-help max-w-[100px] truncate"
                  title={`Element ID: ${trigger.elementId}`}
                  onMouseEnter={() => highlightElement(trigger.elementId, true)}
                  onMouseLeave={() =>
                    highlightElement(trigger.elementId, false)
                  }
                >
                  {trigger.elementId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[9px] text-slate-500 tracking-wider">
                #{index}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-[9px] text-slate-500 font-mono tracking-wider tabular-nums">
                {formatTime(tx.timestamp).split(".")[0]}
              </span>
            </div>
          </div>

          <div className="ml-auto flex flex-col items-end gap-1">
            {/* Command Badge */}
            {command.type !== "NO_COMMAND" && (
              <span className="px-2 py-0.5 rounded text-[9px] font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                {command.type}
              </span>
            )}
          </div>
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
            className="shrink-0 mr-3 p-1.5 rounded-lg text-slate-400 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all cursor-pointer flex items-center gap-1.5 group/btn"
          >
            <ClipboardCopy
              size={13}
              className="group-hover/btn:scale-110 transition-transform"
            />
            <span className="text-[9px] font-bold uppercase hidden sm:inline-block">
              Copy for AI
            </span>
          </button>
        )}
      </div>

      {/* Expanded Details */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 pl-12 pr-3 pb-4 pt-1">
            {/* ── State Mutation (Diff) ── */}
            {diff.length > 0 && (
              <Section
                title="State Mutation"
                icon={<ArrowRightLeft size={10} className="text-pink-400" />}
              >
                {diff.map(
                  (d: { path: string; from?: unknown; to?: unknown }) => (
                    <Row key={d.path}>
                      <ArrowRightLeft
                        size={10}
                        className="text-slate-600 shrink-0"
                      />
                      <span
                        className="text-slate-300 font-mono text-[10px] truncate max-w-[40%] bg-white/5 px-1.5 py-0.5 rounded border border-white/5"
                        title={d.path}
                      >
                        {d.path}
                      </span>
                      <span className="ml-auto flex items-center gap-2 shrink-0 font-mono overflow-hidden">
                        <span
                          className="text-red-400/70 line-through truncate max-w-[120px]"
                          title={JSON.stringify(d.from)}
                        >
                          {JSON.stringify(d.from)}
                        </span>
                        <span className="text-slate-600">→</span>
                        <span
                          className="text-emerald-400 font-bold truncate max-w-[120px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
                          title={JSON.stringify(d.to)}
                        >
                          {JSON.stringify(d.to)}
                        </span>
                      </span>
                    </Row>
                  ),
                )}
              </Section>
            )}

            {/* ── Effects ── */}
            {effects.length > 0 && (
              <Section
                title="Effects"
                icon={<Check size={10} className="text-emerald-400" />}
              >
                {effects.map((key, idx) => (
                  <Row key={`${key}-${idx}`}>
                    <Check
                      size={10}
                      className="text-emerald-500 shrink-0"
                      strokeWidth={3}
                    />
                    <span className="font-mono text-slate-300 tracking-wide text-[10px]">
                      {key}
                    </span>
                  </Row>
                ))}
              </Section>
            )}

            {/* ── Kernel Details ── */}
            {tx.handlerScope && (
              <Section
                title="Kernel Routine"
                icon={<Hash size={10} className="text-blue-400" />}
              >
                <Row>
                  <Hash size={10} className="text-slate-500 shrink-0" />
                  <span className="text-slate-500 shrink-0 w-16 uppercase text-[8px] font-bold tracking-wider">
                    handler
                  </span>
                  <span className="font-mono text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    {tx.handlerScope}
                  </span>
                </Row>
                <Row>
                  <GitBranch size={10} className="text-slate-500 shrink-0" />
                  <span className="text-slate-500 shrink-0 w-16 uppercase text-[8px] font-bold tracking-wider">
                    path
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {tx.bubblePath.map((pb, idx) => (
                      <span
                        key={`${pb}-${idx}`}
                        className="flex items-center gap-1"
                      >
                        <span className="text-slate-300 font-medium">{pb}</span>
                        {idx < tx.bubblePath.length - 1 && (
                          <ChevronRight size={10} className="text-slate-600" />
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
        </div>
      </div>
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
    <div className="border-b border-white/5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer border-none text-left backdrop-blur-sm group"
      >
        <ChevronRight
          size={12}
          className={`text-slate-500 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
        />
        <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner group-hover:bg-white/10 group-hover:text-slate-200 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[10px] text-blue-400 font-mono ml-auto bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            {count}
          </span>
        )}
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
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
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
        {icon}
        {title}
      </div>
      <div className="flex flex-col rounded-lg border border-white/10 bg-[#0E1320] overflow-hidden shadow-sm divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

/** Row: The ONE pattern for all data rows within a Section. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-[10px] bg-transparent hover:bg-white/[0.02] transition-colors relative group">
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Database
            size={10}
            className="group-hover:text-blue-400 transition-colors"
          />
          <span className="font-bold text-[9px] uppercase tracking-widest">
            Snapshot
          </span>
        </div>
        <ChevronDown
          size={12}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="p-3 rounded-lg border border-white/5 bg-[#070A10] overflow-x-auto relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <pre className="text-[10px] font-mono text-slate-400 leading-relaxed custom-scrollbar">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
