import { memo, useMemo } from "react";
import type { MenuItem } from "../../lib/todoMenus";
import { SIDEBAR_MENU, TODOLIST_MENU, GLOBAL_MENU } from "../../lib/todoMenus";
import { UNIFIED_TODO_REGISTRY } from "../../lib/todoCommands";
import { TODO_KEYMAP } from "../../lib/todoKeys";
import { evalContext } from "../../lib/context";
import { CommandRow } from "./CommandRow";
import type { ProcessedCommand } from "./CommandRow";
import { useFocusStore } from "../../stores/useFocusStore";

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
        // Access Zone Registry to find "Parents" (Areas)
        const zoneRegistry = useFocusStore((s) => s.zoneRegistry);

        const registryData = useMemo(() => {
            const zone = ctx.activeZone;
            const zoneMeta = zone ? zoneRegistry[zone] : null;
            const activeArea = zoneMeta?.area;

            // 1. Identify Menu Context
            // TODO: Menu should also be Area-aware? For now, we stick to zone-based unless we refactor menus.
            const activeMenu =
                zone === "sidebar"
                    ? SIDEBAR_MENU
                    : zone === "todoList"
                        ? TODOLIST_MENU
                        : GLOBAL_MENU;

            const menuCommandIds = new Set(activeMenu.map((m: MenuItem) => m.command));

            // 2. Iterate ALL commands & Filter by Scope (Nested)
            const relevantCommands: ProcessedCommand[] = UNIFIED_TODO_REGISTRY.getAll()
                .filter(cmd => {
                    // Scope Filter:
                    // 1. Logic Enabled? (Must be true to be relevant?)
                    // Actually let's allow "Disabled" relevant commands to show as disabled.

                    // 1. Is it in the Active Menu?
                    if (menuCommandIds.has(cmd.id)) return true;

                    // 2. Is it Global?
                    const isGlobal = TODO_KEYMAP.global?.some((b: any) => b.command === cmd.id);
                    if (isGlobal) return true;

                    // 3. Is it bound in the Active Zone?
                    if (zone && TODO_KEYMAP.zones && (TODO_KEYMAP.zones as any)[zone]) {
                        const zoneBindings = (TODO_KEYMAP.zones as any)[zone];
                        if (zoneBindings.some((b: any) => b.command === cmd.id)) return true;
                    }

                    // 4. Is it bound in the Active Area (Parent Zone)?
                    if (activeArea && TODO_KEYMAP.zones && (TODO_KEYMAP.zones as any)[activeArea]) {
                        const areaBindings = (TODO_KEYMAP.zones as any)[activeArea];
                        if (areaBindings.some((b: any) => b.command === cmd.id)) return true;
                    }

                    // 5. Is it currently Logic Enabled? (Catch-all for dynamic context commands)
                    const isExampleEnabled = cmd.when ? evalContext(cmd.when, ctx) : true;
                    if (isExampleEnabled) return true;

                    return false;
                })
                .map(
                    (cmd) => {
                        // --- A. Logic Gate Check ---
                        const isLogicEnabled = cmd.when ? evalContext(cmd.when, ctx) : true;

                        // --- B. Menu Check (Visual) ---
                        const isMenuVisible = menuCommandIds.has(cmd.id);

                        // --- C. Keybinding Check (Physical) ---
                        const keys: string[] = [];
                        let allowInInput = false;

                        // Helper to check bindings
                        const checkBindings = (scope: string) => {
                            if (
                                scope &&
                                TODO_KEYMAP.zones &&
                                (TODO_KEYMAP.zones as any)[scope]
                            ) {
                                const bindings = (TODO_KEYMAP.zones as any)[scope];
                                const match = bindings.find((b: any) => b.command === cmd.id);
                                if (match) {
                                    keys.push(match.key);
                                    allowInInput = !!match.allowInInput;
                                }
                            }
                        };

                        // C-1. Check Zone-Specific
                        if (zone) checkBindings(zone);

                        // C-2. Check Area-Specific (Fallback/Inherit)
                        // Only add if not found in specific zone? Or accumulate? 
                        // Usually specific overrides generic. If keys found, we stop?
                        // Let's accumulate for now or prioritize Zone.
                        if (keys.length === 0 && activeArea) checkBindings(activeArea);

                        // C-3. Check Global (Last Resort)
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
                        const isEnabled = isLogicEnabled;
                        const whenString = typeof cmd.when === 'string' ? cmd.when : undefined;

                        return {
                            id: cmd.id,
                            label: cmd.label || cmd.id,
                            kb: keys,
                            enabled: isEnabled,
                            allowInInput: allowInInput,
                            log: cmd.log,
                            when: whenString,
                            isMenuVisible,
                            isLogicEnabled,
                        };
                    },
                );

            // 3. Sort for Usability
            return relevantCommands.sort((a, b) => {
                const aHasKey = a.kb && a.kb.length > 0;
                const bHasKey = b.kb && b.kb.length > 0;
                if (aHasKey && !bHasKey) return -1;
                if (!aHasKey && bHasKey) return 1;
                if (a.allowInInput && !b.allowInInput) return -1;
                if (!a.allowInInput && b.allowInInput) return 1;
                if (a.enabled && !b.enabled) return -1;
                if (!a.enabled && b.enabled) return 1;
                if (a.isMenuVisible && !b.isMenuVisible) return -1;
                if (!a.isMenuVisible && b.isMenuVisible) return 1;
                return a.id.localeCompare(b.id);
            });
        }, [ctx, zoneRegistry]); // Updated dependency

        // Display Active Zone + Area if available
        const activeZone = ctx.activeZone || "GLOBAL";
        const activeArea = ctx.activeZone && zoneRegistry[ctx.activeZone]?.area;
        const displayScope = activeArea ? `${activeZone} < ${activeArea}` : activeZone;

        return (
            <section className="px-3 py-2 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-3 bg-emerald-500/40 rounded-full" /> Registry
                        HUD
                    </h3>
                    <span className="text-[7px] font-bold text-slate-600 uppercase tracking-tight px-1.5 py-0.5 bg-white/5 rounded border border-white/5 truncate max-w-[120px]">
                        {displayScope}
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
