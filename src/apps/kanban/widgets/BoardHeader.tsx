import { AddColumn } from "@apps/kanban/features/commands/column";
import {
  ClearFilters,
  SetSearchQuery,
  ToggleLabelFilter,
  TogglePriorityFilter,
} from "@apps/kanban/features/commands/filter";
import type { KanbanState, Priority } from "@apps/kanban/model/appState";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { useEngine } from "@os/features/command/ui/CommandContext";
import {
  ArrowDown,
  ArrowUp,
  Filter,
  Flame,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";

interface BoardHeaderProps {
  state: KanbanState;
}

const PRIORITIES: {
  value: Priority;
  label: string;
  icon: any;
  color: string;
}[] = [
    { value: "urgent", label: "Urgent", icon: Flame, color: "#ef4444" },
    { value: "high", label: "High", icon: ArrowUp, color: "#f97316" },
    { value: "medium", label: "Medium", icon: Minus, color: "#eab308" },
    { value: "low", label: "Low", icon: ArrowDown, color: "#3b82f6" },
  ];

export function BoardHeader({ state }: BoardHeaderProps) {
  const { dispatch } = useEngine();
  const columnCount = state.data.columnOrder.length;
  const hasFilters =
    !!state.ui.searchQuery ||
    !!state.ui.priorityFilter ||
    !!state.ui.labelFilter;

  return (
    <div className="flex-none h-[72px] px-8 border-b border-slate-200/50 bg-kanban-surface z-20 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {state.data.board.title}
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {columnCount} Cols
            </span>
          </h1>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          {/* Add Column */}
          <Trigger onPress={AddColumn({})} asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 active:scale-[0.97]">
              <Plus size={14} strokeWidth={3} />
              <span>Column</span>
            </button>
          </Trigger>
        </div>
      </div>

      {/* Search + Filters Row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative group">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors"
          />
          {/* eslint-disable pipeline/no-handler-in-app -- Native <input> for search requires onChange */}
          <input
            type="text"
            value={state.ui.searchQuery}
            onChange={(e) =>
              dispatch(SetSearchQuery({ query: e.target.value }))
            }
            placeholder="Search..."
            className="w-48 pl-9 pr-4 py-1.5 text-xs font-medium bg-slate-100/50 hover:bg-slate-100 border border-transparent focus:bg-white focus:border-brand/20 rounded-md outline-none focus:ring-2 focus:ring-brand/10 text-slate-700 placeholder:text-slate-400 transition-all"
          />
          {/* eslint-enable pipeline/no-handler-in-app */}
          {state.ui.searchQuery && (
            <Trigger
              onPress={SetSearchQuery({ query: "" })}
              asChild
              allowPropagation
            >
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={12} />
              </button>
            </Trigger>
          )}
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-slate-300 mr-0.5" />
          {PRIORITIES.map(({ value, label, icon: Icon, color }) => (
            <Trigger
              key={value}
              onPress={TogglePriorityFilter({ priority: value })}
              asChild
              allowPropagation
            >
              <button
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
            </Trigger>
          ))}
        </div>

        {/* Label Filters */}
        <div className="flex items-center gap-1.5">
          {Object.values(state.data.labels).map((label) => (
            <Trigger
              key={label.id}
              onPress={ToggleLabelFilter({ labelId: label.id })}
              asChild
              allowPropagation
            >
              <button
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
            </Trigger>
          ))}
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Trigger onPress={ClearFilters({})} asChild allowPropagation>
            <button className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <X size={10} />
              Clear
            </button>
          </Trigger>
        )}
      </div>
    </div>
  );
}
