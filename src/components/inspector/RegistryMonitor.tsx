import { memo, useMemo } from "react";
import type { MenuItem } from "../../lib/todoMenus";
import { SIDEBAR_MENU, TODOLIST_MENU, GLOBAL_MENU } from "../../lib/todoMenus";
import { UNIFIED_TODO_REGISTRY } from "../../lib/todoCommands";
import { TODO_KEYMAP } from "../../lib/todoKeys";
import { evalContext } from "../../lib/context";
import { CommandRow } from "./CommandRow";
import type { ProcessedCommand } from "./CommandRow";

export const RegistryMonitor = memo(
    ({
        ctx,
        activeKeybindingMap,
        isInputActive,
        lastCommandId,
        historyCount,
    }: {
        ctx: any;
        activeKeybindingMap: Map<string, boolean>;
        isInputActive: boolean;
        lastCommandId: string | null;
        historyCount: number;
    }) => {
        const registryData = useMemo(() => {
            const zone = ctx.activeZone;

            // 1. Identify Menu Context
            const activeMenu =
                zone === "sidebar"
                    ? SIDEBAR_MENU
                    : zone === "todoList"
                        ? TODOLIST_MENU
                        : GLOBAL_MENU;

            const menuCommandIds = new Set(activeMenu.map((m: MenuItem) => m.command));

            // 2. Iterate ALL commands (Registry-Centric)
            const allCommands: ProcessedCommand[] = UNIFIED_TODO_REGISTRY.getAll().map(
                (cmd) => {
                    // --- A. Logic Gate Check ---
                    // Does the command logic allow execution?
                    const isLogicEnabled = cmd.when ? evalContext(cmd.when, ctx) : true;

                    // --- B. Menu Check (Visual) ---
                    const isMenuVisible = menuCommandIds.has(cmd.id);

                    // --- C. Keybinding Check (Physical) ---
                    // Lookup Keybinding & Gating Context
                    const keys: string[] = [];
                    let allowInInput = false;

                    // C-1. Check Zone-Specific
                    if (
                        ctx.activeZone &&
                        TODO_KEYMAP.zones &&
                        (TODO_KEYMAP.zones as any)[ctx.activeZone]
                    ) {
                        const zoneBindings = (TODO_KEYMAP.zones as any)[ctx.activeZone];
                        const match = zoneBindings.find((b: any) => b.command === cmd.id);
                        if (match) {
                            keys.push(match.key);
                            allowInInput = !!match.allowInInput;
                        }
                    }

                    // C-2. Check Global (Fallback)
                    if (keys.length === 0 && TODO_KEYMAP.global) {
                        const globalMatch = TODO_KEYMAP.global.find(
                            (b: any) => b.command === cmd.id,
                        );
                        if (globalMatch) {
                            keys.push(globalMatch.key);
                            allowInInput = !!globalMatch.allowInInput;
                        }
                    }

                    // --- D. Final Availability ---
                    // To be "Enabled" in the UI, logic must be true.
                    // Input blocking is calculated at render time.
                    const isEnabled = isLogicEnabled;

                    // Ensure 'when' is always a string or undefined for UI display
                    // The command definition might have it as LogicNode, but ProcessedCommand expects string | undefined
                    const whenString = typeof cmd.when === 'string' ? cmd.when : undefined;

                    return {
                        id: cmd.id,
                        label: cmd.label || cmd.id,
                        kb: keys,
                        enabled: isEnabled,
                        allowInInput: allowInInput,
                        log: cmd.log,
                        when: whenString,
                        // Triad Status
                        isMenuVisible,
                        isLogicEnabled,
                    };
                },
            );

            // 3. Sort for Usability
            // Priority: Enabled > Menu Visible > Key Bound > Disabled
            return allCommands.sort((a, b) => {
                if (a.enabled && !b.enabled) return -1;
                if (!a.enabled && b.enabled) return 1;
                if (a.isMenuVisible && !b.isMenuVisible) return -1;
                if (!a.isMenuVisible && b.isMenuVisible) return 1;
                return a.id.localeCompare(b.id);
            });
        }, [ctx]); // Intentionally using the stable 'ctx' passed from parent

        return (
            <section className="px-3 py-2 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-3 bg-emerald-500/40 rounded-full" /> Full
                        Registry HUD
                    </h3>
                    <span className="text-[7px] font-bold text-slate-600 uppercase tracking-tight px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                        {ctx.activeZone || "GLOBAL"}
                    </span>
                </div>
                <div className="flex flex-col gap-px">
                    {registryData.map((cmd) => {
                        const isBlockedByInput = isInputActive && !cmd.allowInInput;
                        const isDisabled = !cmd.enabled || isBlockedByInput;

                        return (
                            <CommandRow
                                key={cmd.id}
                                cmd={cmd}
                                isDisabled={isDisabled}
                                isBlockedByInput={isBlockedByInput}
                                activeKeybindingMap={activeKeybindingMap}
                                isLastExecuted={cmd.id === lastCommandId}
                                trigger={historyCount}
                            />
                        );
                    })}
                </div>
            </section>
        );
    },
);
