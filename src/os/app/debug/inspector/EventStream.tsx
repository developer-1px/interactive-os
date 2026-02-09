import {
  useTransactionLogStore,
  TransactionLog,
} from "@os/inspector/InspectorLogStore";
import type { Transaction, StateDiff, EffectRecord } from "@os/schema";
import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/lib/Icon";

/**
 * EventStream - Transaction-based Inspector Stream
 *
 * Design:
 * - One transaction = one row (input → command → snapshot)
 * - Expandable: click to see diff + effects + full snapshot
 * - Auto-scroll to latest transaction
 * - Copy produces LLM-friendly format
 */
export const EventStream = () => {
  const transactions = useTransactionLogStore((s) => s.transactions);
  const scrollTrigger = useTransactionLogStore((s) => s.scrollTrigger);
  const pageNumber = useTransactionLogStore((s) => s.pageNumber);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Auto-scroll to bottom on new transaction
  useLayoutEffect(() => {
    if (scrollTrigger === 0 || !scrollRef.current) return;
    const raf = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "instant",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [scrollTrigger]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-[#333] font-mono text-[10px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] border-b border-[#e9ecef] shrink-0">
        <h3 className="font-bold uppercase tracking-wider text-[#5f6368] text-[10px] flex items-center gap-2">
          <Icon name="activity" size={12} className="text-[#1a73e8]" />
          Stream
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-[#e8f0fe] text-[#1967d2] rounded text-[9px] font-bold">
            Page {pageNumber}
          </span>
          <button
            type="button"
            onClick={() => {
              const formatted = formatForLLM(transactions);
              navigator.clipboard.writeText(formatted);
            }}
            className="hover:text-[#1a73e8] text-[#9aa0a6] transition-colors p-1 rounded hover:bg-black/5"
            title="Copy for LLM"
          >
            <Icon name="copy" size={12} />
          </button>
          <button
            type="button"
            onClick={() => TransactionLog.clear()}
            className="hover:text-[#d93025] text-[#9aa0a6] transition-colors p-1 rounded hover:bg-black/5"
            title="Clear Stream"
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>

      {/* Stream List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scroll-smooth"
      >
        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#bdc1c6] gap-2">
            <Icon name="terminal" size={24} className="opacity-20" />
            <span className="text-[10px]">Ready to capture events...</span>
          </div>
        )}

        {transactions.map((txn) => (
          <TransactionRow
            key={txn.id}
            txn={txn}
            isExpanded={expandedId === txn.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === txn.id ? null : txn.id))
            }
          />
        ))}
        {/* Bottom padding for scroll */}
        <div className="min-h-[80vh] shrink-0" />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Transaction Row
// ═══════════════════════════════════════════════════════════════════

const TransactionRow = ({
  txn,
  isExpanded,
  onToggle,
}: {
  txn: Transaction;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const isMouse = txn.input.source === "mouse";
  const isKeyboard = txn.input.source === "keyboard";
  const hasDiff = txn.diff.length > 0;
  const hasEffects = txn.snapshot.effects.length > 0;
  const effectsExecuted = txn.snapshot.effects.filter((e) => e.executed).length;
  const effectsSkipped = txn.snapshot.effects.filter((e) => !e.executed).length;

  // Header color
  const headerBg = isMouse
    ? "bg-[#fff0e3] border-[#ffe0c2]"
    : isKeyboard
      ? "bg-[#e8f0fe] border-[#d2e3fc]"
      : "bg-[#f1f3f4] border-[#dadce0]";

  const inputIcon = isMouse ? "cursor" : isKeyboard ? "keyboard" : "cpu";
  const inputColor = isMouse
    ? "text-[#e37400]"
    : isKeyboard
      ? "text-[#1967d2]"
      : "text-[#5f6368]";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Compact Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md border shadow-sm transition-colors cursor-pointer ${headerBg}`}
      >
        {/* Number */}
        <span className="text-[9px] text-[#9aa0a6] font-mono w-4 text-right shrink-0">
          {txn.id}
        </span>

        {/* Input icon */}
        <div className={`shrink-0 ${inputColor}`}>
          <Icon name={inputIcon as any} size={12} />
        </div>

        {/* Input + Command */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className={`font-semibold text-[10px] ${inputColor}`}>
            {txn.input.raw}
          </span>
          {txn.command && (
            <>
              <span className="text-[#9aa0a6]">→</span>
              <span className="font-semibold text-[10px] text-[#1a73e8]">
                {txn.command.type}
              </span>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1 shrink-0">
          {hasDiff && (
            <span className="px-1 py-0.5 bg-[#fef3e0] text-[#e37400] rounded text-[8px] font-bold">
              Δ{txn.diff.length}
            </span>
          )}
          {hasEffects && (
            <span
              className={`px-1 py-0.5 rounded text-[8px] font-bold ${effectsSkipped > 0
                  ? "bg-[#fce8e6] text-[#d93025]"
                  : "bg-[#e6f4ea] text-[#188038]"
                }`}
            >
              fx{effectsExecuted}
              {effectsSkipped > 0 && `/${effectsSkipped}`}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[8px] text-[#9aa0a6] tabular-nums shrink-0">
          {new Date(txn.timestamp).toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>

        {/* Expand indicator */}
        <Icon
          name="chevron-down"
          size={10}
          className={`text-[#9aa0a6] transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="ml-6 pl-3 border-l-[1.5px] border-[#e8eaed] mt-1 mb-2 space-y-2">
          {/* Diff */}
          {hasDiff && (
            <div>
              <div className="text-[8px] font-bold text-[#e37400] uppercase tracking-wider mb-1">
                State Diff
              </div>
              {txn.diff.map((d) => (
                <DiffLine key={d.path} diff={d} />
              ))}
            </div>
          )}

          {/* Effects */}
          {hasEffects && (
            <div>
              <div className="text-[8px] font-bold text-[#a142f4] uppercase tracking-wider mb-1">
                Effects
              </div>
              {txn.snapshot.effects.map((eff, i) => (
                <EffectLine key={i} effect={eff} />
              ))}
            </div>
          )}

          {/* Snapshot (collapsed by default) */}
          <SnapshotView txn={txn} />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

const DiffLine = ({ diff }: { diff: StateDiff }) => {
  const pathParts = diff.path.split(".");
  const lastPart = pathParts[pathParts.length - 1];

  return (
    <div className="flex items-center gap-1.5 py-0.5 text-[9px]">
      <span className="text-[#5f6368] opacity-60">{lastPart}:</span>
      <span className="text-[#d93025] line-through opacity-60">
        {formatValue(diff.from)}
      </span>
      <span className="text-[#9aa0a6]">→</span>
      <span className="text-[#188038] font-semibold">
        {formatValue(diff.to)}
      </span>
    </div>
  );
};

const EffectLine = ({ effect }: { effect: EffectRecord }) => {
  return (
    <div className="flex items-center gap-1.5 py-0.5 text-[9px]">
      <Icon
        name={effect.executed ? "check" : "x"}
        size={10}
        className={effect.executed ? "text-[#188038]" : "text-[#d93025]"}
      />
      <span className="text-[#202124]">{effect.action}</span>
      {effect.targetId && (
        <span className="text-[#5f6368] opacity-60">({effect.targetId})</span>
      )}
      {!effect.executed && effect.reason && (
        <span className="text-[#d93025] text-[8px] italic">
          {effect.reason}
        </span>
      )}
    </div>
  );
};

const SnapshotView = ({ txn }: { txn: Transaction }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[8px] font-bold text-[#5f6368] uppercase tracking-wider hover:text-[#1a73e8] transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Icon
          name="chevron-down"
          size={8}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
        Snapshot
      </button>
      {open && (
        <pre className="mt-1 p-2 bg-[#f8f9fa] rounded text-[8px] text-[#5f6368] overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(txn.snapshot, null, 2)}
        </pre>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return `"${v}"`;
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.length <= 3) return `[${v.map((i) => `"${i}"`).join(", ")}]`;
    return `[${v.length} items]`;
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * Format transactions in LLM-friendly text.
 * Self-contained: each transaction has input, command, diff, effects, snapshot.
 */
function formatForLLM(transactions: Transaction[]): string {
  return transactions
    .map((txn) => {
      const lines: string[] = [];
      const icon = txn.input.source === "mouse" ? "🖱" : txn.input.source === "keyboard" ? "⌨" : "⚙";

      // Header
      lines.push(
        `#${txn.id} ${icon} ${txn.input.raw}${txn.command ? ` → ${txn.command.type}` : ""}`,
      );

      // Diff
      if (txn.diff.length > 0) {
        for (const d of txn.diff) {
          lines.push(`   diff: ${d.path}: ${formatValue(d.from)} → ${formatValue(d.to)}`);
        }
      }

      // Effects
      if (txn.snapshot.effects.length > 0) {
        const fxStr = txn.snapshot.effects
          .map(
            (e) =>
              `${e.action}(${e.targetId ?? ""}) ${e.executed ? "✓" : `✗ ${e.reason}`}`,
          )
          .join(" | ");
        lines.push(`   effects: ${fxStr}`);
      }

      // Compact snapshot
      const snap = txn.snapshot;
      const zone = snap.focus.zone;
      if (zone) {
        lines.push(
          `   snapshot: {zone: "${zone.id}", focused: ${formatValue(zone.focusedItemId)}, selection: ${formatValue(zone.selection)}}`,
        );
      }

      return lines.join("\n");
    })
    .join("\n\n");
}
