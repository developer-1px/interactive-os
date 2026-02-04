import { useState } from "react";
import { Zone } from "@os/primitives/Zone.tsx";
import { Item } from "@os/primitives/Item.tsx";
import { Field } from "@os/primitives/Field.tsx";
import { Sliders, LayoutGrid, List, MessageSquare, Maximize, Edit3 } from "lucide-react";
import type { FocusDirection } from "@os/entities/FocusDirection";
import type { FocusEdge } from "@os/entities/FocusEdge";
import type { FocusTab } from "@os/entities/FocusTab";
import type { FocusTarget } from "@os/entities/FocusTarget";
import type { FocusEntry } from "@os/entities/FocusEntry";

// --- Types ---
type AxisConfig = {
    direction: FocusDirection;
    edge: FocusEdge;
    tab: FocusTab;
    target: FocusTarget;
    entry: FocusEntry;
    restore: boolean;
};

// --- Main Page ---
export default function FocusShowcasePage() {
    const [config, setConfig] = useState<AxisConfig>({
        direction: "v",
        edge: "stop",
        tab: "escape",
        target: "real",
        entry: "first",
        restore: false
    });

    return (
        <div className="flex-1 h-full bg-slate-50 text-slate-800 overflow-y-auto custom-scrollbar font-sans selection:bg-indigo-500/20">
            <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

                {/* Header */}
                <header className="space-y-4 text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold tracking-wider mb-2 uppercase">
                        <Sliders size={12} />
                        Focus Engine V7
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        6-Axis Focus System
                    </h1>
                    <p className="text-slate-500 leading-relaxed text-lg">
                        The definitive verification suite for the Antigravity Interaction OS.
                        <br />Test all 6 dimensions of navigation physics in real-time.
                    </p>
                </header>

                {/* --- 1. THE 6-AXIS TESTER --- */}
                <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-900/5">

                    {/* Controls Header */}
                    <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            Interactive Lab
                        </h2>
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            ID: axis-tester-zone
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* Control Panel (Left) */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Navigation Axes */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Navigation Physics</h3>

                                    <AxisToggle
                                        label="Direction"
                                        description="Layout orientation"
                                        options={["v", "h", "grid", "none"]}
                                        value={config.direction}
                                        onChange={(v) => setConfig((p) => ({ ...p, direction: v as FocusDirection }))}
                                    />
                                    <AxisToggle
                                        label="Edge (Boundary)"
                                        description="At start/end of list"
                                        options={["stop", "loop"]}
                                        value={config.edge}
                                        onChange={(v) => setConfig((p) => ({ ...p, edge: v as FocusEdge }))}
                                    />
                                    <AxisToggle
                                        label="Tab (Exit)"
                                        description="Tab key behavior"
                                        options={["escape", "loop", "flow"]}
                                        value={config.tab}
                                        onChange={(v) => setConfig((p) => ({ ...p, tab: v as FocusTab }))}
                                    />
                                </div>

                                {/* Focus Axes */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Focus Lifecycle</h3>

                                    <AxisToggle
                                        label="Target (Virtualization)"
                                        description="DOM focus strategy"
                                        options={["real", "virtual"]}
                                        value={config.target}
                                        onChange={(v) => setConfig((p) => ({ ...p, target: v as FocusTarget }))}
                                    />
                                    <AxisToggle
                                        label="Entry Point"
                                        description="On zone focus"
                                        options={["first", "restore", "selected"]}
                                        value={config.entry}
                                        onChange={(v) => setConfig((p) => ({ ...p, entry: v as FocusEntry }))}
                                    />

                                    <div className="flex items-center justify-between pt-1">
                                        <div>
                                            <div className="text-xs font-bold text-slate-700">Restore History</div>
                                            <div className="text-[10px] text-slate-400">Remember last item</div>
                                        </div>
                                        <button
                                            onClick={() => setConfig(p => ({ ...p, restore: !p.restore }))}
                                            className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${config.restore ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${config.restore ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Zone (Right) */}
                        <div className="lg:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity">
                                <div className="text-[9px] font-mono text-slate-400 text-right space-y-1">
                                    <div>direction: {config.direction}</div>
                                    <div>edge: {config.edge}</div>
                                    <div>tab: {config.tab}</div>
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-slate-500 mb-4">LIVE PREVIEW</div>

                            <div className="flex-1 min-h-[200px] flex items-center justify-center">
                                <Zone
                                    id="axis-tester-zone"
                                    {...config}
                                    className={`
                                        w-full h-full p-2 gap-3 transition-all duration-300
                                        ${config.direction === "h" ? "flex flex-row overflow-x-auto items-center" : ""}
                                        ${config.direction === "v" ? "flex flex-col" : ""}
                                        ${config.direction === "grid" ? "grid grid-cols-2 content-start" : ""}
                                    `}
                                >
                                    {["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"].map((name, i) => (
                                        <Item key={name} id={`test-item-${i}`}>
                                            {({ isFocused }: { isFocused: boolean }) => (
                                                <div
                                                    className={`
                                                        p-2 border cursor-pointer flex items-center justify-between
                                                        ${isFocused
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-white text-black border-gray-300"
                                                        }
                                                        ${config.direction === "h" ? "w-auto min-w-[100px] flex-1" : "w-full"}
                                                    `}
                                                >
                                                    {name}
                                                </div>
                                            )}
                                        </Item>
                                    ))}
                                </Zone>
                            </div>
                        </div>
                    </div>
                </section>


                {/* --- 2. ROLE-BASED SCENARIOS --- */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pattern Library</h2>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Scenario: Listbox (Vertical) */}
                        <ScenarioCard
                            title="Vertical Listbox"
                            description="Standard menu. Vertical nav. Escapes on Tab."
                            icon={<List size={18} className="text-emerald-500" />}
                            tags={['role="listbox"', 'dir="v"', 'tab="escape"']}
                        >
                            <Zone
                                id="demo-listbox"
                                role="listbox"
                                direction="v"
                                tab="escape"
                                className="space-y-1 bg-white p-2 rounded-lg border border-slate-100"
                            >
                                {["Profile", "Settings", "Billing", "Logout"].map((item, i) => (
                                    <Item key={item} id={`listbox-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`px-3 py-2 rounded-md text-sm transition-colors cursor-default ${isFocused ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600'
                                                }`}>
                                                {item}
                                            </div>
                                        )}
                                    </Item>
                                ))}
                            </Zone>
                        </ScenarioCard>

                        {/* Scenario: Toolbar (Horizontal) */}
                        <ScenarioCard
                            title="Action Toolbar"
                            description="Horizontal tools. Loops at edges."
                            icon={<Maximize size={18} className="text-blue-500" />}
                            tags={['role="toolbar"', 'dir="h"', 'edge="loop"']}
                        >
                            <Zone
                                id="demo-toolbar"
                                role="toolbar"
                                direction="h"
                                edge="loop"
                                className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200"
                            >
                                {["Bold", "Italic", "Underline", "Strike"].map((item, i) => (
                                    <Item key={item} id={`toolbar-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${isFocused ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-200'
                                                }`}>
                                                {item[0]}
                                            </div>
                                        )}
                                    </Item>
                                ))}
                            </Zone>
                        </ScenarioCard>

                        {/* Scenario: Modal Dialog (Trap) */}
                        <ScenarioCard
                            title="Modal Dialog"
                            description="Traps focus completely (Loop Tab & Edge)."
                            icon={<MessageSquare size={18} className="text-rose-500" />}
                            tags={['role="dialog"', 'tab="loop"', 'edge="loop"']}
                        >
                            <Zone
                                id="demo-dialog"
                                role="dialog"
                                tab="loop"
                                edge="loop"
                                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center space-y-4"
                            >
                                <h4 className="text-sm font-semibold text-slate-800">Delete Item?</h4>
                                <p className="text-xs text-slate-500">This action cannot be undone.</p>
                                <div className="flex gap-3 justify-center">
                                    <Item id="dialog-cancel">
                                        {({ isFocused }) => (
                                            <button className={`px-4 py-1.5 rounded text-xs font-medium border transition-all ${isFocused ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-200' : 'border-slate-200 text-slate-600'
                                                }`}>
                                                Cancel
                                            </button>
                                        )}
                                    </Item>
                                    <Item id="dialog-confirm">
                                        {({ isFocused }) => (
                                            <button className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${isFocused ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-200' : 'bg-rose-500 text-white'
                                                }`}>
                                                Delete
                                            </button>
                                        )}
                                    </Item>
                                </div>
                            </Zone>
                        </ScenarioCard>

                        {/* Scenario: Grid (Calendar) */}
                        <ScenarioCard
                            title="Data Grid"
                            description="2D Matrix navigation."
                            icon={<LayoutGrid size={18} className="text-amber-500" />}
                            tags={['role="grid"', 'dir="grid"']}
                        >
                            <Zone
                                id="demo-grid"
                                role="grid"
                                direction="grid"
                                className="grid grid-cols-4 gap-1 bg-white p-2 rounded-lg border border-slate-100"
                            >
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Item key={i} id={`grid-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`aspect-square rounded flex items-center justify-center text-xs transition-colors ${isFocused ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                {i + 1}
                                            </div>
                                        )}
                                    </Item>
                                ))}
                            </Zone>
                        </ScenarioCard>

                        {/* Scenario: Seamless Kanban */}
                        <ScenarioCard
                            title="Seamless Kanban"
                            description="Cross-zone navigation at boundaries."
                            icon={<LayoutGrid size={18} className="text-purple-500" />}
                            tags={['seamless', 'edge="stop"', 'direction="v"']}
                        >
                            <Zone
                                id="seamless-kanban-parent"
                                direction="h"
                                className="flex gap-4"
                            >
                                {["To Do", "In Progress", "Done"].map((col, colIdx) => (
                                    <Zone
                                        key={col}
                                        id={`seamless-col-${colIdx}`}
                                        direction="v"
                                        edge="stop"
                                        seamless
                                        className="flex-1 bg-white p-2 rounded-lg border border-slate-100"
                                    >
                                        <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase">{col}</div>
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Item key={i} id={`seamless-${colIdx}-${i}`}>
                                                {({ isFocused }) => (
                                                    <div className={`px-2 py-1.5 mb-1 rounded text-xs transition-colors cursor-default ${isFocused ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-slate-50 text-slate-500'
                                                        }`}>
                                                        Card {colIdx * 3 + i + 1}
                                                    </div>
                                                )}
                                            </Item>
                                        ))}
                                    </Zone>
                                ))}
                            </Zone>
                        </ScenarioCard>

                        {/* Scenario: Deferred Field (Enter-to-Edit) */}
                        <ScenarioCard
                            title="Deferred Field"
                            description="Enter-to-Edit pattern. Focus ≠ Edit."
                            icon={<Edit3 size={18} className="text-orange-500" />}
                            tags={['mode="deferred"', 'Enter→Edit', 'Escape→Cancel']}
                        >
                            <DeferredFieldDemo />
                        </ScenarioCard>

                    </div>
                </section>

                {/* --- 3. NAVIGATION POLICIES (Merged from Showcase) --- */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Navigation Policies</h2>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Policy: Loop */}
                        <ScenarioCard
                            title="Loop Policy"
                            description="Traps focus inside the zone."
                            icon={<Sliders size={18} className="text-pink-500" />}
                            tags={['tab="loop"', 'dir="v"']}
                        >
                            <Zone
                                id="demo-loop-policy"
                                direction="v"
                                tab="loop"
                                className="space-y-2 bg-white p-4 rounded-lg border border-pink-100"
                            >
                                {["Modal Confirm", "Modal Cancel", "More Options"].map((item, i) => (
                                    <Item key={item} id={`loop-policy-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`px-3 py-2 rounded border transition-colors cursor-pointer ${isFocused
                                                ? 'bg-pink-50 border-pink-200 text-pink-700 font-medium'
                                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                }`}>
                                                {item}
                                            </div>
                                        )}
                                    </Item>
                                ))}
                                <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-100 mt-2">
                                    Tab cycles within this zone.
                                </div>
                            </Zone>
                        </ScenarioCard>

                        {/* Policy: Escape */}
                        <ScenarioCard
                            title="Escape Policy"
                            description="Jumps to next Zone (Recommended)."
                            icon={<Maximize size={18} className="text-emerald-500" />}
                            tags={['tab="escape"', 'dir="v"', 'RECOMMENDED']}
                        >
                            <Zone
                                id="demo-escape-policy"
                                direction="v"
                                tab="escape"
                                className="space-y-2 bg-white p-4 rounded-lg border border-emerald-100 shadow-sm"
                            >
                                {["List Item A", "List Item B", "List Item C"].map((item, i) => (
                                    <Item key={item} id={`escape-policy-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`px-3 py-2 rounded border transition-colors cursor-pointer flex justify-between ${isFocused
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium'
                                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                }`}>
                                                <span>{item}</span>
                                                <span className="text-[10px] opacity-0 group-hover:opacity-100">→</span>
                                            </div>
                                        )}
                                    </Item>
                                ))}
                                <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-100 mt-2">
                                    Tab jumps to next card.
                                </div>
                            </Zone>
                        </ScenarioCard>

                        {/* Policy: Flow */}
                        <ScenarioCard
                            title="Flow Policy"
                            description="Linear Form Style navigation."
                            icon={<List size={18} className="text-blue-500" />}
                            tags={['tab="flow"', 'dir="v"']}
                        >
                            <Zone
                                id="demo-flow-policy"
                                direction="v"
                                tab="flow"
                                className="space-y-2 bg-white p-4 rounded-lg border border-blue-100"
                            >
                                {["Username", "Password", "Submit"].map((item, i) => (
                                    <Item key={item} id={`flow-policy-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`px-3 py-2 rounded border transition-colors cursor-pointer ${isFocused
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium transform translate-x-1'
                                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                }`}>
                                                {item}
                                            </div>
                                        )}
                                    </Item>
                                ))}
                                <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-100 mt-2">
                                    Tab moves to next item (Linear).
                                </div>
                            </Zone>
                        </ScenarioCard>

                    </div>
                </section>

                {/* --- 4. NESTED HIERARCHIES (Merged from Showcase) --- */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nested Hierarchies</h2>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nested Escape */}
                        <ScenarioCard
                            title="Nested Escape"
                            description="Standard App Pattern. Tab jumps zones."
                            icon={<LayoutGrid size={18} className="text-indigo-500" />}
                            tags={['tab="escape"', 'nested', 'RECOMMENDED']}
                        >
                            <Zone
                                id="nested-escape-outer"
                                direction="v"
                                tab="escape"
                                className="p-4 bg-slate-50 rounded-lg border border-indigo-100 space-y-3"
                            >
                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Outer Zone (Level 1)</div>
                                {["Parent Item A", "Parent Item B"].map((item, i) => (
                                    <Item key={item} id={`nested-esc-outer-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`px-3 py-2 rounded border text-xs transition-colors ${isFocused ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
                                                }`}>
                                                {item}
                                            </div>
                                        )}
                                    </Item>
                                ))}

                                <Zone
                                    id="nested-escape-inner"
                                    direction="v"
                                    tab="escape"
                                    className="p-3 bg-white rounded border border-indigo-50 space-y-2"
                                >
                                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Inner Zone (Level 2)</div>
                                    {["Child 1", "Child 2"].map((item, i) => (
                                        <Item key={item} id={`nested-esc-inner-${i}`}>
                                            {({ isFocused }) => (
                                                <div className={`px-2 py-1.5 rounded border text-xs transition-colors flex items-center gap-2 ${isFocused ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                                                    {item}
                                                </div>
                                            )}
                                        </Item>
                                    ))}
                                </Zone>
                            </Zone>
                        </ScenarioCard>

                        {/* Nested Flow */}
                        <ScenarioCard
                            title="Nested Flow"
                            description="Form Pattern. Linear traversal."
                            icon={<List size={18} className="text-cyan-500" />}
                            tags={['tab="flow"', 'nested', 'FORM STYLE']}
                        >
                            <Zone
                                id="nested-flow-outer"
                                direction="v"
                                tab="flow"
                                className="p-4 bg-slate-50 rounded-lg border border-cyan-100 space-y-3"
                            >
                                <div className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">Outer Form (Level 1)</div>
                                {["Section 1 Header", "Section 1 Note"].map((item, i) => (
                                    <Item key={item} id={`nested-flow-outer-${i}`}>
                                        {({ isFocused }) => (
                                            <div className={`px-3 py-2 rounded border text-xs transition-colors ${isFocused ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'
                                                }`}>
                                                {item}
                                            </div>
                                        )}
                                    </Item>
                                ))}

                                <Zone
                                    id="nested-flow-inner"
                                    direction="v"
                                    tab="flow"
                                    className="p-3 bg-white rounded border border-cyan-50 space-y-2"
                                >
                                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Inner Fields (Level 2)</div>
                                    {["Sub-field A", "Sub-field B"].map((item, i) => (
                                        <Item key={item} id={`nested-flow-inner-${i}`}>
                                            {({ isFocused }) => (
                                                <div className={`px-2 py-1.5 rounded border text-xs transition-colors pl-4 ${isFocused ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-slate-50 border-slate-100 text-slate-400'
                                                    }`}>
                                                    {item}
                                                </div>
                                            )}
                                        </Item>
                                    ))}
                                </Zone>
                            </Zone>
                        </ScenarioCard>

                    </div>
                </section>

                <footer className="text-center text-slate-400 text-xs py-8">
                    Antigravity Interaction OS v7.4 • Focus Engine Benchmark
                </footer>

            </div>
        </div>
    );
}

// --- Components ---

function AxisToggle<T extends string>({
    label,
    description,
    options,
    value,
    onChange,
}: {
    label: string;
    description: string;
    options: T[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div>
            <div className="flex items-baseline justify-between mb-2">
                <div className="text-xs font-bold text-slate-700">{label}</div>
                <div className="text-[10px] text-slate-400">{description}</div>
            </div>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                {options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`flex-1 px-3 py-1.5 text-[11px] font-medium rounded-md transition-all duration-200
                            ${value === opt
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 font-bold"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ScenarioCard({ title, description, icon, children, tags }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    tags: string[];
}) {
    return (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
            <div className="p-5 border-b border-slate-200/50 bg-white">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        {icon}
                        {title}
                    </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">{description}</p>
                <div className="flex gap-2">
                    {tags.map(tag => (
                        <code key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] border border-slate-200">
                            {tag}
                        </code>
                    ))}
                </div>
            </div>
            <div className="p-5">
                {children}
            </div>
        </div>
    );
}

/**
 * Demo component for Deferred Field mode.
 * Demonstrates Enter-to-Edit and Escape-to-Cancel patterns.
 */
function DeferredFieldDemo() {
    const [values] = useState({
        title: "Click to focus, Enter to edit",
        subtitle: "Type here, Escape to cancel",
        description: "Or blur to commit changes"
    });

    // const handleCommit = ... (Removed unused)

    return (
        <Zone
            id="deferred-field-demo"
            direction="v"
            className="space-y-3 bg-white p-4 rounded-lg border border-orange-100"
        >
            {/* Title Field */}
            <div>
                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Title</div>
                <Item id="deferred-title" asChild>
                    <Field
                        name="deferred-title"
                        mode="deferred"
                        value={values.title}
                        placeholder="Enter title..."
                        commitCommand={{ type: "DEMO_COMMIT", payload: { field: "title" } }}
                        className="w-full px-3 py-2 rounded border text-sm transition-all
                            data-[focused=true]:border-orange-300 data-[focused=true]:bg-orange-50/50
                            data-[editing=true]:border-orange-500 data-[editing=true]:bg-white data-[editing=true]:ring-2 data-[editing=true]:ring-orange-200"
                    />
                </Item>
            </div>

            {/* Subtitle Field */}
            <div>
                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Subtitle</div>
                <Item id="deferred-subtitle" asChild>
                    <Field
                        name="deferred-subtitle"
                        mode="deferred"
                        value={values.subtitle}
                        placeholder="Enter subtitle..."
                        className="w-full px-3 py-2 rounded border text-sm transition-all
                            data-[focused=true]:border-orange-300 data-[focused=true]:bg-orange-50/50
                            data-[editing=true]:border-orange-500 data-[editing=true]:bg-white data-[editing=true]:ring-2 data-[editing=true]:ring-orange-200"
                    />
                </Item>
            </div>

            {/* Instructions */}
            <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-100 mt-2 space-y-1">
                <div><kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">↑↓</kbd> Navigate when not editing</div>
                <div><kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Enter</kbd> Start/Commit editing</div>
                <div><kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">Esc</kbd> Cancel and restore</div>
            </div>
        </Zone>
    );
}
