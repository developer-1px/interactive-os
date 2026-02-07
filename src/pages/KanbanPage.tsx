import { KanbanPanel } from "@apps/kanban/widgets/KanbanPanel";
import { Zone } from "@os/app/export/primitives/Zone";

export default function KanbanPage() {
  return (
    <Zone id="kanban-main" role="toolbar" className="h-full">
      <KanbanPanel />
    </Zone>
  );
}
