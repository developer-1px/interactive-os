import { useTodoBotRoutes } from "@apps/todo/tests/TodoBot";
import "@apps/todo/tests/e2e-harness"; // Exposes __todo on window for Playwright
import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { OS } from "@os/AntigravityOS";

export default function TodoPage() {
  // TestBot scenarios for clipboard operations
  useTodoBotRoutes();

  return (
    <OS.Zone id="main" role="toolbar" className="h-full flex">
      {/* 1. Category Navigation (Isolated Component) */}
      <Sidebar />

      {/* 2. Main Work Area (Isolated Component) */}
      <TodoPanel />
    </OS.Zone>
  );
}
