/**
 * UnifiedInspectorMock — Full-Density Pro Tool
 *
 * Implements "Chat Timeline" with deep hierarchy:
 * 1. Summary (Always visible): Time, Input, Command, Result Status
 * 2. Thread (Expandable): Pipeline Steps, Failure Reasons
 * 3. Detail (Deep Dive):
 *    - State Diff (Compact Table)
 *    - Effects (Execution Status)
 *    - Context (Bubble Path, Handler Scope)
 *    - Snapshots (JSON Tree)
 */

import { useState } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronRight,
    Command,
    Cpu,
    Database,
    GitCommit,
    Layers,
    MousePointer2,
    Terminal,
    Zap,
} from "lucide-react";

// ─── Types ───

type PipelineStep = {
    name: string;
    status: "pass" | "fail" | "skip";
    detail?: string;
};

interface MockEvent {
    id: string;
    time: string;
    input: { type: "KEYBOARD" | "MOUSE"; raw: string };
    command: { type: string; payload?: any } | null;
    pipeline: PipelineStep[];

    // OS Layer Data
    diffs: Array<{ path: string; from: string; to: string }>;
    effects: Array<{
        source: "focus" | "os";
        action: string;
        targetId: string | null;
        ok: boolean;
        reason?: string;
    }>;
    snapshot?: Record<string, unknown>;

    // Kernel Layer Data
    kernel?: {
        handlerScope: string;
        bubblePath: string[];
        middleware: Array<{ name: string; duration: number }>;
    };
}

// ─── Mock Data ───

const MOCK_EVENTS: MockEvent[] = [
    {
        id: "tx-1042",
        time: "10:42:05.120",
        input: { type: "KEYBOARD", raw: "ArrowDown" },
        command: { type: "NAVIGATE", payload: { direction: "DOWN" } },
        pipeline: [
            { name: "MATCH", status: "pass", detail: "NAVIGATE" },
            { name: "WHEN", status: "pass", detail: "zone:main-list" },
            { name: "EXEC", status: "pass" },
        ],
        diffs: [
            { path: "focus.activeId", from: "item-1", to: "item-2" },
            { path: "focus.selection", from: "[1]", to: "[2]" },
        ],
        effects: [
            { source: "focus", action: "scrollIntoView", targetId: "item-2", ok: true },
            { source: "focus", action: "focus", targetId: "item-2", ok: true },
        ],
        kernel: {
            handlerScope: "zone:main-list",
            bubblePath: ["item-1", "zone:main-list", "GLOBAL"],
            middleware: [{ name: "logger", duration: 0.2 }],
        },
        snapshot: {
            "focus.activeZone": "main-list",
            "focus.activeId": "item-2",
        },
    },
    {
        id: "tx-1043",
        time: "10:42:06.340",
        input: { type: "KEYBOARD", raw: "KeyA" },
        command: null,
        pipeline: [
            { name: "MATCH", status: "fail", detail: "No binding" },
            { name: "WHEN", status: "skip" },
            { name: "EXEC", status: "skip" },
        ],
        diffs: [],
        effects: [],
    },
    {
        id: "tx-1044",
        time: "10:42:07.800",
        input: { type: "KEYBOARD", raw: "Enter" },
        command: { type: "OPEN_ITEM", payload: {} },
        pipeline: [
            { name: "MATCH", status: "pass", detail: "OPEN_ITEM" },
            { name: "WHEN", status: "fail", detail: "isEditing (blocked)" },
            { name: "EXEC", status: "skip" },
        ],
        diffs: [],
        effects: [],
        kernel: {
            handlerScope: "descendant:item-2",
            bubblePath: ["item-2", "zone:main-list", "GLOBAL"],
            middleware: [],
        },
    },
    {
        id: "tx-1045",
        time: "10:42:09.100",
        input: { type: "MOUSE", raw: "Click(btn-save)" },
        command: { type: "SAVE_DRAFT", payload: { force: true } },
        pipeline: [
            { name: "MATCH", status: "pass", detail: "SAVE_DRAFT" },
            { name: "WHEN", status: "pass" },
            { name: "EXEC", status: "pass" },
        ],
        diffs: [
            { path: "data.draft.saved", from: "false", to: "true" },
            { path: "data.draft.savedAt", from: "null", to: "T10:42:09" },
        ],
        effects: [
            { source: "os", action: "toast", targetId: null, ok: true },
            { source: "os", action: "analytics.track", targetId: null, ok: false, reason: "Offline" },
        ],
        kernel: {
            handlerScope: "GLOBAL",
            bubblePath: ["btn-save", "toolbar", "GLOBAL"],
            middleware: [{ name: "analytics", duration: 1.5 }],
        },
        snapshot: {
            "data.draft.saved": true,
            "data.draft.savedAt": "10:42:09",
        },
    },
];

