import { memo } from "react";
import type { LoggedKey } from "@os/debug/inputTelemetry";

export type KeyLog = LoggedKey;

export const KeyMonitor = memo(({ rawKeys }: { rawKeys: KeyLog[] }) => (
    <section className="border-b border-[#e5e5e5]">
        <div className="flex items-center justify-between px-3 py-2 bg-[#f8f8f8]">
            <h3 className="text-[8px] font-black text-[#999999] flex items-center gap-2 uppercase tracking-[0.2em]">
                <div className="w-1 h-2.5 bg-[#f48771] opacity-50" />
                Input
            </h3>
            <span className="text-[7px] font-mono text-[#cccccc] tracking-[0.3em] uppercase">
                Telem
            </span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto p-3 min-h-[44px] bg-[#ffffff] custom-scrollbar">
            {rawKeys.map((log, i) => (
                <div
                    key={log.timestamp + i}
                    className={`flex flex-col items-center justify-center min-w-[32px] h-8 border transition-all duration-200 ${i === 0
                            ? "border-[#f48771]/30 bg-[#f48771]/5 shadow-[inset_0_0_8px_rgba(244,135,113,0.05)]"
                            : "border-[#f0f0f0] opacity-30 grayscale"
                        }`}
                >
                    <span
                        className={`text-[9px] font-black leading-none ${i === 0 ? "text-[#f48771]" : "text-[#999999]"}`}
                    >
                        {log.key}
                    </span>
                    <span className="text-[5px] text-[#cccccc] font-mono mt-1 uppercase tracking-tighter">
                        {log.code}
                    </span>
                </div>
            ))}
            {rawKeys.length === 0 && (
                <div className="text-[8px] font-black text-[#eeeeee] tracking-[0.3em] flex-1 flex items-center pl-1 font-mono">
                    IDLE
                </div>
            )}
        </div>
    </section>
));
