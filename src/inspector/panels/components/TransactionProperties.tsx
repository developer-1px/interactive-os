import type { Transaction } from "@kernel/core/transaction";
import { inferSignal } from "../../utils/inferSignal";
import { AriaSnapshot, DiffValue } from "./ElementSnapshot";

// ─── Array-Index Diff Grouping ───

interface DiffEntry {
    index?: string;
    from?: unknown;
    to?: unknown;
}

interface DiffGroup {
    basePath: string;
    entries: DiffEntry[];
}

const ARRAY_INDEX_RE = /^(.+)\[(\d+)\]$/;

export function groupDiffs(
    diffs: Array<{ path: string; from?: unknown; to?: unknown }>
): DiffGroup[] {
    const groups: DiffGroup[] = [];
    const groupMap = new Map<string, DiffGroup>();

    for (const d of diffs) {
        const m = ARRAY_INDEX_RE.exec(d.path);
        if (m) {
            const basePath = m[1]!;
            const index = m[2]!;
            let group = groupMap.get(basePath);
            if (!group) {
                group = { basePath, entries: [] };
                groupMap.set(basePath, group);
                groups.push(group);
            }
            group.entries.push({ index, from: d.from, to: d.to });
        } else {
            groups.push({
                basePath: d.path,
                entries: [{ from: d.from, to: d.to }],
            });
        }
    }

    return groups;
}

export function TransactionProperties({ tx }: { tx: Transaction }) {
    const signal = inferSignal(tx);
    const { trigger, diff, effects } = signal;

    return (
        <div className="flex flex-col gap-1.5 pl-6 pr-2 pb-2">
            {/* ── Pipeline: Sensed & Resolved ── */}
            {signal.pipeline && (
                <div className="flex flex-col gap-1 mt-0.5">
                    {!!signal.pipeline.sensed && (
                        <div className="flex flex-col font-mono text-[9.5px]">
                            <div className="text-[#475569] font-semibold break-all mt-1 mb-1 inline-flex items-center self-start">
                                DOM SENSE
                            </div>
                            <div className="flex flex-col gap-1 ml-1.5 border-l border-[#e2e8f0] pl-2.5">
                                <div className="flex flex-col gap-[1px] w-full">
                                    <DiffValue value={signal.pipeline.sensed} type="changed-from" />
                                </div>
                            </div>
                        </div>
                    )}
                    {!!signal.pipeline.resolved && (
                        <div className="flex flex-col font-mono text-[9.5px]">
                            <div className="text-[#475569] font-semibold break-all mt-1 mb-1 inline-flex items-center self-start">
                                PURE RESOLVE
                            </div>
                            <div className="flex flex-col gap-1 ml-1.5 border-l border-[#e2e8f0] pl-2.5">
                                <div className="flex flex-col gap-[1px] w-full">
                                    <DiffValue value={signal.pipeline.resolved} type="changed-to" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── FINAL ARIA Snapshot ── */}
            {trigger.elementId && (
                <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex flex-col font-mono text-[9.5px]">
                        <div className="text-[#8b5cf6] font-semibold break-all mt-1 mb-1 inline-flex items-center self-start">
                            FINAL ARIA
                        </div>
                        <div className="flex flex-col gap-1 ml-1.5 border-l border-[#ede9fe] pl-2.5">
                            <AriaSnapshot elementId={trigger.elementId} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Diff (primary info) ── */}
            {diff.length > 0 && (
                <div className="flex flex-col gap-1 mt-0.5">
                    {groupDiffs(diff).map((group, gi) => (
                        <div
                            key={`${group.basePath}-${gi}`}
                            className="flex flex-col font-mono text-[9.5px]"
                        >
                            <div className="text-[#475569] font-semibold break-all mt-1.5 mb-1 inline-flex items-center self-start">
                                {group.basePath}
                                {group.entries.length > 1 && (
                                    <span className="text-[#94a3b8] font-normal ml-1.5 text-[8.5px]">
                                        ×{group.entries.length}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-1 ml-1.5 border-l border-[#e2e8f0] pl-2.5">
                                {group.entries.map((entry, ei) => (
                                    <div key={`${entry.index ?? ei}`} className="flex flex-col gap-[1px]">
                                        {entry.index !== undefined && (
                                            <span className="text-[8.5px] text-[#94a3b8] font-mono leading-none mb-0.5">
                                                [{entry.index}]
                                            </span>
                                        )}
                                        {entry.from !== undefined && entry.to !== undefined ? (
                                            <div className="flex flex-col gap-[1px] w-full">
                                                <DiffValue value={entry.from} type="changed-from" />
                                                <DiffValue value={entry.to} type="changed-to" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-[1px] w-full">
                                                {entry.from !== undefined && (
                                                    <DiffValue value={entry.from} type="removed" />
                                                )}
                                                {entry.to !== undefined && (
                                                    <DiffValue value={entry.to} type="added" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Effects + Kernel: inline summary ── */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[8px] text-[#94a3b8] font-mono mt-2">
                {effects.length > 0 && (
                    <span title={effects.join(", ")}>fx: {effects.join(", ")}</span>
                )}
                {tx.handlerScope && tx.handlerScope !== "unknown" && (
                    <span>scope: {tx.handlerScope}</span>
                )}
                {tx.bubblePath?.length > 1 && (
                    <span>path: {tx.bubblePath.join(" › ")}</span>
                )}
            </div>
        </div>
    );
}
