import {
  SetAssignee,
  SetDueDate,
  SetPriority,
  ToggleLabel,
} from "@apps/kanban/features/commands/card";
import {
  CloseCardDetail,
  UpdateCardDescription,
  UpdateCardTitle,
} from "@apps/kanban/features/commands/detail";
import type { KanbanState, Priority } from "@apps/kanban/model/appState";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { Zone } from "@os/app/export/primitives/Zone";
import { useEngine } from "@os/features/command/ui/CommandContext";
import { AlertTriangle, Calendar, Clock, Tag, User, X } from "lucide-react";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "urgent", label: "Urgent", color: "#ef4444" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "medium", label: "Medium", color: "#eab308" },
  { value: "low", label: "Low", color: "#3b82f6" },
  { value: "none", label: "None", color: "#94a3b8" },
];

export function CardDetailSheet() {
  const { state, dispatch } = useEngine<KanbanState>();
  if (!state?.ui.detailCardId) return null;

  const card = state.data.cards[state.ui.detailCardId];
  if (!card) return null;

  const allLabels = Object.values(state.data.labels);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <Trigger onPress={CloseCardDetail({})} asChild>
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] transition-opacity" />
      </Trigger>

      {/* Sheet Panel */}
      <Zone
        id="card-detail"
        role="dialog"
        className="relative w-[480px] max-w-full bg-kanban-surface shadow-float border-l border-slate-100 flex flex-col overflow-hidden animate-slide-in-right z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Card Detail
          </h2>
          <Trigger onPress={CloseCardDetail({})} asChild>
            <button
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              tabIndex={0}
            >
              <X size={16} />
            </button>
          </Trigger>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title — native input: Field uses contentEditable, not suitable for controlled <input> */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
              Title
            </label>
            {/* eslint-disable pipeline/no-handler-in-app -- Native <input> requires onChange */}
            <input
              value={card.title}
              onChange={(e) =>
                dispatch(
                  UpdateCardTitle({ id: card.id, title: e.target.value }),
                )
              }
              className="w-full text-lg font-bold text-slate-900 bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-400 pb-1 transition-colors"
              tabIndex={0}
            />
            {/* eslint-enable pipeline/no-handler-in-app */}
          </div>

          {/* Description — native textarea */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
              Description
            </label>
            {/* eslint-disable pipeline/no-handler-in-app -- Native <textarea> requires onChange */}
            <textarea
              value={card.description}
              onChange={(e) =>
                dispatch(
                  UpdateCardDescription({
                    id: card.id,
                    description: e.target.value,
                  }),
                )
              }
              placeholder="Add a description..."
              rows={4}
              className="w-full text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 p-3 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-300 resize-none transition-all"
              tabIndex={0}
            />
            {/* eslint-enable pipeline/no-handler-in-app */}
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={10} /> Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(({ value, label, color }) => (
                <Trigger
                  key={value}
                  onPress={SetPriority({ id: card.id, priority: value })}
                  asChild
                  allowPropagation
                >
                  <button
                    className={`
                                        px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                        ${
                                          card.priority === value
                                            ? "bg-white shadow-sm border-slate-300 ring-2 ring-offset-1"
                                            : "border-slate-200 hover:bg-slate-50"
                                        }
                                    `}
                    style={{
                      color,
                      ...(card.priority === value ? { ringColor: color } : {}),
                    }}
                    tabIndex={0}
                  >
                    {label}
                  </button>
                </Trigger>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <Tag size={10} /> Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {allLabels.map((label) => {
                const isActive = card.labels.includes(label.id);
                return (
                  <Trigger
                    key={label.id}
                    onPress={ToggleLabel({ id: card.id, labelId: label.id })}
                    asChild
                    allowPropagation
                  >
                    <button
                      className={`
                                            px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                            ${
                                              isActive
                                                ? "ring-2 ring-offset-1 shadow-sm"
                                                : "opacity-50 hover:opacity-80"
                                            }
                                        `}
                      style={{
                        color: label.color,
                        backgroundColor: `${label.color}12`,
                        borderColor: `${label.color}30`,
                        ...(isActive ? { ringColor: label.color } : {}),
                      }}
                      tabIndex={0}
                    >
                      {label.name}
                    </button>
                  </Trigger>
                );
              })}
            </div>
          </div>

          {/* Assignee — native input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User size={10} /> Assignee
            </label>
            {/* eslint-disable pipeline/no-handler-in-app -- Native <input> requires onChange */}
            <input
              value={card.assignee || ""}
              onChange={(e) =>
                dispatch(
                  SetAssignee({
                    id: card.id,
                    assignee: e.target.value || null,
                  }),
                )
              }
              placeholder="Assign to..."
              className="w-full text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all"
              tabIndex={0}
            />
            {/* eslint-enable pipeline/no-handler-in-app */}
          </div>

          {/* Due Date — native date input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar size={10} /> Due Date
            </label>
            {/* eslint-disable pipeline/no-handler-in-app -- Native date input requires onChange */}
            <input
              type="date"
              value={card.dueDate || ""}
              onChange={(e) =>
                dispatch(
                  SetDueDate({ id: card.id, dueDate: e.target.value || null }),
                )
              }
              className="w-full text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              tabIndex={0}
            />
            {/* eslint-enable pipeline/no-handler-in-app */}
          </div>

          {/* Metadata */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium">
              <Clock size={10} />
              Created{" "}
              {new Date(card.createdAt).toLocaleDateString("en", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Footer with keyboard hint */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-300 font-medium">
            Tab to navigate fields
          </span>
          <span className="text-[10px] text-slate-300 font-medium">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold">
              Esc
            </kbd>{" "}
            to close
          </span>
        </div>
      </Zone>
    </div>
  );
}
