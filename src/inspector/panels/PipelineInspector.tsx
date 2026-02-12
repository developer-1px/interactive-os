/**
 * PipelineInspector — 6-Domino Pipeline Visualizer
 *
 * 키를 하나 누르면 파이프라인이 순서대로 넘어지는 걸 눈으로 본다.
 * [Input] → [Dispatch] → [Command] → [State] → [Effect] → [Render]
 *
 * Transaction을 직접 받는다. 중간 타입 없음.
 */

import type { StateDiff, Transaction } from "@os/schema";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/lib/Icon";

// ─── Pipeline Step ───

export type PipelineStep = {
  name: string;
  status: "pass" | "fail" | "skip";
  detail?: string;
  durationHint?: string;
};

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

// ─── Main Component ───

export function PipelineInspector({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const prevLenRef = useRef(0);

  // Auto-scroll on new transaction
  useLayoutEffect(() => {
    if (transactions.length > prevLenRef.current && scrollRef.current) {
      const raf = requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "instant",
        });
      });
      prevLenRef.current = transactions.length;
      return () => cancelAnimationFrame(raf);
    }
    prevLenRef.current = transactions.length;
  }, [transactions.length]);

  const toggle = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafbfc] text-[#333] font-mono text-[10px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-[#e5e7eb] shrink-0">
        <h3 className="font-bold uppercase tracking-wider text-[#6b7280] text-[10px] flex items-center gap-2">
          <Icon name="activity" size={12} className="text-[#6366f1]" />
          Pipeline
        </h3>
        <span className="px-1.5 py-0.5 bg-[#eef2ff] text-[#4f46e5] rounded text-[9px] font-bold tabular-nums">
          {transactions.length}
        </span>
      </div>

      {/* Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1"
      >
        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#d1d5db] gap-3">
            <Icon name="terminal" size={28} className="opacity-30" />
            <span className="text-[11px] font-sans">
              Interact to see the pipeline
            </span>
          </div>
        )}

        {transactions.map((tx) => (
          <PipelineRow
            key={tx.id}
            tx={tx}
            isExpanded={expandedId === tx.id}
            onToggle={toggle}
          />
        ))}

        {/* Bottom spacer for scroll */}
        <div className="min-h-[60vh] shrink-0" />
      </div>
    </div>
  );
}

// ─── Pipeline Row ───

