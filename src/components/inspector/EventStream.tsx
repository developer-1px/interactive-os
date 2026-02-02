import { memo, useMemo } from "react";
import type { HistoryEntry } from "../../lib/types";

export const EventStream = memo(({ history }: { history: HistoryEntry[] }) => {
    const recentHistory = useMemo(
        () => [...history].reverse().slice(0, 10),
        [history],
    );

    return (
        <section className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-3 bg-pink-500/40 rounded-full" /> Event Stream
                    (Past)
                </h3>
            </div>
            <div className="space-y-1 relative">
                {/* Timeline Line */}
                <div className="absolute left-[3.5px] top-1 bottom-1 w-[1px] bg-white/5" />

                {recentHistory.map((entry, i) => (
                    <div key={i} className="group relative pl-3.5">
                        {/* Timeline Dot */}
                        <div className="absolute left-[1px] top-[5px] w-[5px] h-[5px] rounded-full bg-slate-800 border border-slate-700 group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-colors z-10" />

                        <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight">
                                {entry.command.type}
                            </span>
                            <span className="text-[8px] text-slate-700 font-mono">
                                #{history.length - i}
                            </span>
                        </div>
                        <div className="text-[8px] text-slate-500 pl-1 border-l-2 border-transparent group-hover:border-white/10 transition-all truncate font-mono">
                            {JSON.stringify(
                                "payload" in entry.command ? entry.command.payload : {},
                            )}
                            {/* Removed focusId from display as it was removed from State */}
                            {/* <span className="mx-1 text-slate-700">→</span>
              <span className="text-emerald-500/60">
                {String((entry.resultingState as any).focusId)}
              </span> */}
                        </div>
                    </div>
                ))}
                {recentHistory.length === 0 && (
                    <div className="text-[9px] text-slate-700 italic py-8 text-center border border-dashed border-white/5 rounded-lg bg-white/[0.01]">
                        Waiting for events...
                    </div>
                )}
            </div>
        </section>
    );
});
