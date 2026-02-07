import {
  CancelEditCard,
  SyncEditDraft,
  UpdateCardText,
} from "@apps/kanban/features/commands/card";
import type {
  KanbanCard as KanbanCardType,
  KanbanLabel,
} from "@apps/kanban/model/appState";
import { Field } from "@os/app/export/primitives/Field";
import { Item } from "@os/app/export/primitives/Item";
import {
  Calendar,
  Check,
} from "lucide-react";

interface KanbanCardProps {
  card: KanbanCardType;
  isEditing: boolean;
  editDraft: string;
  labels: Record<string, KanbanLabel>;
  isSelected?: boolean;
}



export function KanbanCard({
  card,
  isEditing,
  editDraft,
  labels,
  isSelected,
}: KanbanCardProps) {

  const cardLabels = card.labels.map((lid) => labels[lid]).filter(Boolean);

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <Item
      id={card.id}
      className={`
                group relative rounded-lg transition-all duration-200 cursor-pointer overflow-visible
                ${isEditing
          ? "bg-kanban-surface ring-2 ring-brand ring-offset-1 shadow-float z-20"
          : isSelected
            ? "bg-brand/5 ring-1 ring-brand/40 shadow-sm"
            : "bg-kanban-surface shadow-card hover:shadow-card-hover hover:-translate-y-[1px]"
        }
                outline-none
                data-[focused=true]:ring-2 data-[focused=true]:ring-brand data-[focused=true]:ring-offset-1 data-[focused=true]:z-10
            `}
    >
      {/* Selection Indicator (Subtle) */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-brand flex items-center justify-center z-10 shadow-sm animate-scale-in">
          <Check size={10} className="text-white" strokeWidth={3} />
        </div>
      )}

      {/* Priority Indicator (Left Border) - Minimalist */}
      {card.priority !== "none" && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md opacity-60"
          style={{
            backgroundColor:
              card.priority === "urgent"
                ? "#ef4444"
                : card.priority === "high"
                  ? "#f97316"
                  : card.priority === "medium"
                    ? "#eab308"
                    : "#3b82f6",
          }}
        />
      )}

      <div className="p-3.5">
        {/* Labels Row */}
        {cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {cardLabels.map((label) => (
              <span
                key={label.id}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${label.color}18`,
                  color: label.color,
                  border: `1px solid ${label.color}30`,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        {isEditing ? (
          <Field
            name="EDIT"
            value={editDraft}
            autoFocus
            onChange={SyncEditDraft}
            onSubmit={UpdateCardText}
            onCancel={CancelEditCard({})}
            className="w-full bg-transparent outline-none text-[13px] font-medium text-slate-900 leading-snug placeholder:text-slate-400"
            placeholder="Card title..."
            blurOnInactive={true}
          />
        ) : (
          <p
            className={`text-[13px] font-medium text-slate-900 leading-snug select-none ${card.priority === "urgent" ? "text-red-900" : ""}`}
          >
            {card.title}
          </p>
        )}

        {/* Description preview */}
        {!isEditing && card.description && (
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed tracking-normal opacity-80">
            {card.description}
          </p>
        )}

        {/* Footer: Metadata (Simplified) */}
        <div className="flex items-center justify-between mt-3 gap-2 min-h-[20px]">
          <div className="flex items-center gap-2">
            {/* Due date */}
            {card.dueDate && (
              <div
                className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isOverdue ? "bg-red-50 text-red-600" : "text-slate-400 bg-slate-50"}`}
              >
                <Calendar size={10} />
                <span>
                  {new Date(card.dueDate).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Labels (Dot style) */}
            {cardLabels.length > 0 && (
              <div className="flex -space-x-1">
                {cardLabels.map((l) => (
                  <div
                    key={l.id}
                    className="w-2 h-2 rounded-full ring-1 ring-white"
                    style={{ backgroundColor: l.color }}
                    title={l.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            {/* Assignee */}
            {card.assignee && (
              <div
                className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 ring-2 ring-white border border-slate-200"
                title={card.assignee}
              >
                {card.assignee.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </Item>
  );
}
