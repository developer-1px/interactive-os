import { memo } from "react";

export const DataStateViewer = memo(({ state }: { state: any }) => (
    <div className="h-full flex flex-col bg-black/20">
        <div className="px-3 py-2 border-b border-white/5 bg-white/[0.01] sticky top-0 z-10 backdrop-blur-md flex items-center justify-between h-[37px]">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-blue-500/40 rounded-full" /> Data State
            </h3>
        </div>
        <div className="flex-1 overflow-auto p-3 custom-scrollbar">
            <pre className="text-[9px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                {JSON.stringify(state, null, 2)}
            </pre>
        </div>
    </div>
));
