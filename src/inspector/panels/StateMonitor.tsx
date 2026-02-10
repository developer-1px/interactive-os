import { memo } from "react";

export const StateMonitor = memo(
  ({
    focusId,
    activeZone,
    focusPath,
    physicalZone,
    isInputActive,
  }: {
    focusId?: string | number | null;
    activeZone: string;
    focusPath?: string[];
    physicalZone: string;
    isInputActive: boolean;
  }) => (
    <section className="border-b border-[#333]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#f8f8f8]">
        <h3 className="text-[8px] font-black text-[#999999] flex items-center gap-2 uppercase tracking-[0.2em]">
          <div className="w-1 h-2.5 bg-[#c586c0] opacity-50" />
          Context
        </h3>
        {isInputActive && (
          <span className="text-[7px] font-black text-[#f48771] px-1.5 py-0.5 bg-[#f48771]/5 border border-[#f48771]/10 uppercase tracking-widest">
            Lock
          </span>
        )}
      </div>
      <div className="grid grid-cols-[80px_1fr] border-t border-[#e5e5e5] bg-[#ffffff]">
        <div className="px-3 py-1 border-r border-[#e5e5e5] text-[8px] text-[#999999] font-black uppercase tracking-widest text-right bg-[#fcfcfc]">
          Focus
        </div>
        <div className="px-3 py-1 text-[9px] font-mono text-[#4ec9b0] truncate">
          {JSON.stringify(focusId)}
        </div>

        <div className="px-3 py-1 border-r border-[#e5e5e5] text-[8px] text-[#999999] font-black uppercase tracking-widest text-right bg-[#fcfcfc] border-t border-[#e5e5e5]">
          Zone
        </div>
        <div className="px-3 py-1 text-[9px] font-mono text-[#007acc] border-t border-[#e5e5e5] flex gap-1 items-center overflow-hidden">
          {focusPath ? (
            <div className="flex items-center gap-1 truncate">
              {focusPath.map((z, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <span className="text-[#cccccc] font-sans">/</span>}
                  {z}
                </span>
              ))}
            </div>
          ) : (
            <span className="truncate">{activeZone || "NULL"}</span>
          )}
        </div>

        <div className="px-3 py-1 border-r border-[#e5e5e5] text-[8px] text-[#999999] font-black uppercase tracking-widest text-right bg-[#fcfcfc] border-t border-[#e5e5e5]">
          Source
        </div>
        <div className="px-3 py-1 text-[9px] font-mono truncate border-t border-[#e5e5e5]">
          <span
            className={
              physicalZone === "NONE"
                ? "text-[#cccccc] italic"
                : "text-[#ce9178]"
            }
          >
            {physicalZone === "NONE" ? "VIRTUAL" : physicalZone.toUpperCase()}
          </span>
        </div>
      </div>
    </section>
  ),
);
