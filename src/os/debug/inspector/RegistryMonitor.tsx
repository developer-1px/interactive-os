import { memo, useMemo } from "react";
import { evalContext } from "@os/core/context";
import { CommandRow } from "@os/debug/inspector/CommandRow";
import type { ProcessedCommand } from "@os/debug/inspector/CommandRow";
import type { CommandRegistry } from "@os/core/command/store";
import type { KeybindingItem } from "@os/core/input/keybinding";

// Zero-Base Jurisdiction Detection
// Pure Logic: If ANY binding relies on a Zone Scope -> It is a Zone Command.
const getJurisdiction = (bindings: KeybindingItem[]) => {
    const hasZoneScope = bindings.some(b => {
        const condition = !b.when ? "" : typeof b.when === 'string' ? b.when : b.when.toString();
        // Strict Check: The string must explicitly mention checking activeZone
        return condition.includes("activeZone ==");
    });
    return hasZoneScope ? 'ZONE' : 'GLOBAL';
};

export const RegistryMonitor = memo(
    ({
        ctx,
        registry,
        activeKeybindingMap,
        isInputActive,
        lastCommandId,
        lastPayload,
        historyCount,
    }: {
        ctx: any;
        registry: CommandRegistry<any, any>;
        activeKeybindingMap: Map<string, boolean>;
        isInputActive: boolean;
        lastCommandId: string | null;
        lastPayload: any;
        historyCount: number;
    }) => {

        const registryData = useMemo(() => {
            if (!registry || !ctx) return { zoneCommands: [], globalCommands: [] };

            // 1. Get Sources
            const bindings = registry.getKeybindings();
            const commands = registry.getAll();

            // 2. Map All Commands (Single Pass)
            const processed: ProcessedCommand[] = commands.map(cmd => {
                const cmdBindings = bindings.filter(b => b.command === cmd.id);
                const isLogicEnabled = cmd.when ? evalContext(cmd.when, ctx) : true;

                // Collect Binding State
                const activeKeys: string[] = [];
                let allowInInput = false;
                let boundArgs: any = null;

                cmdBindings.forEach(b => {
                    const isBindingActive = b.when ? evalContext(b.when, ctx) : true;
                    if (isBindingActive) {
                        activeKeys.push(b.key);
                        if (b.allowInInput) allowInInput = true;
                        if (b.args) boundArgs = b.args;
                    }
                });

                // Detect Jurisdiction
                const jurisdiction = getJurisdiction(cmdBindings);

                return {
                    id: cmd.id,
                    label: cmd.label || cmd.id,
                    kb: activeKeys,
                    enabled: isLogicEnabled && (cmdBindings.length === 0 || activeKeys.length > 0),
                    allowInInput,
                    log: cmd.log,
                    when: typeof cmd.when === 'string' ? cmd.when : cmd.when?.toString(),
                    isLogicEnabled,
                    currentPayload: boundArgs,
                    jurisdiction
                };
            });

            // 3. Sort & Split
            const sorter = (a: ProcessedCommand, b: ProcessedCommand) => {
                const aHash = a.kb.length > 0;
                const bHash = b.kb.length > 0;
                if (aHash && !bHash) return -1;
                if (!aHash && bHash) return 1;
                return a.id.localeCompare(b.id);
            };

            return {
                zoneCommands: processed.filter(c => c.jurisdiction === 'ZONE').sort(sorter),
                globalCommands: processed.filter(c => c.jurisdiction !== 'ZONE').sort(sorter)
            };
        }, [ctx, registry]);

        // Display Helpers
        const activeZone = ctx?.activeZone || "GLOBAL";

        const renderCommandList = (commands: ProcessedCommand[]) => (
            commands.map((cmd) => {
                const isBlockedByInput = isInputActive && !cmd.allowInInput;
                const isDisabled = !cmd.enabled || isBlockedByInput;
                const isSelected = cmd.id === lastCommandId;

                return (
                    <CommandRow
                        key={cmd.id}
                        cmd={cmd}
                        isDisabled={isDisabled}
                        isBlockedByInput={isBlockedByInput}
                        activeKeybindingMap={activeKeybindingMap}
                        isLastExecuted={isSelected}
                        currentPayload={isSelected ? lastPayload : cmd.currentPayload}
                        trigger={historyCount}
                    />
                );
            })
        );

        return (
            <section className="border-b border-[#333]">
                {/* Zone Section Header */}
                <div className="flex items-center justify-between px-3 py-1 bg-[#f8f8f8] border-b border-[#f0f0f0]">
                    <h3 className="text-[8px] font-black text-[#666666] flex items-center gap-2 uppercase tracking-[0.2em]">
                        <div className="w-0.5 h-2 bg-[#4ec9b0] opacity-80" />
                        Zone
                    </h3>
                    <span className="text-[7px] font-mono text-[#007acc] truncate max-w-[150px] uppercase font-bold">
                        {activeZone}
                    </span>
                </div>
                <div className="flex flex-col bg-[#ffffff] min-h-[30px]">
                    {registryData.zoneCommands.length === 0 && (
                        <div className="p-2 text-[8px] text-[#cccccc] italic text-center leading-none">
                            No context commands.
                        </div>
                    )}
                    {renderCommandList(registryData.zoneCommands)}
                </div>

                {/* OS Section Header */}
                <div className="flex items-center justify-between px-3 py-1 bg-[#fcfcfc] border-y border-[#f0f0f0]">
                    <h3 className="text-[8px] font-black text-[#999999] flex items-center gap-2 uppercase tracking-[0.2em]">
                        <div className="w-0.5 h-2 bg-[#999999] opacity-30" />
                        Global
                    </h3>
                </div>
                <div className="flex flex-col bg-[#ffffff]">
                    {renderCommandList(registryData.globalCommands)}
                </div>
            </section>
        );
    }
);
