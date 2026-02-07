import { Trigger } from "@os/app/export/primitives/Trigger";
import { useEngine } from "@os/features/command/ui/CommandContext";
import { AddColumn } from "@apps/kanban/features/commands/column";
import { SetSearchQuery, ClearFilters, TogglePriorityFilter, ToggleLabelFilter } from "@apps/kanban/features/commands/filter";
import { Plus, Search, X, Filter, Flame, ArrowUp, Minus, ArrowDown } from "lucide-react";
import type { KanbanState, Priority } from "@apps/kanban/model/appState";

interface BoardHeaderProps {
    state: KanbanState;
}

const PRIORITIES: { value: Priority; label: string; icon: any; color: string }[] = [
    { value: "urgent", label: "Urgent", icon: Flame, color: "#ef4444" },
    { value: "high", label: "High", icon: ArrowUp, color: "#f97316" },
    { value: "medium", label: "Medium", icon: Minus, color: "#eab308" },
    { value: "low", label: "Low", icon: ArrowDown, color: "#3b82f6" },
];

export function BoardHeader({ state }: BoardHeaderProps) {
    const { dispatch } = useEngine();
    const totalCards = Object.keys(state.data.cards).length;
    const columnCount = state.data.columnOrder.length;
    const hasFilters = !!state.ui.searchQuery || !!state.ui.priorityFilter || !!state.ui.labelFilter;

    return (
        <div className="px-8 pt-6 pb-4 flex-none border-b border-slate-200/60 bg-white/90 backdrop-blur-sm z-20">
            <div className="max-w-[2000px] mx-auto w-full">
                {/* Title Row */}
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            {state.data.board.title}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {columnCount} columns · {totalCards} cards
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Add Column */}
                        <Trigger onPress={AddColumn({})} asChild>
                            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 active:scale-[0.97]">
                                <Plus size={14} strokeWidth={3} />
                                <span>Column</span>
                            </button>
                        </Trigger>
                    </div>
                </div>

                {/* Search + Filters Row */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                            type="text"
                            value={state.ui.searchQuery}
                            onChange={(e) => dispatch(SetSearchQuery({ query: e.target.value }))}
                            placeholder="Search cards..."
                            className="w-full pl-8 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 text-slate-600 placeholder:text-slate-300 transition-all"
                        />
                        {state.ui.searchQuery && (
                            <button
                                onClick={() => dispatch(SetSearchQuery({ query: "" }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Priority Filters */}
                    <div className="flex items-center gap-1.5">
                        <Filter size={12} className="text-slate-300 mr-0.5" />
                        {PRIORITIES.map(({ value, label, icon: Icon, color }) => (
                            <button
                                key={value}
                                onClick={() => dispatch(TogglePriorityFilter({ priority: value }))}
                                className={`
                                    flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border
                                    ${state.ui.priorityFilter === value
                                        ? "bg-white shadow-sm border-slate-300 text-slate-700"
                                        : "border-transparent text-slate-400 hover:text-slate-500 hover:bg-slate-50"
                                    }
                                `}
                            >
                                <Icon size={10} style={{ color }} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Label Filters */}
                    <div className="flex items-center gap-1.5">
                        {Object.values(state.data.labels).map((label) => (
                            <button
                                key={label.id}
                                onClick={() => dispatch(ToggleLabelFilter({ labelId: label.id }))}
                                className={`
                                    px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border
                                    ${state.ui.labelFilter === label.id
                                        ? "bg-white shadow-sm border-slate-300"
                                        : "border-transparent hover:bg-slate-50"
                                    }
                                `}
                                style={{ color: label.color }}
                            >
                                {label.name}
                            </button>
                        ))}
                    </div>

                    {/* Clear Filters */}
                    {hasFilters && (
                        <button
                            onClick={() => dispatch(ClearFilters({}))}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X size={10} />
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
