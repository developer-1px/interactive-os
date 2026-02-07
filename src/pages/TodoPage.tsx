import { ClipboardManager } from "@apps/todo/features/clipboard/ClipboardManager";
import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { Zone } from "@os/app/export/primitives/Zone.tsx";

export default function TodoPage() {
  return (
    <Zone id="main" role="toolbar" className="h-full">
      <ClipboardManager />

      {/* 1. Category Navigation (Isolated Component) */}
      <Sidebar />

      {/* 2. Main Work Area (Isolated Component) */}
      <TodoPanel />
    </Zone>
  );
}
