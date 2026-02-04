import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { Zone } from "@os/ui/Zone";
import { ClipboardManager } from "@apps/todo/features/clipboard/ClipboardManager";

export default function TodoPage() {
  return (
    <Zone id="main" area="main" role="toolbar">
      <ClipboardManager />

      {/* 1. Category Navigation (Isolated Component) */}
      <Sidebar />

      {/* 2. Main Work Area (Isolated Component) */}
      <TodoPanel />
    </Zone>
  );
}
