import { memo } from "react";
import { Kbd } from "../Kbd";

export interface KeyLog {
    key: string;
    code: string;
    timestamp: number;
}

export const KeyMonitor = memo(({ rawKeys }: { rawKeys: KeyLog[] }) => (
    <section className="px-3 py-2 border-b border-white/5 bg-black/10">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-pink-500 rounded-full animate-pulse" /> Raw
                Input
            </h3>
            <span className="text-[7px] font-bold text-slate-700 uppercase tracking-wide">
                Event Buffer
            </span>
        </div>
        <div className="flex gap-1.5 overflow-hidden h-10 items-center">
            {rawKeys.map((log, i) => (
                <Kbd
                    key={log.timestamp + i}
                    className={`flex-col !h-full !min-w-[50px] gap-0.5 transition-all duration-300 ${i === 0 ? "border-pink-500/50 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)]" : "opacity-40 scale-95 border-transparent bg-transparent"}`}
                    variant="default"
                    size="sm"
                >
                    <span
                        className={`text-[10px] font-black leading-none ${i === 0 ? "text-pink-100" : "text-slate-500"}`}
                    >
                        {log.key === " " ? "SPC" : log.key.toUpperCase()}
                    </span>
                    <span className="text-[7px] text-slate-600 font-bold leading-none">
                        {log.code}
                    </span>
                </Kbd>
            ))}
            {rawKeys.length === 0 && (
                <div className="text-[9px] text-slate-700 italic flex-1 flex items-center h-full pl-1">
                    No active input
                </div>
            )}
        </div>
    </section>
));
