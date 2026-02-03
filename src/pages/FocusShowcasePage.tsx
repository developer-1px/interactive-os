import React, { useState, useEffect } from "react";
import { Zone } from "@os/ui/Zone";
import { Item } from "@os/ui/Item";
import { Field } from "@os/ui/Field";
import { Layers, MousePointerClick, Calendar, Type } from "lucide-react";
import { useFocusStore } from "@os/core/focus";

/**
 * FocusShowcasePage
 * 
 * Demonstrates the "Macro vs Micro" navigation architecture.
 * 
 * 1. Macro: OS_NAVIGATE (Zone-to-Zone, Item-to-Item)
 * 2. Micro: Widget Key Traps (Autocomplete, Grid, etc.)
 */
export default function FocusShowcasePage() {
    useEffect(() => {
        // Initialize Focus for Spatial Navigation
        useFocusStore.getState().setFocus("macro-1");
    }, []);

    return (
        <div className="flex h-full bg-slate-50">
            {/* Sidebar Context */}
            <Zone id="showcase-sidebar" layout="column" className="w-64 border-r border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Focus Lab</h2>
                <div className="space-y-4">
                    <SectionLink title="Macro Flow" icon={<Layers size={18} />} active />
                    <SectionLink title="Micro Trap" icon={<MousePointerClick size={18} />} />
                    <SectionLink title="Spatial Grid" icon={<Calendar size={18} />} />
                </div>
            </Zone>

            {/* Main Sandbox */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Zone id="showcase-main" layout="column" className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <div className="max-w-2xl mx-auto w-full space-y-12">

                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Navigation Architectures</h1>
                            <p className="text-slate-500">
                                Interactive verification of the "Event Trap" policy.
                                Move Up/Down. Notice how Widgets consume events when active.
                            </p>
                        </header>

                        {/* SCENARIO 1: MACRO LIST */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Macro Navigation</h3>
                                    <p className="text-xs text-slate-500">Standard OS_NAVIGATE bubbling</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 space-y-2">
                                <SimpleItem id="macro-1" label="First Item" placeholder="Press Down..." />
                                <SimpleItem id="macro-2" label="Second Item" placeholder="Keep going..." />
                                <SimpleItem id="macro-3" label="Third Item" placeholder="Press Up..." />
                            </div>
                        </section>

                        {/* SCENARIO 2: AUTOCOMPLETE TRAP */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <Type size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Micro Trap (Autocomplete)</h3>
                                    <p className="text-xs text-slate-500">Type '@' to trigger popup. Keys are trapped.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <AutocompleteWidget id="micro-autocomplete" />
                            </div>
                        </section>

                        {/* SCENARIO 3: SPATIAL GRID */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Spatial Trap (Grid)</h3>
                                    <p className="text-xs text-slate-500">Toggle grid. Arrow keys move inside grid.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <DateGridWidget id="micro-grid" />
                            </div>
                        </section>

                    </div>
                </Zone>
            </div>
        </div>
    );
}

// --- Componets ---

function SectionLink({ title, icon, active }: { title: string; icon: React.ReactNode; active?: boolean }) {
    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${active ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}>
            {icon}
            <span>{title}</span>
        </div>
    );
}

function SimpleItem({ id, label, placeholder }: { id: string; label: string; placeholder: string }) {
    return (
        <Item
            id={id}
            className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:bg-indigo-50/10 transition-all"
        >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-mono">
                {label[0]}
            </div>
            <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-0.5">{label}</label>
                <Field
                    name={id}
                    value=""
                    placeholder={placeholder}
                    className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                    blurOnInactive={true}
                />
            </div>
        </Item>
    );
}

// --- WIDGETS WITH TRAP LOGIC ---

function AutocompleteWidget({ id }: { id: string }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const suggestions = ["@User1", "@User2", "@Team", "@Channel"];
    const filtered = suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()));

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // TRIGGER CONDITION
        if (!open && e.key === "@") {
            setOpen(true);
            setQuery("");
            return;
        }

        if (open) {
            if (e.key === "ArrowDown") {
                e.stopPropagation(); // TRAP
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filtered.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.stopPropagation(); // TRAP
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
                return;
            }
            if (e.key === "Enter") {
                e.stopPropagation(); // TRAP
                e.preventDefault();
                // Select logic here
                setOpen(false);
                return;
            }
            if (e.key === "Escape") {
                e.stopPropagation(); // TRAP
                setOpen(false);
                return;
            }
        }
    };

    return (
        <Item id={id} className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Mentions Input</label>
            <div className="relative">
                <Field
                    name={id}
                    value="" // Controlled in real app
                    placeholder="Type '@' to mention..."
                    className="w-full p-3 rounded-lg border border-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    onKeyDown={handleKeyDown}
                    blurOnInactive={true}
                />

                {/* POPUP OVERLAY */}
                {open && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500">
                            SUGGESTIONS
                        </div>
                        <div>
                            {filtered.map((item, idx) => (
                                <div key={item}
                                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${idx === selectedIndex ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                                        }`}>
                                    <span>{item}</span>
                                    {idx === selectedIndex && <span className="text-[10px] bg-indigo-200 text-indigo-700 px-1.5 rounded">⏎</span>}
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="px-4 py-3 text-sm text-slate-400 italic">No matches</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-2 text-xs text-slate-400">
                Status: {open ? <span className="text-emerald-500 font-bold">TRAPPING</span> : "PASS-THROUGH"}
            </div>
        </Item>
    );
}

function DateGridWidget({ id }: { id: string }) {
    const [open, setOpen] = useState(false);
    const [activeCell, setActiveCell] = useState(0); // 0-11 for 12 months/days example

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !open) {
            setOpen(true);
            e.stopPropagation(); // Don't submit form if inside one
            return;
        }

        if (open) {
            // SPATIAL TRAP
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.stopPropagation();
                e.preventDefault();

                if (e.key === "ArrowRight") setActiveCell(p => (p + 1) % 12);
                if (e.key === "ArrowLeft") setActiveCell(p => (p - 1 + 12) % 12);
                if (e.key === "ArrowDown") setActiveCell(p => Math.min(p + 3, 11)); // Grid logic (3 cols)
                if (e.key === "ArrowUp") setActiveCell(p => Math.max(p - 3, 0));
                return;
            }

            if (e.key === "Enter") {
                e.stopPropagation();
                setOpen(false);
                return;
            }

            if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
                return;
            }
        }
    };

    return (
        <Item id={id} className="group">
            <label className="block text-sm font-medium text-slate-700 mb-2">Date Picker</label>
            <div
                tabIndex={0} // Make focusable container
                className={`w-full p-3 rounded-lg border outline-none transition-all cursor-pointer flex items-center justify-between ${open ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-300 hover:border-slate-400"
                    }`}
                onKeyDown={handleKeyDown}
                onClick={() => setOpen(!open)}
            >
                <span className="text-slate-700">{open ? "Select a valid date..." : "Click or Enter to open"}</span>
                <Calendar size={16} className="text-slate-400" />
            </div>

            {open && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className={`
                  h-10 rounded flex items-center justify-center text-sm font-medium transition-all
                  ${activeCell === i
                                    ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                                    : "bg-white text-slate-600 border border-slate-200"}
                `}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 text-center text-xs text-slate-400">
                        Use Arrow Keys to Navigate Grid
                    </div>
                </div>
            )}
        </Item>
    );
}
