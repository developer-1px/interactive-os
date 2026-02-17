import { GroupRegistry } from "@inspector/GroupRegistry";
import type { ProcessedCommand } from "@inspector/panels/CommandRow.tsx";
import { CommandRow } from "@inspector/panels/CommandRow.tsx";
import { evalContext } from "@os/AntigravityOS";
import { memo, useMemo } from "react";

// Zero-Base Jurisdiction Detection
// Pure Logic: If ANY binding relies on a Group Scope -> It is a Group Command.
export const RegistryMonitor = memo(
  ({
    ctx,
    activeKeybindingMap,
    isInputActive,
    lastCommandId,
    lastPayload,
    historyCount,
  }: {
    ctx: any;
    activeKeybindingMap: Map<string, boolean>;
    isInputActive: boolean;
    lastCommandId: string | null;
    lastPayload: any;
    historyCount: number;
  }) => {
    const registryData = useMemo(() => {
      if (!ctx) return { groupedGroups: {}, globalCommands: [] };

      const groupRegistryMap = GroupRegistry.getAll();
      const processed: ProcessedCommand[] = [];

      // Ingest from GroupRegistry (kernel-native defineCommand)
      groupRegistryMap.forEach(
        (
          factories: import("@os/schemas/command/CommandFactory.ts").CommandFactory<
            any,
            any
          >[],
          groupId: string,
        ) => {
          factories.forEach((factory) => {
            const existing = processed.find((p) => p.id === factory.id);
            if (existing) {
              const e = existing as any;
              if (!e.groupIds.includes(groupId)) {
                e.groupIds.push(groupId);
              }
              return;
            }

            const isLogicEnabled = factory.when
              ? evalContext(factory.when, ctx)
              : true;
            processed.push({
              id: factory.id,
              label: factory.id,
              kb: [],
              enabled: isLogicEnabled,
              allowInInput: false,
              log: factory.log,
              when:
                typeof factory.when === "string"
                  ? factory.when
                  : factory.when?.toString(),
              isLogicEnabled,
              currentPayload: null,
              jurisdiction: "GROUP",
              groupIds: [groupId],
            } as ProcessedCommand & { groupIds: string[] });
          });
        },
      );

      const sorter = (a: ProcessedCommand, b: ProcessedCommand) => {
        const aHash = a.kb.length > 0;
        const bHash = b.kb.length > 0;
        if (aHash && !bHash) return -1;
        if (!aHash && bHash) return 1;
        return a.id.localeCompare(b.id);
      };

      const groupedGroups: Record<string, ProcessedCommand[]> = {};
      const globalCommands: ProcessedCommand[] = [];

      processed.forEach((cmd) => {
        const gIds = (cmd as any).groupIds;
        if (gIds && gIds.length > 0) {
          gIds.forEach((gId: string) => {
            if (!groupedGroups[gId]) groupedGroups[gId] = [];
            groupedGroups[gId].push(cmd);
          });
        } else {
          globalCommands.push(cmd);
        }
      });

      return {
        groupedGroups,
        globalCommands: globalCommands.sort(sorter),
      };
    }, [ctx]);

    const focusPath = ctx?.focusPath || [];
    const activeGroupId = ctx?.activeGroup;

    const renderCommandList = (commands: ProcessedCommand[]) =>
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
      });

    return (
      <div className="flex flex-col">
        {/* Hierarchical Group Commands */}
        {focusPath.map((gId: string, idx: number) => {
          const groupCommands = registryData.groupedGroups[gId] || [];
          const isLeaf = gId === activeGroupId;

          // Optimization: If it's a root/middle group with NO commands, we might skip it to save space,
          // BUT for the LEAF group (the one the user mentioned), we should show it even if empty.
          if (groupCommands.length === 0 && !isLeaf) return null;

          return (
            <section key={gId} className="border-b border-[#f0f0f0]">
              <div className="flex items-center justify-between px-3 py-1 bg-[#f8f8f8] border-b border-[#f0f0f0]">
                <h3 className="text-[8px] font-black text-[#666666] flex items-center gap-2 uppercase tracking-[0.2em]">
                  <div
                    className={`w-0.5 h-2 ${isLeaf ? "bg-[#4ec9b0]" : "bg-[#cccccc]"} opacity-80`}
                  />
                  {isLeaf ? "Active Group" : `Parent [${idx}]`}
                </h3>
                <span
                  className={`text-[7px] font-mono truncate max-w-[150px] uppercase font-bold ${isLeaf ? "text-[#007acc]" : "text-[#999999]"}`}
                >
                  {gId}
                </span>
              </div>
              <div className="flex flex-col bg-[#ffffff] min-h-[10px]">
                {groupCommands.length === 0 ? (
                  <div className="px-3 py-2 text-[7px] text-[#cccccc] italic leading-none">
                    No specific commands.
                  </div>
                ) : (
                  renderCommandList(
                    groupCommands.sort((a, b) => a.id.localeCompare(b.id)),
                  )
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
  },
);
