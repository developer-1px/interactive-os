import {
  type TelemetryEntry,
  useCommandTelemetryStore,
} from "@os/features/command/store/CommandTelemetryStore";
import { memo, useMemo } from "react";

/**
 * EventStream - Global Command Telemetry Display
 *
 * Shows ALL dispatched commands (App + OS) from the global CommandTelemetryStore.
 * v7.50: Switched from app-specific history to OS-level telemetry for full visibility.
 */
export const EventStream = memo(() => {
  // Subscribe to global telemetry
  const entries = useCommandTelemetryStore((s) => s.entries);

  const recentHistory = useMemo(
    () => [...entries].reverse().slice(0, 10),
    [entries],
  );

  return (
    <section className="bg-[#ffffff]">
      <div className="flex items-center justify-between px-3 py-1 bg-[#f8f8f8] border-b border-[#e5e5e5]">
        <h3 className="text-[8px] font-black text-[#999999] flex items-center gap-2 uppercase tracking-[0.2em]">
          <div className="w-0.5 h-2 bg-[#ce9178] opacity-50" />
          History
        </h3>
        <span className="text-[7px] text-[#aaaaaa] font-mono">
          {entries.length} events
        </span>
      </div>
      <div className="flex flex-col bg-[#ffffff]">
        {recentHistory.map((entry: TelemetryEntry) => {
          const payload = entry.payload || {};
          const payloadKeys = payload ? Object.keys(payload) : [];
          const keyCount = payloadKeys.length;

          return (
            <div
              key={entry.id}
              className="group border-b border-[#f0f0f0] px-3 py-1.5 hover:bg-[#fcfcfc] transition-colors animate-flash-command"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-[#666666] uppercase tracking-widest leading-none">
                    {entry.command}
                  </span>
                  {/* Source badge: app=blue, os=teal */}
                  <span
                    className={`px-1 py-0.5 rounded-[2px] text-[6px] font-bold leading-none ${
                      entry.source === "os"
                        ? "bg-[#e6f7f5] text-[#4ec9b0]"
                        : "bg-[#e6f0ff] text-[#007acc]"
                    }`}
                  >
                    {entry.source.toUpperCase()}
                  </span>
                  {keyCount > 0 && (
                    <span className="px-1 py-0.5 rounded-[2px] bg-[#f0f0f0] text-[6px] font-bold text-[#999] leading-none">
                      {keyCount} P
                    </span>
                  )}
                </div>
                <span className="text-[7px] text-[#cccccc] font-mono leading-none">
                  #{entry.id}
                </span>
              </div>
              <div className="text-[7px] text-[#aaaaaa] font-mono truncate mt-1 uppercase tracking-tighter">
                {JSON.stringify(payload)}
              </div>
            </div>
          );
        })}
        {recentHistory.length === 0 && (
          <div className="p-4 text-[8px] text-[#eeeeee] font-black tracking-[0.4em] text-center font-mono uppercase">
            Idle
          </div>
        )}
      </div>
    </section>
  );
});
