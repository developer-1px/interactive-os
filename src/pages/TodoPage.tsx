import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { OS } from "@os/AntigravityOS";

export default function TodoPage() {
  return (
    <OS.Zone id="main" role="application" className="h-full flex">
      {/* 1. Category Navigation */}
      <Sidebar />

      {/* 2. Main Work Area */}
      <TodoPanel />
    </OS.Zone>
  );
}
