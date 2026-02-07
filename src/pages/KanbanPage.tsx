import { Zone } from "@os/app/export/primitives/Zone";
import { KanbanPanel } from "@apps/kanban/widgets/KanbanPanel";

export default function KanbanPage() {
    return (
        <Zone id="kanban-main" area="main" role="toolbar" className="h-full">
            <KanbanPanel />
        </Zone>
    );
}
