import type { Transaction } from "@kernel/core/transaction";
import { MousePointerClick, MousePointer2, Eye, Keyboard, ClipboardCopy } from "lucide-react";
import { inferSignal } from "../../utils/inferSignal";
import { formatTime, formatAiContext, copyToClipboard } from "../../utils/inspectorFormatters";
import { TransactionProperties } from "./TransactionProperties";

export function TransactionItem({
    tx,
    index,
    expanded,
    onToggle,
    dataIndex,
    timeDeltaMs,
    onHighlight,
}: {
    tx: Transaction;
    index: number;
    expanded: boolean;
    onToggle: () => void;
    dataIndex: number;
    timeDeltaMs: number;
    onHighlight: (id: string, active: boolean) => void;
}) {
    const signal = inferSignal(tx);
    const { type, trigger, command } = signal;

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
                                onMouseEnter={() => trigger.elementId && onHighlight(trigger.elementId, true)}
                                onMouseLeave={() => trigger.elementId && onHighlight(trigger.elementId, false)}
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
            {expanded && <TransactionProperties tx={tx} />}
        </div>
    );
}
