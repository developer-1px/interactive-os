import { Item } from "@os/app/export/primitives/Item";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { Field } from "@os/app/export/primitives/Field";
import {
    StartEditCard,
    DeleteCard,
    SyncEditDraft,
    UpdateCardText,
    CancelEditCard,
} from "@apps/kanban/features/commands/card";
import { Check, CornerDownLeft, Trash2, Calendar, User, AlertTriangle, Flame, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { KanbanCard as KanbanCardType, KanbanLabel, Priority } from "@apps/kanban/model/appState";

interface KanbanCardProps {
    card: KanbanCardType;
    isEditing: boolean;
    editDraft: string;
    labels: Record<string, KanbanLabel>;
    isSelected?: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { icon: any; color: string; bg: string; label: string }> = {
    urgent: { icon: Flame, color: "text-red-500", bg: "bg-red-50 border-red-200", label: "Urgent" },
    high: { icon: ArrowUp, color: "text-orange-500", bg: "bg-orange-50 border-orange-200", label: "High" },
    medium: { icon: Minus, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200", label: "Medium" },
    low: { icon: ArrowDown, color: "text-blue-400", bg: "bg-blue-50 border-blue-200", label: "Low" },
    none: { icon: null, color: "", bg: "", label: "" },
};

export function KanbanCard({ card, isEditing, editDraft, labels, isSelected }: KanbanCardProps) {
    const priorityCfg = PRIORITY_CONFIG[card.priority];
    const PriorityIcon = priorityCfg.icon;

    const cardLabels = card.labels
        .map((lid) => labels[lid])
        .filter(Boolean);

    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

    return (
        <Item
            id={card.id}
            className={`
                group relative rounded-xl border transition-all cursor-pointer
                ${isEditing
                    ? "bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-lg"
                    : isSelected
                        ? "bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-400/30 shadow-md"
                        : "bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300"
                }
                outline-none
                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500 data-[focused=true]:border-transparent data-[focused=true]:shadow-lg data-[focused=true]:z-10
            `}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2.5 left-2.5 w-4 h-4 rounded-md bg-indigo-500 flex items-center justify-center z-10 shadow-sm">
                    <Check size={10} className="text-white" strokeWidth={3} />
                </div>
            )}
            {/* Priority Accent Bar */}
            {card.priority !== "none" && (
                <div
                    className="h-1 rounded-t-xl"
                    style={{ backgroundColor: card.priority === "urgent" ? "#ef4444" : card.priority === "high" ? "#f97316" : card.priority === "medium" ? "#eab308" : "#3b82f6" }}
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
                        className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 leading-snug placeholder:text-slate-400"
                        placeholder="Card title..."
                        blurOnInactive={true}
                    />
                ) : (
                    <p className="text-sm font-semibold text-slate-800 leading-snug select-none">
                        {card.title}
                    </p>
                )}

                {/* Description preview */}
                {!isEditing && card.description && (
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {card.description}
                    </p>
                )}

                {/* Footer: Metadata */}
                <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex items-center gap-2">
                        {/* Priority badge */}
                        {PriorityIcon && (
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${priorityCfg.bg}`}>
                                <PriorityIcon size={10} className={priorityCfg.color} />
                                <span className={priorityCfg.color}>{priorityCfg.label}</span>
                            </div>
                        )}

                        {/* Due date */}
                        {card.dueDate && (
                            <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isOverdue ? "bg-red-50 text-red-500 border border-red-200" : "text-slate-400"}`}>
                                <Calendar size={10} />
                                <span>{new Date(card.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Assignee */}
                        {card.assignee && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white" title={card.assignee}>
                                {card.assignee.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Actions */}
                <div className={`
                    absolute top-2 right-2 flex items-center gap-0.5 transition-all
                    ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}>
                    {!isEditing && (
                        <>
                            <Trigger onPress={StartEditCard({ id: card.id })} asChild>
                                <button className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit (Enter)">
                                    <CornerDownLeft size={12} />
                                </button>
                            </Trigger>
                            <Trigger onPress={DeleteCard({ id: card.id })} asChild>
                                <button className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                    <Trash2 size={12} />
                                </button>
                            </Trigger>
                        </>
                    )}
                </div>
            </div>
        </Item>
    );
}
