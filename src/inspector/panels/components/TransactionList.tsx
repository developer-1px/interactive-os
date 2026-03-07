import type { Transaction } from "@kernel/core/transaction";
import {
  Eye,
  Keyboard,
  Layers,
  MousePointer2,
  MousePointerClick,
} from "lucide-react";
import { inferSignal } from "../../utils/inferSignal";
import { CollapsibleSection } from "./CollapsibleSection";
import { TransactionItem } from "./TransactionItem";

// ─── Consecutive Event Grouping ───

export type DisplayEntry =
  | { kind: "single"; tx: Transaction; filteredIndex: number }
  | {
      kind: "group";
      txs: Transaction[];
      representative: Transaction;
      count: number;
      filteredIndex: number;
    };

export function groupConsecutive(
  txs: Transaction[],
  originalIndices: number[],
): DisplayEntry[] {
  const result: DisplayEntry[] = [];
  if (txs.length === 0) return result;

  let currentGroup: Transaction[] = [txs[0]!];
  let currentGroupIndices: number[] = [originalIndices[0]!];

  for (let i = 1; i < txs.length; i++) {
    const tx = txs[i]!;
    const prevTx = txs[i - 1]!;
    const sig = inferSignal(tx);
    const prevSig = inferSignal(prevTx);

    const isSameType = sig.type === prevSig.type;
    const isConsecutiveFocus =
      isSameType &&
      sig.trigger.kind === "OS_FOCUS" &&
      sig.trigger.elementId === prevSig.trigger.elementId;
    const isConsecutiveKey =
      isSameType &&
      sig.trigger.kind === "KEYBOARD" &&
      prevSig.trigger.kind === "KEYBOARD" &&
      sig.trigger.raw === prevSig.trigger.raw;
    const isConsecutiveMouse =
      isSameType &&
      sig.trigger.kind === "MOUSE" &&
      prevSig.trigger.kind === "MOUSE" &&
      sig.trigger.raw === prevSig.trigger.raw &&
      sig.trigger.elementId === prevSig.trigger.elementId;
    const isFast = tx.timestamp - prevTx.timestamp < 1000;

    if (
      (isConsecutiveFocus || isConsecutiveKey || isConsecutiveMouse) &&
      isFast
    ) {
      currentGroup.push(tx);
      currentGroupIndices.push(originalIndices[i]!);
    } else {
      if (currentGroup.length > 1) {
        result.push({
          kind: "group",
          txs: currentGroup,
          representative: currentGroup[currentGroup.length - 1]!,
          count: currentGroup.length,
          filteredIndex: currentGroupIndices[currentGroupIndices.length - 1]!,
        });
      } else {
        result.push({
          kind: "single",
          tx: currentGroup[0]!,
          filteredIndex: currentGroupIndices[0]!,
        });
      }
      currentGroup = [tx];
      currentGroupIndices = [originalIndices[i]!];
    }
  }

  if (currentGroup.length > 1) {
    result.push({
      kind: "group",
      txs: currentGroup,
      representative: currentGroup[currentGroup.length - 1]!,
      count: currentGroup.length,
      filteredIndex: currentGroupIndices[currentGroupIndices.length - 1]!,
    });
  } else {
    result.push({
      kind: "single",
      tx: currentGroup[0]!,
      filteredIndex: currentGroupIndices[0]!,
    });
  }

  return result;
}

export function TimelineGroup({
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

  // toggleGroup is a stub — visual grouping toggle is not yet wired
  const toggleGroup = (_id: string | number) => {};

  return (
    <button
      type="button"
      onClick={() => toggleGroup(representative.id)}
      data-tx-index={dataIndex}
      className="w-full text-left flex items-center gap-1.5 px-2 py-1 border-b border-[#eee] opacity-40 hover:opacity-70 transition-opacity"
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
    </button>
  );
}

export function TransactionList({
  filteredTx,
  searchQuery,
  expandedTxs,
  setExpandedTxs,
  traceOpen,
  setTraceOpen,
  scrollRef,
  handleScroll,
  highlightElement,
}: {
  filteredTx: { tx: Transaction; index: number }[];
  searchQuery: string;
  expandedTxs: Set<string>;
  setExpandedTxs: (s: Set<string>) => void;
  traceOpen: boolean;
  setTraceOpen: (v: boolean) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  handleScroll: () => void;
  highlightElement: (id: string, active: boolean) => void;
}) {
  const displayEntries = groupConsecutive(
    filteredTx.map((item) => item.tx),
    filteredTx.map((item) => item.index),
  );

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
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
                  ? prevEntry.kind === "single"
                    ? prevEntry.tx
                    : prevEntry.txs[prevEntry.txs.length - 1]!
                  : undefined;
                const timeDeltaMs = prevTx
                  ? firstTx.timestamp - prevTx.timestamp
                  : 0;
                const totalDurationMs =
                  entry.txs[entry.txs.length - 1]!.timestamp -
                  firstTx.timestamp;

                return (
                  <TimelineGroup
                    key={`group-${representative.id}`}
                    representative={representative}
                    count={count}
                    index={filteredIndex}
                    dataIndex={i}
                    timeDeltaMs={timeDeltaMs}
                    totalDurationMs={totalDurationMs}
                  />
                );
              }

              const { tx, filteredIndex } = entry;
              const prevEntry = i > 0 ? displayEntries[i - 1] : undefined;
              const prevTx = prevEntry
                ? prevEntry.kind === "single"
                  ? prevEntry.tx
                  : prevEntry.txs[prevEntry.txs.length - 1]!
                : undefined;
              const timeDeltaMs = prevTx ? tx.timestamp - prevTx.timestamp : 0;

              return (
                <TransactionItem
                  key={tx.id}
                  tx={tx}
                  index={filteredIndex}
                  expanded={expandedTxs.has(String(tx.id))}
                  onToggle={() => {
                    const newSet = new Set(expandedTxs);
                    if (newSet.has(String(tx.id))) newSet.delete(String(tx.id));
                    else newSet.add(String(tx.id));
                    setExpandedTxs(newSet);
                  }}
                  dataIndex={i}
                  timeDeltaMs={timeDeltaMs}
                  onHighlight={highlightElement}
                />
              );
            })
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
