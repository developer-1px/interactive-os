import { useTodoBotRoutes } from "@apps/todo/tests/TodoBot";
import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { Zone } from "@os/6-components/Zone.tsx";

export default function TodoPage() {
  // TestBot scenarios for clipboard operations
  useTodoBotRoutes();

  return (
    <Zone id="main" role="toolbar" className="h-full flex">
      {/* 1. Category Navigation (Isolated Component) */}
      <Sidebar />

      {/* 2. Main Work Area (Isolated Component) */}
      <TodoPanel />
    </Zone>
  );
}
