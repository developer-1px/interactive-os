import {
  AddCard,
  DeleteCard,
  StartEditCard,
  SyncDraft,
} from "@apps/kanban/features/commands/card";
import {
  CopyCard,
  CutCard,
  PasteCard,
} from "@apps/kanban/features/commands/clipboard";
import {
  CancelEditColumn,
  RenameColumn,
  StartEditColumn,
  SyncColumnDraft,
  ToggleColumnCollapse,
} from "@apps/kanban/features/commands/column";
import type {
  KanbanCard as CardType,
  KanbanColumn,
  KanbanState,
} from "@apps/kanban/model/appState";
import { Field } from "@os/app/export/primitives/Field";
import { Item } from "@os/app/export/primitives/Item";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { Zone } from "@os/app/export/primitives/Zone";
import { OS } from "@os/features/AntigravityOS";
import { useEngine } from "@os/features/command/ui/CommandContext";
import { AlertCircle, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { KanbanCard } from "./KanbanCard";

interface ColumnViewProps {
  column: KanbanColumn;
  cards: CardType[];
  state: KanbanState;
}

export function ColumnView({ column, cards, state }: ColumnViewProps) {
  const { dispatch } = useEngine();
  const isEditing = state.ui.editingColumnId === column.id;
  const draftText = state.ui.drafts[column.id] || "";
  const isOverWip = column.wipLimit !== null && cards.length > column.wipLimit;
  const isAtWip = column.wipLimit !== null && cards.length === column.wipLimit;

  return (
    <div
      className={`
                w-[300px] flex-shrink-0 flex flex-col max-h-full transition-all duration-300
                ${
                  column.collapsed
                    ? "w-10 cursor-pointer items-center py-4 bg-slate-50/50 hover:bg-slate-100 rounded-xl"
                    : "bg-transparent"
                }
                ${state.ui.editingColumnId === column.id ? "ring-2 ring-brand ring-offset-2 rounded-xl" : ""}
            `}
    >
      {/* Column Header */}
      <div
        className={`
                    p-3.5 border-b flex items-center gap-2.5 rounded-t-2xl transition-colors cursor-pointer select-none
                    ${isOverWip ? "border-red-100 bg-red-50/50" : "border-slate-100 bg-white/80"}
                `}
      >
        {/* Collapse Toggle */}
        <Trigger onPress={ToggleColumnCollapse({ id: column.id })} asChild>
          <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 -ml-0.5">
            {column.collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </Trigger>

        {/* Color Dot + Title */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white"
          style={{ backgroundColor: column.color }}
        />

        {isEditing ? (
          <input
            autoFocus
            value={state.ui.columnEditDraft}
            onChange={(e) => {
              dispatch(SyncColumnDraft({ text: e.target.value }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") dispatch(RenameColumn({}));
              if (e.key === "Escape") dispatch(CancelEditColumn({}));
            }}
            onBlur={() => {
              dispatch(RenameColumn({}));
            }}
            className="flex-1 text-xs font-bold uppercase tracking-wider bg-transparent outline-none border-b-2 border-indigo-400 text-slate-700 py-0.5"
          />
        ) : (
          <h3
            className="flex-1 font-bold text-xs uppercase tracking-wider text-slate-500 truncate"
            onDoubleClick={() => {
              dispatch(StartEditColumn({ id: column.id }));
            }}
          >
            {column.title}
          </h3>
        )}

        {/* Card Count + WIP */}
        <div className="flex items-center gap-1.5">
          {isOverWip && <AlertCircle size={12} className="text-red-400" />}
          <span
            className={`
                            text-[10px] font-bold px-2 py-0.5 rounded-md
                            ${
                              isOverWip
                                ? "bg-red-100 text-red-600 border border-red-200"
                                : isAtWip
                                  ? "bg-amber-100 text-amber-600 border border-amber-200"
                                  : "bg-white border border-slate-200 text-slate-400"
                            }
                        `}
          >
            {cards.length}
            {column.wipLimit !== null ? `/${column.wipLimit}` : ""}
          </span>
        </div>
      </div>

      {/* Collapsed State */}
      {column.collapsed ? (
        <div className="flex-1 flex items-center justify-center p-2">
          <span
            className="text-xs font-bold text-slate-400 uppercase tracking-widest"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {column.title}
          </span>
        </div>
      ) : (
        <>
          {/* Card List Zone */}
          <Zone
            id={`col-${column.id}`}
            role="listbox"
            options={{
              navigate: { orientation: "vertical", entry: "restore" },
            }}
            onAction={StartEditCard({ id: OS.FOCUS })}
            onDelete={DeleteCard({ id: OS.FOCUS })}
            onCopy={CopyCard({ id: OS.FOCUS })}
            onCut={CutCard({ id: OS.FOCUS })}
            onPaste={PasteCard({ id: OS.FOCUS })}
            className="flex-1 px-3 py-3 space-y-3 overflow-y-auto custom-scrollbar min-h-[80px] outline-none"
          >
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                isEditing={state.ui.editingCardId === card.id}
                editDraft={state.ui.editDraft}
                labels={state.data.labels}
                isSelected={state.ui.selectedCardIds?.includes(card.id)}
              />
            ))}

            {/* Draft Card Input */}
            <Item
              id={`DRAFT-${column.id}`}
              className={`
                                rounded-xl border-2 border-dashed transition-all outline-none
                                ${
                                  draftText
                                    ? "border-indigo-300 bg-indigo-50/30"
                                    : "border-slate-200/60 hover:border-slate-300 bg-transparent"
                                }
                                data-[focused=true]:border-indigo-400 data-[focused=true]:bg-indigo-50/50 data-[focused=true]:ring-1 data-[focused=true]:ring-indigo-500/20
                            `}
            >
              <div className="p-3 flex items-center gap-2.5">
                <Plus size={14} className="text-slate-300 flex-shrink-0" />
                <Field
                  name={`DRAFT-${column.id}`}
                  value={draftText}
                  onChange={
                    ((p: any) =>
                      SyncDraft({ columnId: column.id, text: p.text })) as any
                  }
                  onSubmit={
                    ((p: any) =>
                      AddCard({ columnId: column.id, text: p.text })) as any
                  }
                  className="flex-1 bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-300 font-medium"
                  placeholder="Add a card..."
                />
              </div>
            </Item>

            {/* Empty State */}
            {cards.length === 0 && !draftText && (
              <div className="h-20 flex flex-col items-center justify-center text-slate-300 gap-1.5 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  No Cards
                </span>
              </div>
            )}
          </Zone>
        </>
      )}
    </div>
  );
}
