import { memo } from "react";

export const DataStateViewer = memo(({ state }: { state: any }) => (
  <div className="h-full flex flex-col bg-[#ffffff]">
    <div className="px-3 h-7 border-b border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between shrink-0">
      <h3 className="text-[8px] font-black text-[#999999] flex items-center gap-2 uppercase tracking-[0.2em]">
        <div className="w-1 h-2.5 bg-[#4ec9b0] opacity-50" />
        Store
      </h3>
    </div>
    <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-[#fafafa]">
      <pre className="text-[9px] text-[#666666] font-mono leading-tight whitespace-pre-wrap break-all selection:bg-[#007acc]/10">
        {JSON.stringify(state, (_, value) => value, 2)}
      </pre>
    </div>
  </div>
));
