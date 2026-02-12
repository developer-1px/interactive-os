/**
 * UnifiedInspector — Unified Sections (Refined v10)
 *
 * All detail sections (Pipeline, State, Effects, Kernel) use the SAME
 * visual pattern: [Section Label] → [Uniform Row List]
 * No more mixed styles between sections.
 *
 * v11: Accepts Transaction[] directly. No intermediate InspectorEvent type.
 *      Pipeline inferred via pure function inferPipeline().
 */

import type { Transaction } from "@os/schema";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronRight,
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
import { useEffect, useState } from "react";

// ─── Types ───

export type PipelineStep = {
  name: string;
  status: "pass" | "fail" | "skip";
  detail?: string;
};

// ─── Pipeline Inference (pure function) ───

/** Infer 6-domino pipeline from a kernel Transaction. Pure function. */
export function inferPipeline(tx: Transaction): PipelineStep[] {
  const inputMeta = (tx.meta as Record<string, unknown> | undefined)?.[
    "input"
  ] as { type?: string; key?: string; code?: string } | undefined;

  const hasInput = !!inputMeta;
  const hasCommand = !!tx.command?.type;
  const changes = tx.changes ?? [];
  const effects = tx.effects ?? {};
  const hasChanges = changes.length > 0;
  const hasEffects = Object.keys(effects).length > 0;

  return [
    {
      name: "Input",
      status: hasInput ? "pass" : "skip",
      detail: inputMeta?.key ?? inputMeta?.code ?? "",
    },
    {
      name: "Dispatch",
      status: hasInput ? "pass" : "skip",
      detail: tx.handlerScope || "",
    },
    {
      name: "Command",
      status: hasCommand ? "pass" : "fail",
      detail: hasCommand ? tx.command.type : "no handler",
    },
    {
      name: "State",
      status: hasCommand ? (hasChanges ? "pass" : "skip") : "skip",
      detail: hasChanges ? `Δ${changes.length}` : "no change",
    },
    {
      name: "Effect",
      status: hasCommand ? (hasEffects ? "pass" : "skip") : "skip",
      detail: hasEffects ? `${Object.keys(effects).length} fx` : "",
    },
    {
      name: "Render",
      status: hasChanges ? "pass" : "skip",
      detail: hasChanges ? "updated" : "",
    },
  ];
}

// ─── Helpers ───

function getInputMeta(tx: Transaction) {
  return (tx.meta as Record<string, unknown> | undefined)?.["input"] as
    | { type?: string; key?: string; code?: string; elementId?: string }
    | undefined;
}

function getInputType(
  meta: { type?: string } | undefined,
): "KEYBOARD" | "MOUSE" | "FOCUS" {
  if (meta?.type === "MOUSE") return "MOUSE";
  if (meta?.type === "FOCUS") return "FOCUS";
  return "KEYBOARD";
}

