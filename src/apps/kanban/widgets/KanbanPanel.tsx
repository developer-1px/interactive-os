import type { KanbanCard, KanbanState } from "@apps/kanban/model/appState";
import { Zone } from "@os/app/export/primitives/Zone";
import { useEngine } from "@os/features/command/ui/CommandContext";
import { BoardHeader } from "./BoardHeader";
import { BulkActionBar } from "./BulkActionBar";
import { CardActionMenu } from "./CardActionMenu";
import { CardDetailSheet } from "./CardDetailSheet";
import { ColumnView } from "./ColumnView";

export function KanbanPanel() {
  const { state } = useEngine<KanbanState>();
  if (!state?.data?.board) return null;

  const { columns = {}, cards = {}, cardOrder = {} } = state.data;
  const columnOrder = state.data.columnOrder ?? Object.keys(columns);
  const { searchQuery, priorityFilter, labelFilter } = state.ui;

  // Filter cards
  const filterCard = (card: KanbanCard): boolean => {
    if (
      searchQuery &&
      !card.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (priorityFilter && card.priority !== priorityFilter) {
      return false;
    }
    if (labelFilter && !card.labels.includes(labelFilter)) {
      return false;
    }
    return true;
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-kanban-bg overflow-hidden font-sans text-slate-900">
      <BoardHeader state={state} />

      {/* Board Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="h-full min-w-max p-6">
          {/* Top-Level Board Zone: Horizontal spatial navigation between columns */}
          <Zone
            id="kanban-board"
            role="group"
            options={{
              navigate: { entry: "restore", orientation: "horizontal" },
            }}
            className="flex gap-5 h-full"
          >
            {columnOrder.map((colId) => {
              const column = columns[colId];
              if (!column) return null;

              const colCardIds = cardOrder[colId] || [];
              const colCards = colCardIds
                .map((cid) => cards[cid])
                .filter(Boolean)
                .filter(filterCard);

              return (
                <ColumnView
                  key={colId}
                  column={column}
                  cards={colCards}
                  state={state}
                />
              );
            })}
          </Zone>
        </div>
      </div>

      {/* Phase 1: Keyboard Overlays */}
      <CardDetailSheet />
      <CardActionMenu />
      <BulkActionBar />
    </div>
  );
}
