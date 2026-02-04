import { memo, useMemo } from "react";
import { evalContext } from "@os/features/AntigravityOS.tsx";
import { CommandRow } from "@os/app/debug/inspector/CommandRow.tsx";
import type { ProcessedCommand } from "@os/app/debug/inspector/CommandRow.tsx";
import type { CommandRegistry } from "@os/features/command/model/createCommandStore.tsx";
import { ZoneRegistry } from "@os/features/jurisdiction/model/ZoneRegistry.ts";

// Zero-Base Jurisdiction Detection
// Pure Logic: If ANY binding relies on a Zone Scope -> It is a Zone Command.
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
            if (!registry || !ctx) return { groupedZones: {}, globalCommands: [] };

            const bindings = registry.getKeybindings();
            const commands = registry.getAll();
            const zoneRegistryMap = ZoneRegistry.getAll();

            // 1. Process Bound Commands
            const processed: ProcessedCommand[] = commands.map(cmd => {
                const cmdBindings = bindings.filter(b => b.command === cmd.id);
                const isLogicEnabled = cmd.when ? evalContext(cmd.when, ctx) : true;

                const activeKeys: string[] = [];
                let allowInInput = false;
                let boundArgs: any = null;
                const targetZones = new Set<string>();

                cmdBindings.forEach(b => {
                    const isBindingActive = b.when ? evalContext(b.when, ctx) : true;
                    if (isBindingActive) {
                        // Deduplicate keys (e.g. same key used in multiple zones for the same command)
                        if (!activeKeys.includes(b.key)) {
                            activeKeys.push(b.key);
                        }
                        if (b.allowInInput) allowInInput = true;
                        if (b.args) boundArgs = b.args;
                    }
                    if (b.zoneId) targetZones.add(b.zoneId);
                });

                return {
                    id: cmd.id,
                    label: (cmd as any).label || cmd.id,
                    kb: activeKeys,
                    enabled: isLogicEnabled && (cmdBindings.length === 0 || activeKeys.length > 0),
                    allowInInput,
                    log: cmd.log,
                    when: typeof cmd.when === 'string' ? cmd.when : cmd.when?.toString(),
                    isLogicEnabled,
                    currentPayload: boundArgs,
                    jurisdiction: targetZones.size > 0 ? 'ZONE' : 'GLOBAL',
                    zoneIds: Array.from(targetZones)
                } as ProcessedCommand & { zoneIds: string[] };
            });

            // 2. Ingest Static Definitions from ZoneRegistry (defineCommand)
            zoneRegistryMap.forEach((factories: import("@os/entities/CommandFactory.ts").CommandFactory<any, any>[], zoneId: string) => {
                factories.forEach(factory => {
                    // Check if already processed
                    const existing = processed.find(p => p.id === factory.id);
                    if (existing) {
                        // Tag with Zone if not already
                        const e = existing as any;
                        if (!e.zoneIds.includes(zoneId)) {
                            e.zoneIds.push(zoneId);
                            // If it was Global (no binding zone), promote to ZONE?
                            // A command can be globally bound but locally defined.
                            // We trust defineCommand zoneId as a source of jurisdiction.
                            if (existing.jurisdiction === 'GLOBAL') existing.jurisdiction = 'ZONE';
                        }
                        return;
                    }

                    // Add new Definition-only Entry
                    const isLogicEnabled = factory.when ? evalContext(factory.when, ctx) : true;
                    processed.push({
                        id: factory.id,
                        label: factory.id,
                        kb: [], // No binding
                        enabled: isLogicEnabled,
                        allowInInput: false,
                        log: factory.log,
                        when: typeof factory.when === 'string' ? factory.when : factory.when?.toString(),
                        isLogicEnabled,
                        currentPayload: null,
                        jurisdiction: 'ZONE',
                        zoneIds: [zoneId]
                    } as ProcessedCommand & { zoneIds: string[] });
                });
            });

            const sorter = (a: ProcessedCommand, b: ProcessedCommand) => {
                const aHash = a.kb.length > 0;
                const bHash = b.kb.length > 0;
                if (aHash && !bHash) return -1;
                if (!aHash && bHash) return 1;
                return a.id.localeCompare(b.id);
            };

            const groupedZones: Record<string, ProcessedCommand[]> = {};
            const globalCommands: ProcessedCommand[] = [];

            processed.forEach(cmd => {
                const zIds = (cmd as any).zoneIds;
                if (zIds && zIds.length > 0) {
                    zIds.forEach((zId: string) => {
                        if (!groupedZones[zId]) groupedZones[zId] = [];
                        groupedZones[zId].push(cmd);
                    });
                } else {
                    globalCommands.push(cmd);
                }
            });

            return {
                groupedZones,
                globalCommands: globalCommands.sort(sorter)
            };
        }, [ctx, registry]);

        const focusPath = ctx?.focusPath || [];
        const activeZoneId = ctx?.activeZone;

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
            <div className="flex flex-col">
                {/* Hierarchical Zone Commands */}
                {focusPath.map((zId: string, idx: number) => {
                    const zoneCommands = registryData.groupedZones[zId] || [];
                    const isLeaf = zId === activeZoneId;

                    // Optimization: If it's a root/middle zone with NO commands, we might skip it to save space,
                    // BUT for the LEAF zone (the one the user mentioned), we should show it even if empty.
                    if (zoneCommands.length === 0 && !isLeaf) return null;

                    return (
                        <section key={zId} className="border-b border-[#f0f0f0]">
                            <div className="flex items-center justify-between px-3 py-1 bg-[#f8f8f8] border-b border-[#f0f0f0]">
                                <h3 className="text-[8px] font-black text-[#666666] flex items-center gap-2 uppercase tracking-[0.2em]">
                                    <div className={`w-0.5 h-2 ${isLeaf ? 'bg-[#4ec9b0]' : 'bg-[#cccccc]'} opacity-80`} />
                                    {isLeaf ? "Active Zone" : `Parent [${idx}]`}
                                </h3>
                                <span className={`text-[7px] font-mono truncate max-w-[150px] uppercase font-bold ${isLeaf ? "text-[#007acc]" : "text-[#999999]"}`}>
                                    {zId}
                                </span>
                            </div>
                            <div className="flex flex-col bg-[#ffffff] min-h-[10px]">
                                {zoneCommands.length === 0 ? (
                                    <div className="px-3 py-2 text-[7px] text-[#cccccc] italic leading-none">
                                        No specific commands.
                                    </div>
                                ) : (
                                    renderCommandList(zoneCommands.sort((a, b) => a.id.localeCompare(b.id)))
                                )}
                            </div>
                        </section>
                    );
                })}

                {/* Global Section */}
                <div className="flex items-center justify-between px-3 py-1 bg-[#fcfcfc] border-b border-[#f0f0f0]">
                    <h3 className="text-[8px] font-black text-[#999999] flex items-center gap-2 uppercase tracking-[0.2em]">
                        <div className="w-0.5 h-2 bg-[#999999] opacity-30" />
                        Global
                    </h3>
                </div>
                <div className="flex flex-col bg-[#ffffff]">
                    {renderCommandList(registryData.globalCommands)}
                </div>
            </div>
        );
    }
);
