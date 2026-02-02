import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";

export default function TodoPage() {
  return (
    <>
      {/* 1. Category Navigation (Isolated Component) */}
      <Sidebar />

      {/* 2. Main Work Area (Isolated Component) */}
      <TodoPanel />
    </>
  );
}
