import { memo } from "react";
import type { FocusTarget } from "@apps/todo/model/types";

export const StateMonitor = memo(
    ({
        focusId,
        activeZone,
        physicalZone,
        isInputActive,
    }: {
        focusId: FocusTarget;
        activeZone: string;
        physicalZone: string;
        isInputActive: boolean;
    }) => (
        <section className="px-3 py-2 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-3 bg-indigo-500/40 rounded-full" /> Live
                    Context
                </h3>
                {isInputActive && (
                    <span className="text-[7px] font-bold text-pink-500 px-1.5 py-0.5 bg-pink-500/10 rounded border border-pink-500/20">
                        LOCKED
                    </span>
                )}
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-2">
                <span className="text-[9px] text-slate-500 font-bold text-right pt-[1px]">
                    Focus ID
                </span>
                <div className="min-w-0">
                    <span className="text-[10px] text-indigo-400 font-bold font-mono truncate block">
                        {JSON.stringify(focusId)}
                    </span>
                </div>

                <span className="text-[9px] text-slate-500 font-bold text-right pt-[1px]">
                    Virtual Zone
                </span>
                <div className="min-w-0">
                    <span className="text-[10px] text-emerald-400 font-bold font-mono truncate block">
                        {activeZone || "NULL"}
                    </span>
                </div>

                <span className="text-[9px] text-slate-500 font-bold text-right pt-[1px]">
                    DOM Source
                </span>
                <div className="min-w-0">
                    <span
                        className={`text-[10px] font-bold font-mono truncate block ${physicalZone === "NONE" ? "text-slate-600 italic" : "text-pink-400"}`}
                    >
                        {physicalZone === "NONE"
                            ? `(Virtual: ${activeZone || "NONE"})`
                            : physicalZone}
                    </span>
                </div>
            </div>
        </section>
    ),
);
