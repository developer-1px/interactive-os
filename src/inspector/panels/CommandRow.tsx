import { Kbd } from "@os/AntigravityOS";
import { GitGraph, TextCursorInput } from "lucide-react";
import { memo } from "react";

export interface ProcessedCommand {
  id: string;
  label: string;
  kb: string[];
  enabled: boolean;
  allowInInput: boolean;
  log?: boolean;
  when?: string;
  isLogicEnabled: boolean;
  currentPayload?: any;
  jurisdiction?: "GROUP" | "GLOBAL";
}

export const CommandRow = memo(
  ({
    cmd,
    isDisabled,
    isBlockedByInput,
    activeKeybindingMap,
    isLastExecuted,
    currentPayload,
    trigger,
  }: {
    cmd: ProcessedCommand;
    isDisabled: boolean;
    isBlockedByInput: boolean;
    activeKeybindingMap: Map<string, boolean>;
    isLastExecuted: boolean;
    currentPayload?: any;
    trigger: number;
  }) => {
    const animationKey = isLastExecuted ? `active-${trigger}` : "static";
    const isLogicEnabled = cmd.isLogicEnabled;

    return (
      <div
        key={animationKey}
        className={`group flex items-center justify-between px-3 py-1.5 border-b border-[#f0f0f0] transition-colors duration-150 
                ${isLastExecuted ? "animate-flash-command bg-[#007acc]/10" : !isDisabled ? "hover:bg-[#f8f8f8]" : "opacity-30 grayscale-[0.5]"}
            `}
      >
        <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
          {/* Status Dot */}
          <div
            title={isLogicEnabled ? "Logic: ENABLED" : "Logic: DISABLED"}
            className="flex-shrink-0"
          >
            <div
              className={`w-1 h-1 rounded-full transition-colors ${isLastExecuted ? "bg-[#007acc] shadow-[0_0_4px_#007acc]" : isLogicEnabled ? "bg-[#4ec9b0]" : "bg-[#cccccc]"}`}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[9px] font-bold tracking-tight truncate leading-none ${isLastExecuted ? "text-[#007acc]" : "text-[#444444]"}`}
              >
                {cmd.label}
              </span>
              {currentPayload && (
                <span className="text-[6px] font-bold px-1 py-0.5 bg-[#007acc]/5 text-[#007acc] rounded-[2px] border border-[#007acc]/10 leading-none flex-shrink-0">
                  {Object.keys(currentPayload).length}P
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 min-w-0 overflow-hidden">
              <span
                className={`text-[7px] font-mono truncate tracking-tight uppercase flex-shrink-0 ${isLastExecuted ? "text-[#007acc] opacity-70" : isBlockedByInput ? "text-[#cccccc] line-through" : "text-[#999999]"}`}
              >
                {cmd.id}
              </span>
              {currentPayload && (
                <span className="text-[6px] font-mono text-[#cccccc] truncate uppercase tracking-tighter">
                  → {JSON.stringify(currentPayload)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Indicators */}
          <div
            className={`flex items-center gap-1.5 transition-opacity ${isLastExecuted ? "opacity-100" : "opacity-30 group-hover:opacity-100"}`}
          >
            {/* 1. Logic (When) */}
            {cmd.when && (
              <div
                title={`When: ${cmd.when}`}
                className={`${isLogicEnabled ? "text-[#4ec9b0]" : "text-[#f48771]"}`}
              >
                <GitGraph size={8} />
              </div>
            )}

            {/* 2. Input */}
            {cmd.allowInInput && (
              <div title="Input Safe" className="text-[#ce9178]">
                <TextCursorInput size={8} />
              </div>
            )}
          </div>

          {/* Keys */}
          <div className="flex items-center gap-1 min-w-[32px] justify-end ml-2">
            {cmd.kb.map((key: string) => (
              <div
                key={key}
                className={`px-1 py-0.5 rounded-xs border text-[7px] font-mono transition-colors ${
                  isDisabled
                    ? "border-[#f0f0f0] text-[#cccccc]"
                    : activeKeybindingMap.get(key)
                      ? "bg-[#007acc] border-[#007acc] text-white"
                      : isLastExecuted
                        ? "border-[#007acc] text-[#007acc]"
                        : "border-[#e5e5e5] text-[#888888] bg-[#f8f8f8]"
                }`}
              >
                <Kbd shortcut={key} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);
