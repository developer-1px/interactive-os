/**
 * KernelPanel — Event / Cmd / Diff log for OS Inspector
 *
 * Optimized for debugging: shows only the essential triple per transaction.
 * Clear button properly resets. Copy sends event log to clipboard.
 */

import { useEffect, useRef, useState } from "react";

type AnyKernel = any;

// ─── Format helpers ───

/** Extract compact event info from transaction meta */
function formatEvent(meta: Record<string, unknown> | undefined): string {
  if (!meta?.["input"]) return "—";
  const input = meta["input"] as Record<string, unknown>;
  if (input["type"] === "KEYBOARD")
    return `⌨ ${input["key"] ?? input["code"] ?? "?"}`;
  if (input["type"] === "MOUSE") return `🖱 ${input["target"] ?? "click"}`;
  return String(input["type"] ?? "?");
}

/** Format changes as compact diff lines */
function formatDiff(
  changes: { path: string; before: unknown; after: unknown }[],
): string {
  if (!changes || changes.length === 0) return "(no change)";
  return changes
    .map((c) => {
      const path = c.path;
      const before = JSON.stringify(c.before);
      const after = JSON.stringify(c.after);
      return `${path}: ${before} → ${after}`;
    })
    .join("\n");
}

/** Format a single transaction as a debug line */
function formatTxLine(tx: any): string {
  const event = formatEvent(tx.meta);
  const cmd = tx.command?.type ?? "?";
  const payload = tx.command?.payload
    ? ` ${JSON.stringify(tx.command.payload)}`
    : "";
  const diff = formatDiff(tx.changes);
  return `[${event}] ${cmd}${payload}\n  ${diff}`;
}

// ─── Main Panel ───

export function KernelPanel({ kernel }: { kernel?: AnyKernel }) {
  if (!kernel) {
    return (
      <div className="flex-1 flex items-center justify-center text-[11px] text-[#aaa] italic">
        No kernel instance connected
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <TransactionLog kernel={kernel} />
    </div>
  );
}

// ─── Transaction Log ───

function TransactionLog({ kernel }: { kernel: AnyKernel }) {
  const [txCount, setTxCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Poll transaction count via rAF — catches commands with no state change.
  // useComputed only triggers on state changes, missing no-op commands.
  useEffect(() => {
    let raf: number;
    const check = () => {
      const count = kernel.inspector.getTransactions().length;
      setTxCount((prev) => (prev !== count ? count : prev));
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [kernel]);

  const txs: any[] = kernel.inspector.getTransactions();

  // Auto-scroll to bottom on new transactions
  // biome-ignore lint/correctness/useExhaustiveDependencies: txs.length is intentional trigger
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [txs.length, txCount]);

  const handleClear = () => {
    kernel.inspector.clearTransactions();
    setTxCount(0);
  };

  const handleCopy = async () => {
    const lines = txs.map((tx: any, i: number) => `#${i} ${formatTxLine(tx)}`);
    const text = lines.join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="text-[10px] font-bold text-[#999] tracking-wide uppercase">
          EVENT LOG ({txs.length})
        </div>
        <div className="flex gap-1">
          {txs.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#e0e0e0] text-[#999] hover:text-[#666] hover:bg-[#f5f5f5] bg-white"
              >
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#e0e0e0] text-[#999] hover:text-[#666] hover:bg-[#f5f5f5] bg-white"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Log entries */}
      {txs.length === 0 ? (
        <div className="text-[11px] text-[#aaa] italic">
          No events yet. Interact with the app to see logs.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-px"
        >
          {txs.map((tx: any, i: number) => (
            <TxEntry key={tx.id} tx={tx} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single Transaction Entry ───

function TxEntry({ tx, index }: { tx: any; index: number }) {
  const event = formatEvent(tx.meta);
  const cmd = tx.command?.type ?? "?";
  const payload = tx.command?.payload;
  const changes: any[] = tx.changes ?? [];
  const hasChanges = changes.length > 0;

  return (
    <div className="px-2 py-1.5 bg-[#fafafa] rounded text-[11px] font-mono border border-transparent hover:border-[#e0e0e0]">
      {/* Event + Command */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-[#bbb] min-w-[16px]">#{index}</span>
        <span className="text-[10px] text-[#888]">{event}</span>
        <span className="font-semibold text-[#333] flex-1 truncate">{cmd}</span>
        {hasChanges && (
          <span className="text-[9px] px-1 py-px rounded bg-[#e8f5e9] text-[#2e7d32]">
            Δ{changes.length}
          </span>
        )}
      </div>

      {/* Payload (if present) */}
      {payload != null && Object.keys(payload).length > 0 && (
        <div className="mt-0.5 pl-[22px] text-[10px] text-[#777]">
          {JSON.stringify(payload)}
        </div>
      )}

      {/* Diff */}
      {hasChanges && (
        <div className="mt-0.5 pl-[22px] flex flex-col gap-px">
          {changes.map((c: any, j: number) => (
            <div key={j} className="text-[10px]">
              <span className="text-[#999]">{c.path}</span>
              <span className="text-[#c62828] ml-1">
                −{JSON.stringify(c.before)}
              </span>
              <span className="text-[#2e7d32] ml-1">
                +{JSON.stringify(c.after)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
