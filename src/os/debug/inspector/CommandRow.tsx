import { memo } from "react";
import {
    Eye,
    EyeOff,
    GitGraph,
    TextCursorInput,
    Zap,
    Ban,
} from "lucide-react";
import { Kbd } from "@os/debug/components/Kbd";

export interface ProcessedCommand {
    id: string;
    label: string;
    kb: string[];
    enabled: boolean;
    allowInInput: boolean;
    log?: boolean;
    when?: string;
    isMenuVisible: boolean;
    isLogicEnabled: boolean;
}

export const CommandRow = memo(
    ({
        cmd,
        isDisabled,
        isBlockedByInput,
        activeKeybindingMap,
        isLastExecuted,
        trigger,
    }: {
        cmd: ProcessedCommand;
        isDisabled: boolean;
        isBlockedByInput: boolean;
        activeKeybindingMap: Map<string, boolean>;
        isLastExecuted: boolean;
        trigger: number;
    }) => {
        // We use the 'trigger' (history count) as a key suffix ONLY when this command is active.
        // This forces React to remount the style-carrying div on every execution,
        // guaranteeing the CSS animation plays from 0% every time.
        const animationKey = isLastExecuted ? `active-${trigger}` : "static";

        // Status Logic
        const isMenuVisible = cmd.isMenuVisible;
        const isLogicEnabled = cmd.isLogicEnabled;

        return (
            <div
                key={animationKey}
                className={`group flex items-center justify-between px-2 py-1 rounded border transition-colors duration-200 
                ${isLastExecuted ? "animate-flash-command bg-indigo-500/80 border-indigo-400" : !isDisabled ? "bg-white/[0.03] border-white/5" : "bg-transparent border-transparent opacity-40 grayscale"}
            `}
            >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {/* Status Dot (The Gate) */}
                    <div
                        title={isLogicEnabled ? "Logic Gate: OPEN" : "Logic Gate: CLOSED"}
                        className="relative flex items-center justify-center w-3 h-3 flex-shrink-0"
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${isLastExecuted ? "bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]" : isLogicEnabled ? "bg-emerald-500" : "bg-slate-700"}`}
                        />
                        {!isLogicEnabled && (
                            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-500">
                                <Ban size={8} />
                            </div>
                        )}
                    </div>

                    <span
                        className={`text-[9px] font-bold font-mono truncate flex-shrink-0 w-[100px] transition-colors ${isLastExecuted ? "text-white" : isBlockedByInput ? "text-slate-500 line-through" : "text-indigo-300"}`}
                    >
                        {cmd.id}
                    </span>
                    <span
                        className={`text-[9px] font-medium truncate tracking-tight transition-all duration-200 ${isLastExecuted ? "text-indigo-100 opacity-100" : "text-slate-500 opacity-0 group-hover:opacity-100"}`}
                    >
                        {cmd.label}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Triad Indicators */}
                    <div
                        className={`flex items-center gap-1 transition-opacity ${isLastExecuted ? "opacity-90 text-indigo-100" : "opacity-60"}`}
                    >
                        {/* 1. Visual Availability (Menu) */}
                        <div
                            title={isMenuVisible ? "Visible in Menu" : "Hidden from Menu"}
                            className={`${isMenuVisible ? (isLastExecuted ? "text-white" : "text-indigo-400") : "text-slate-700"}`}
                        >
                            {isMenuVisible ? <Eye size={9} /> : <EyeOff size={9} />}
                        </div>

                        {/* 2. Logic Gate (When) - Displayed if condition exists */}
                        {cmd.when && (
                            <div
                                title={`Condition: ${cmd.when}`}
                                className={`${isLogicEnabled ? (isLastExecuted ? "text-emerald-200" : "text-emerald-500") : "text-rose-500"} transition-colors`}
                            >
                                <GitGraph size={9} />
                            </div>
                        )}

                        {/* 3. Input Safety */}
                        {cmd.allowInInput && (
                            <div
                                title="Input Safe (Executable in input fields)"
                                className={isLastExecuted ? "text-pink-300" : "text-pink-500"}
                            >
                                <TextCursorInput size={9} />
                            </div>
                        )}
                        {/* 4. Log Visibility */}
                        {cmd.log === false && (
                            <div
                                title="No Log (Hidden from history)"
                                className={
                                    isLastExecuted ? "text-indigo-300" : "text-slate-600"
                                }
                            >
                                <Zap size={9} className="rotate-180" />
                            </div>
                        )}
                    </div>

                    {/* Keys */}
                    <div className="flex items-center gap-1 min-w-[30px] justify-end ml-1">
                        {cmd.kb.map((key: string) => (
                            <Kbd
                                key={key}
                                size="xs"
                                // If active: 'active'. If disabled: 'ghost'. If enabled but idle: 'default'.
                                variant={
                                    isDisabled
                                        ? "ghost"
                                        : activeKeybindingMap.get(key)
                                            ? "active"
                                            : "default"
                                }
                                className={
                                    isDisabled
                                        ? "opacity-30 scale-95" // Disabled: Faded & Small
                                        : activeKeybindingMap.get(key)
                                            ? "" // Active: Handled by variant='active'
                                            : isLastExecuted
                                                ? "text-white border-white/20 bg-indigo-400/50"
                                                : "text-slate-400 bg-white/5 border-white/10" // Idle: Clearer contrast
                                }
                            >
                                {key === " " ? "SPC" : key.toUpperCase()}
                            </Kbd>
                        ))}
                    </div>
                </div>
            </div>
        );
    },
);