// ─── Component ───

export function UnifiedInspectorMock() {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["tx-1042"]));

    const toggle = (id: string) => {
        const next = new Set(expandedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpandedIds(next);
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#fafafa] text-[#333] font-sans text-[10px] select-none">
            {/* Header */}
            <div className="h-9 px-3 border-b border-[#e5e5e5] bg-white flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <Layers size={13} className="text-[#007acc]" />
                    <span className="font-bold text-[#5f6368]">Trace Log</span>
                </div>
            </div>

            {/* Timeline Stream */}
            <div className="flex-1 overflow-y-auto px-2 py-3 relative">
                {/* Spine */}
                <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-[#e2e8f0] z-0" />

                <div className="flex flex-col gap-4 relative z-10">
                    {MOCK_EVENTS.map((evt) => (
                        <TimelineNode
                            key={evt.id}
                            evt={evt}
                            expanded={expandedIds.has(evt.id)}
                            onToggle={() => toggle(evt.id)}
                        />
                    ))}
                </div>

                <div className="h-20" />
            </div>
        </div>
    );
}

// ─── Node Component ───

function TimelineNode({
    evt,
    expanded,
    onToggle,
}: {
    evt: MockEvent;
    expanded: boolean;
    onToggle: () => void;
}) {
    const isFail = evt.pipeline.some(s => s.status === 'fail');
    const isNoOp = evt.pipeline[0].status === 'fail';

    const icon = evt.input.type === "MOUSE" ? <MousePointer2 size={11} /> : <Command size={11} />;
    const statusColor = isFail ? "bg-[#fff5f5] border-[#feb2b2] text-[#e53e3e]" : "bg-white border-[#cbd5e0] text-[#4a5568]";

    return (
        <div className="flex gap-2 group">
            {/* Avatar */}
            <div
                onClick={onToggle}
                className={`relative w-6 h-6 shrink-0 rounded-full border flex items-center justify-center cursor-pointer transition-colors z-10 shadow-sm
        ${statusColor} group-hover:border-[#3182ce] group-hover:text-[#3182ce]`}
            >
                {icon}
            </div>

            {/* Main Column */}
            <div className="flex-1 min-w-0 flex flex-col pt-0.5">

                {/* Header Summary */}
                <div onClick={onToggle} className="flex items-center gap-2 cursor-pointer h-5 mb-1">
                    <span className={`font-bold text-[11px] truncate ${isFail ? 'text-[#c53030]' : 'text-[#2d3748]'}`}>
                        {evt.input.raw}
                    </span>
                    <span className="text-[9px] text-[#a0aec0] font-mono tabular-nums opacity-60">
                        {evt.time.split('.')[0]}
                    </span>
                    {evt.command && !isFail && (
                        <span className="px-1.5 py-px rounded bg-[#ebf8ff] text-[#2b6cb0] text-[9px] font-semibold border border-[#bee3f8] truncate max-w-[120px]">
                            {evt.command.type}
                        </span>
                    )}
                </div>

                {/* Thread Content */}
                <div className={`flex flex-col gap-1.5 transition-all duration-200 ${expanded ? "" : "opacity-80"}`}>

                    {/* Pipeline Thoughts (Vertical) */}
                    <div className="flex flex-col pl-1 border-l border-[#e2e8f0] ml-1 gap-1 py-1">
                        {evt.pipeline.map((step, i) => (
                            <div key={i} className="flex items-center gap-2 h-3.5 relative">
                                <div className={`w-1.5 h-1.5 rounded-full z-10 -ml-[3.5px] border border-white ${step.status === 'pass' ? "bg-[#48bb78]" :
                                    step.status === 'fail' ? "bg-[#f56565]" : "bg-[#cbd5e0]"
                                    }`} />
                                <span className={`text-[9px] font-mono font-medium w-[40px] shrink-0 ${step.status === 'pass' ? "text-[#4a5568]" :
                                    step.status === 'fail' ? "text-[#c53030]" : "text-[#a0aec0]"
                                    }`}>
                                    {step.name}
                                </span>
                                {step.detail && (
                                    <span className={`text-[9px] truncate ${step.status === 'fail' ? "text-[#e53e3e] font-bold" : "text-[#718096]"
                                        }`}>
                                        {step.detail}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Deep Dive Details (Only when expanded) */}
                    {expanded && !isNoOp && (
                        <div className="mt-1 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col gap-3">

                            {/* 1. State Diffs */}
                            {evt.diffs.length > 0 && (
                                <Section title="State Changes" icon={<Cpu size={9} />}>
                                    <div className="flex flex-col gap-1">
                                        {evt.diffs.map((d, i) => (
                                            <div key={i} className="font-mono text-[9px] grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center">
                                                <span className="text-[#4a5568] truncate" title={d.path}>{d.path.split('.').slice(-2).join('.')}</span>
                                                <span className="text-[#e53e3e] bg-[#fff5f5] px-1 rounded line-through opacity-70">{d.from}</span>
                                                <span className="text-[#cbd5e0]">→</span>
                                                <span className="text-[#38a169] bg-[#f0fff4] px-1 rounded font-bold">{d.to}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* 2. Side Effects */}
                            {evt.effects.length > 0 && (
                                <Section title="Side Effects" icon={<Zap size={9} />}>
                                    <div className="flex flex-col gap-1">
                                        {evt.effects.map((eff, i) => (
                                            <div key={i} className={`flex items-start gap-1.5 text-[9px] ${eff.ok ? "text-[#2d3748]" : "text-[#c05621]"
                                                }`}>
                                                {eff.ok ? <Check size={9} className="text-[#38a169] mt-0.5" /> : <AlertTriangle size={9} className="mt-0.5" />}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-mono font-medium">{eff.action}({eff.targetId || "global"})</span>
                                                    {!eff.ok && <span className="opacity-80 italic">- {eff.reason}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* 3. Kernel Context */}
                            {evt.kernel && (
                                <Section title="Kernel Context" icon={<GitCommit size={9} />}>
                                    <div className="flex flex-col gap-1.5 text-[9px]">
                                        <div className="flex gap-2">
                                            <span className="text-[#718096] w-16 shrink-0">Handler:</span>
                                            <span className="font-mono text-[#2b6cb0] bg-[#ebf8ff] px-1 rounded">{evt.kernel.handlerScope}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-[#718096] w-16 shrink-0">Bubble Path:</span>
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {evt.kernel.bubblePath.map((scope, i) => (
                                                    <div key={i} className="flex items-center">
                                                        {i > 0 && <span className="text-[#cbd5e0] mr-1">›</span>}
                                                        <span className="text-[#4a5568]">{scope}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* 4. Raw Snapshot */}
                            {evt.snapshot && (
                                <RawDataToggle data={evt.snapshot} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Click Overlay */}
            <div onClick={onToggle} className="absolute inset-0 z-0 cursor-default" style={{ pointerEvents: 'none' }} />
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f7fafc] border-b border-[#edf2f7]">
                <div className="text-[#718096]">{icon}</div>
                <span className="font-bold text-[#718096] uppercase tracking-wider text-[8px]">{title}</span>
            </div>
            <div className="px-2 py-1.5">
                {children}
            </div>
        </div>
    );
}

function RawDataToggle({ data }: { data: any }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-[#e2e8f0] rounded bg-[#f8fafc]">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-2 py-1 hover:bg-[#edf2f7] transition-colors group"
            >
                <div className="flex items-center gap-1.5 text-[#718096] group-hover:text-[#4a5568]">
                    <Database size={9} />
                    <span className="font-bold text-[8px] uppercase tracking-wider">Raw Snapshot</span>
                </div>
                <ChevronDown size={10} className={`text-[#a0aec0] transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="p-2 border-t border-[#e2e8f0] bg-[#2d3748] overflow-x-auto">
                    <pre className="text-[9px] font-mono text-[#e2e8f0] leading-relaxed">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