function getInputRaw(
  tx: Transaction,
  meta: { key?: string } | undefined,
): string {
  return (
    meta?.key ?? (tx.command?.payload as any)?.key ?? tx.command?.type ?? ""
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
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
}: {
  transactions: Transaction[];
  storeState?: Record<string, unknown>;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [traceOpen, setTraceOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(false);

  // Auto-expand new events (optional, maybe just the latest)
  useEffect(() => {
    if (transactions.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      if (lastTx) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          // next.add(lastTx.id); // Auto-expand latest? Maybe too noisy.
          return next;
        });
      }
    }
  }, [transactions.length, transactions[transactions.length - 1]?.id]);

  const toggle = (id: number) => {
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedIds(next);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white text-[#333] font-sans text-[10px] select-none">
      <div className="h-8 px-3 border-b border-[#e8e8e8] bg-white flex items-center shrink-0 sticky top-0 z-20">
        <Layers size={14} className="text-[#007acc] mr-2" />
        <span className="font-bold text-[#555]">Inspector</span>
        <span className="ml-2 text-[#999] text-[9px]">
          ({transactions.length} events)
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* ── Trace Log Section ── */}
        <CollapsibleSection
          title="Trace Log"
          icon={<Layers size={10} />}
          open={traceOpen}
          onToggle={() => setTraceOpen(!traceOpen)}
          count={transactions.length}
        >
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-[#999] italic">
              No events captured yet.
            </div>
          ) : (
            transactions.map((tx, i) => (
              <TimelineNode
                key={tx.id}
                tx={tx}
                index={i + 1}
                expanded={expandedIds.has(tx.id)}
                onToggle={() => toggle(tx.id)}
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
      </div>
    </div>
  );
}

// ─── Node ───

function TimelineNode({
  tx,
  index,
  expanded,
  onToggle,
}: {
  tx: Transaction;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pipeline = inferPipeline(tx);
  const inputMeta = getInputMeta(tx);
  const inputType = getInputType(inputMeta);
  const inputRaw = getInputRaw(tx, inputMeta);
  const isFail = pipeline.some((s) => s.status === "fail");
  const isNoOp = pipeline[0]?.status === "fail"; // Optional chaining just in case
  const changes = tx.changes ?? [];
  const effects = tx.effects ?? {};
  const effectEntries = Object.entries(effects);
  const icon =
    inputType === "MOUSE" ? (
      inputRaw === "Click" ? (
        <MousePointerClick size={12} className="text-blue-500" />
      ) : (
        <MousePointer2 size={12} className="text-blue-500" />
      )
    ) : inputType === "FOCUS" ? (
      <Eye size={12} className="text-emerald-500" />
    ) : (
      <Keyboard size={12} className="text-slate-500" />
    );

  return (
    <div
      className={`flex flex-col border-b border-[#f0f0f0] ${expanded ? "bg-white" : "hover:bg-[#fafafa]"}`}
    >
      {/* Header Row (Icon + Number + Text — all middle-aligned) */}
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggle();
        }}
        className="flex items-center gap-2 px-2 py-2 cursor-pointer bg-transparent border-none text-left w-full"
      >
        {/* Icon (Fixed width container for alignment) */}
        <div className="w-3.5 flex justify-center shrink-0">{icon}</div>

        {/* #Number + Input */}
        <span className="font-mono text-[9px] text-[#a0aec0] font-bold select-none">
          #{index}
        </span>
        <span
          className={`font-bold text-[11px] truncate ${isFail ? "text-[#dc2626]" : "text-[#1e293b]"}`}
        >
          {inputRaw}
        </span>

        {/* Element ID Badge (with highlight interaction) */}
        {inputMeta?.elementId && (
          <span
            className="px-1 py-px rounded bg-[#fff0f6] text-[#c2255c] text-[9px] font-mono border border-[#ffdeeb] cursor-help max-w-[80px] truncate"
            title={`Element ID: ${inputMeta.elementId}`}
            onMouseEnter={() => highlightElement(inputMeta.elementId!, true)}
            onMouseLeave={() => highlightElement(inputMeta.elementId!, false)}
          >
            {inputMeta.elementId}
          </span>
        )}

        {/* Command Badge */}
        {tx.command && !isFail && (
          <span className="px-1 py-px rounded bg-[#eff6ff] text-[#2563eb] text-[9px] font-semibold border border-[#bfdbfe]">
            {tx.command.type}
          </span>
        )}

        {/* Time */}
        <span className="ml-auto text-[9px] text-[#cbd5e1] font-mono tabular-nums shrink-0">
          {formatTime(tx.timestamp).split(".")[0]}
        </span>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="flex flex-col gap-2 pl-9 pr-2 pb-3">
          {/* ── Pipeline ── */}
          {pipeline.length > 0 && (
            <Section title="Pipeline">
              {pipeline.map((step) => (
                <Row key={step.name}>
                  <span
                    className={`inline-block w-1 h-1 rounded-full shrink-0 ${step.status === "pass" ? "bg-[#22c55e]" : step.status === "fail" ? "bg-[#ef4444]" : "bg-[#d1d5db]"}`}
                  />
                  <span
                    className={`font-mono font-bold w-10 shrink-0 ${step.status === "pass" ? "text-[#475569]" : step.status === "fail" ? "text-[#dc2626]" : "text-[#94a3b8]"}`}
                  >
                    {step.name}
                  </span>
                  {step.detail && (
                    <span
                      className={`truncate ${step.status === "fail" ? "text-[#ef4444] font-bold" : "text-[#64748b]"}`}
                    >
                      {step.detail}
                    </span>
                  )}
                </Row>
              ))}
            </Section>
          )}

          {/* ── State ── */}
          {!isNoOp && changes.length > 0 && (
            <Section title="State">
              {changes.map((d) => (
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
                      {String(d.from)}
                    </span>
                    <span className="text-[#cbd5e1]">→</span>
                    <span className="text-[#16a34a] font-bold">
                      {String(d.to)}
                    </span>
                  </span>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Effects ── */}
          {!isNoOp && effectEntries.length > 0 && (
            <Section title="Effects">
              {effectEntries.map(([key], idx) => (
                <Row key={`${key}-${idx}`}>
                  <Check size={9} className="text-[#16a34a] shrink-0" />
                  <span className="font-mono text-[#334155]">
                    {key}
                    <span className="text-[#94a3b8]">(global)</span>
                  </span>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Kernel ── */}
          {!isNoOp && tx.handlerScope && (
            <Section title="Kernel">
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

          {/* ── Snapshot ── */}
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
