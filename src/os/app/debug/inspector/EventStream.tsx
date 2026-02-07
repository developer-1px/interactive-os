import { Icon } from "@/lib/Icon";
import { type LogEntry, useInspectorLogStore } from "@os/features/inspector/InspectorLogStore";
import { useEffect, useRef } from "react";

/**
 * EventStream - Unified Inspector Stream
 *
 * Light theme, Claude-style clean layout.
 */
export const EventStream = () => {
  const logs = useInspectorLogStore((s) => s.logs);
  const clear = useInspectorLogStore((s) => s.clear);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs[0]?.id]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-[#333] font-mono text-[10px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#f8f8f8] border-b border-[#e5e5e5]">
        <h3 className="font-bold uppercase tracking-wider text-[#999] text-[9px] flex items-center gap-2">
          <Icon name="activity" size={10} className="text-[#999]" />
          Stream
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#aaa]">{logs.length}</span>
          <button
            onClick={clear}
            className="hover:text-[#333] text-[#bbb] transition-colors"
            title="Clear"
          >
            <Icon name="trash" size={10} />
          </button>
        </div>
      </div>

      {/* Stream */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
        {logs.length === 0 && (
          <div className="text-center text-[#ccc] mt-10 text-[9px]">
            No events yet
          </div>
        )}
        {[...logs].reverse().map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const TYPE_STYLES: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  INPUT: { icon: "text-[#16a085]", color: "text-[#16a085]", bg: "bg-[#f0faf8]", border: "border-[#e0f2ef]" },
  COMMAND: { icon: "text-[#2980b9]", color: "text-[#2980b9]", bg: "bg-[#f0f6fc]", border: "border-[#dce8f5]" },
  STATE: { icon: "text-[#d4820a]", color: "text-[#d4820a]", bg: "bg-[#fef9f0]", border: "border-[#f5eacc]" },
  EFFECT: { icon: "text-[#8e44ad]", color: "text-[#8e44ad]", bg: "bg-[#f9f0fc]", border: "border-[#ecdff5]" },
};

const DEFAULT_STYLE = { icon: "text-[#999]", color: "text-[#666]", bg: "bg-white", border: "border-[#eee]" };

const LogItem = ({ log }: { log: LogEntry }) => {
  const s = TYPE_STYLES[log.type] || DEFAULT_STYLE;

  return (
    <div className={`flex items-start gap-2 px-2 py-1 rounded-md border ${s.bg} ${s.border}`}>
      {/* Icon */}
      <div className={`mt-0.5 ${s.icon}`}>
        <Icon name={log.icon || "activity"} size={11} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold text-[8px] uppercase tracking-wide ${s.color}`}>
            {log.type}
          </span>
          <span className="text-[#333] font-semibold text-[10px] truncate">
            {log.title}
          </span>
          <span className="ml-auto text-[7px] text-[#bbb] tabular-nums shrink-0">
            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>

        {log.details && (
          <div className="text-[9px] text-[#999] truncate mt-0.5">
            {typeof log.details === "object" ? (
              log.type === "INPUT"
                ? `code: ${log.details.code}`
                : JSON.stringify(log.details).slice(0, 80) + (JSON.stringify(log.details).length > 80 ? "…" : "")
            ) : String(log.details)}
          </div>
        )}
      </div>
    </div>
  );
};
