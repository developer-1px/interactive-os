import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { OS } from "@os/AntigravityOS";

// @ts-expect-error — spec-wrapper plugin transforms at build time
import runTodoSpec from "@/apps/todo/tests/e2e/todo.spec.ts";

export default function TodoPage() {
  usePlaywrightSpecs("todo", [runTodoSpec]);

  return (
    <OS.Zone id="main" role="application" className="h-full flex">
      {/* 1. Category Navigation */}
      <Sidebar />

      {/* 2. Main Work Area */}
      <TodoPanel />
    </OS.Zone>
  );
}
