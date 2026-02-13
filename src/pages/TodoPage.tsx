import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { OS } from "@os/AntigravityOS";
// Playwright spec — vite-plugin shim transforms for browser replay
// @ts-expect-error
import runTodoSpec from "../../e2e/todo/todo.spec.ts";

export default function TodoPage() {
  usePlaywrightSpecs("pw-todo", [runTodoSpec]);

  return (
    <OS.Zone id="main" role="application" className="h-full flex">
      {/* 1. Category Navigation */}
      <Sidebar />

      {/* 2. Main Work Area */}
      <TodoPanel />
    </OS.Zone>
  );
}
