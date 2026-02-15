/**
 * KernelPanel — Kernel State + Transaction Log for OS Inspector
 *
 * Accepts a kernel instance prop. If not provided, shows a placeholder.
 */

// import type { createKernel } from "@kernel";
import { useEffect, useRef, useState } from "react";

type AnyKernel = any;

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
      <TransactionSection kernel={kernel} />
      <div className="border-t border-[#e5e5e5]" />
      <StateSection kernel={kernel} />
    </div>
  );
}

// ─── State Section ───

function StateSection({ kernel }: { kernel: AnyKernel }) {
  const state = kernel.useComputed((s: any) => s);

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="text-[10px] font-bold text-[#999] tracking-wide uppercase mb-2">
        KERNEL STATE
      </div>
      <pre className="text-[11px] font-mono leading-relaxed text-[#333] bg-[#f5f5f5] rounded p-2 m-0 whitespace-pre-wrap break-all">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}

// ─── Transaction Section ───

function TransactionSection({ kernel }: { kernel: AnyKernel }) {
  const [, refresh] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // useComputed triggers re-render on state change → transactions also update
  kernel.useComputed((s: any) => s);

  const txs = kernel.inspector.getTransactions();

  // Auto-scroll to bottom on new transactions
  // biome-ignore lint/correctness/useExhaustiveDependencies: txs.length is intentional trigger
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [txs.length]);

  const handleTravel = (tx: { id: number }) => {
    kernel.inspector.travelTo(tx.id);
    setSelectedId(tx.id);
  };

  const handleClear = () => {
    kernel.inspector.clearTransactions();
    setSelectedId(null);
    refresh((n) => n + 1);
  };

  return (
    <div className="shrink-0 max-h-[200px] flex flex-col overflow-hidden p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-bold text-[#999] tracking-wide uppercase">
          TRANSACTIONS ({txs.length})
        </div>
        {txs.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[9px] px-1.5 py-0.5 rounded border border-[#e0e0e0] text-[#999] hover:text-[#666] hover:bg-[#f5f5f5] bg-white"
          >
            Clear
          </button>
        )}
      </div>

      {txs.length === 0 ? (
        <div className="text-[11px] text-[#aaa] italic">
          No transactions yet.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col gap-0.5"
        >
          {txs.map((tx: any) => (
            <button
              key={tx.id}
              type="button"
              onClick={() => handleTravel(tx)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-left text-[11px] font-mono transition-all w-full ${
                selectedId === tx.id
                  ? "bg-[#e8f0fe] border border-[#4285f4] text-[#1a73e8]"
                  : "bg-[#fafafa] border border-transparent hover:bg-[#f0f0f0] text-[#555]"
              }`}
            >
              <span className="text-[9px] text-[#aaa] min-w-[18px]">
                #{tx.id}
              </span>
              <span className="font-semibold text-[#333] flex-1 truncate">
                {tx.command.type}
              </span>
              <span className="text-[9px] text-[#bbb]">
                {tx.handlerScope === "GLOBAL" ? "" : tx.handlerScope}
              </span>
              {tx.changes.length > 0 && (
                <span className="text-[9px] px-1 py-px rounded bg-[#e8f5e9] text-[#2e7d32]">
                  Δ{tx.changes.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