const STATUS_COLOR = {
  pass: {
    dot: "bg-emerald-400",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  fail: {
    dot: "bg-red-400",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  skip: {
    dot: "bg-gray-300",
    text: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
} as const;

function PipelineRow({
  tx,
  isExpanded,
  onToggle,
}: {
  tx: Transaction;
  isExpanded: boolean;
  onToggle: (id: number) => void;
}) {
  const pipeline = useMemo(() => inferPipeline(tx), [tx]);
  const inputMeta = (tx.meta as Record<string, unknown> | undefined)?.[
    "input"
  ] as { type?: string; key?: string; code?: string } | undefined;

  const isMouse = inputMeta?.type === "MOUSE";
  const isKeyboard = inputMeta?.type !== "MOUSE" && inputMeta?.type !== "FOCUS";
  const isFail = pipeline.some((s) => s.status === "fail");
  const lastPassIdx = pipeline.reduce(
    (acc, s, i) => (s.status === "pass" ? i : acc),
    -1,
  );

  const inputLabel = inputMeta?.key ?? tx.command?.type ?? "—";
  const inputIcon = isMouse ? "mouse-pointer" : "keyboard";
  const accentColor = isFail
    ? "border-red-300 bg-red-50/50"
    : "border-[#e5e7eb] bg-white";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-150">
      {/* Header */}
      <button
        type="button"
        onClick={() => onToggle(tx.id)}
        className={`w-full rounded-lg border shadow-xs transition-all cursor-pointer ${accentColor}`}
      >
        {/* Top line: id + input + command + time */}
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <span className="text-[9px] text-[#9ca3af] font-mono w-5 text-right shrink-0 tabular-nums">
            {tx.id}
          </span>

          <div
            className={`shrink-0 ${isMouse ? "text-orange-500" : isKeyboard ? "text-indigo-500" : "text-emerald-500"}`}
          >
            <Icon name={inputIcon as any} size={12} />
          </div>

          <span
            className={`font-bold text-[11px] ${isFail ? "text-red-600" : "text-[#1e293b]"}`}
          >
            {inputLabel}
          </span>

          {tx.command && !isFail && (
            <>
              <span className="text-[#9ca3af] text-[10px]">→</span>
              <span className="font-semibold text-[10px] text-indigo-600 truncate">
                {tx.command.type}
              </span>
            </>
          )}

          <span className="ml-auto text-[8px] text-[#9ca3af] tabular-nums shrink-0">
            {new Date(tx.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>

          <Icon
            name="chevron-down"
            size={10}
            className={`text-[#9ca3af] transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>

        {/* 6-Domino Pipeline Bar */}
        <div className="flex items-center px-2.5 pb-2 gap-0.5">
          {pipeline.map((step, i) => {
            const colors = STATUS_COLOR[step.status];
            const isActive = step.status === "pass";
            const isStopped = step.status === "fail";

            return (
              <div key={step.name} className="flex items-center">
                {/* Step chip */}
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold border transition-all ${colors.bg} ${colors.border} ${colors.text} ${
                    isActive ? "shadow-xs" : ""
                  }`}
                  title={step.detail || step.name}
                >
                  <span className={`w-1 h-1 rounded-full ${colors.dot}`} />
                  {step.name}
                </div>

                {/* Arrow connector (except last) */}
                {i < pipeline.length - 1 && (
                  <span
                    className={`mx-0.5 text-[8px] ${
                      isStopped
                        ? "text-red-300"
                        : i <= lastPassIdx
                          ? "text-emerald-300"
                          : "text-gray-200"
                    }`}
                  >
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="ml-7 pl-3 border-l-2 border-[#e5e7eb] mt-1 mb-2 space-y-2">
          {/* Handler / Bubble Path */}
          {tx.handlerScope && (
            <DetailSection title="Kernel">
              <DetailRow label="handler" value={tx.handlerScope} accent />
              {tx.bubblePath.length > 0 && (
                <DetailRow label="path" value={tx.bubblePath.join(" › ")} />
              )}
            </DetailSection>
          )}

          {/* State Diff */}
          {(tx.changes ?? []).length > 0 && (
            <DetailSection title="State">
              {(tx.changes ?? []).map((d) => (
                <DiffRow key={d.path} diff={d} />
              ))}
            </DetailSection>
          )}

          {/* Effects */}
          {tx.effects && Object.keys(tx.effects ?? {}).length > 0 && (
            <DetailSection title="Effects">
              {Object.entries(tx.effects ?? {}).map(([key]) => (
                <DetailRow key={key} label="fx" value={key} />
              ))}
            </DetailSection>
          )}

          {/* Raw Snapshot  */}
          <SnapshotToggle data={tx} />
        </div>
      )}
    </div>
  );
}

// ─── Building Blocks ───

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[8px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1">
        {title}
      </div>
      <div className="flex flex-col gap-px rounded border border-[#f1f5f9] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] bg-white hover:bg-[#fafafa] transition-colors">
      <span className="text-[#9ca3af] shrink-0">{label}</span>
      <span
        className={`font-mono ${accent ? "text-indigo-600 font-bold" : "text-[#475569]"} truncate`}
      >
        {value}
      </span>
    </div>
  );
}

function DiffRow({ diff }: { diff: StateDiff }) {
  const pathParts = diff.path.split(".");
  const lastPart = pathParts[pathParts.length - 1];

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] bg-white hover:bg-[#fafafa] transition-colors">
      <span className="text-[#6b7280] font-mono truncate" title={diff.path}>
        {lastPart}
      </span>
      <span className="ml-auto flex items-center gap-1 shrink-0 font-mono">
        <span className="text-red-400 line-through opacity-60">
          {formatValue(diff.from)}
        </span>
        <span className="text-[#d1d5db]">→</span>
        <span className="text-emerald-600 font-bold">
          {formatValue(diff.to)}
        </span>
      </span>
    </div>
  );
}

function SnapshotToggle({ data }: { data: Transaction }) {
  const [open, setOpen] = useState(false);

  const snapshot = {
    command: data.command,
    changes: data.changes,
    effects: data.effects,
    handlerScope: data.handlerScope,
    bubblePath: data.bubblePath,
    meta: data.meta,
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2 py-1 rounded border border-[#f1f5f9] bg-white text-[#9ca3af] hover:text-[#6b7280] hover:bg-[#fafafa] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Icon name="database" size={9} />
          <span className="font-bold text-[8px] uppercase tracking-wider">
            Raw
          </span>
        </div>
        <Icon
          name="chevron-down"
          size={10}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <pre className="mt-1 p-2 rounded border border-[#e2e8f0] bg-[#1e293b] text-[8px] font-mono text-[#e2e8f0] leading-relaxed overflow-x-auto">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Helpers ───

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "—";
  if (typeof v === "string") return `"${v}"`;
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.length <= 3) return `[${v.map((i) => `"${i}"`).join(", ")}]`;
    return `[${v.length}]`;
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
