import { memo, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGlobalZoneRegistry } from "@os/features/focusZone/registry/GlobalZoneRegistry";

export const OSStateViewer = memo(() => {
    const activeZoneId = useGlobalZoneRegistry((s) => s.activeZoneId);
    const zones = useGlobalZoneRegistry((s) => s.zones);

    // Compute focusPath inline to avoid unstable method call
    const focusPath = useGlobalZoneRegistry(
        useShallow((s) => {
            if (!s.activeZoneId) return [];
            const path: string[] = [];
            let currentId: string | null = s.activeZoneId;
            while (currentId) {
                path.unshift(currentId);
                const entry = s.zones.get(currentId);
                currentId = entry?.parentId || null;
                if (path.length > 100) break;
            }
            return path;
        })
    );

    // Get focusedItemId from active zone's store (outside of selector)
    const activeZoneStore = activeZoneId ? zones.get(activeZoneId)?.store : null;
    const focusedItemId = activeZoneStore?.getState().focusedItemId ?? null;

    const osState = useMemo(() => ({
        focus: {
            activeZoneId,
            focusedItemId,
            focusPath,
        },
        zones: Object.fromEntries(zones),
    }), [activeZoneId, focusedItemId, focusPath, zones]);

    return (
        <div className="h-full flex flex-col bg-[#ffffff]">
            <div className="px-3 h-7 border-b border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between shrink-0">
                <h3 className="text-[8px] font-black text-[#999999] flex items-center gap-2 uppercase tracking-[0.2em]">
                    <div className="w-1 h-2.5 bg-[#c586c0] opacity-50" />
                    Engine
                </h3>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-[#fafafa]">
                <pre className="text-[9px] text-[#666666] font-mono leading-tight whitespace-pre-wrap break-all selection:bg-[#4ec9b0]/10">
                    {JSON.stringify(osState, null, 2)}
                </pre>
            </div>
        </div>
    );
});
