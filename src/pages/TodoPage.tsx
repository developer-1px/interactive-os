import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { Zone } from "@os/6-components/primitives/Zone";

// @ts-expect-error — spec-wrapper plugin transforms at build time
import runTodoSpec from "@/apps/todo/tests/e2e/todo.spec.ts";

// Integration tests — vitest shim captures describe/test into registry
import "@os/3-commands/tests/apg/listbox.apg.test";
import "@os/3-commands/tests/apg/grid.apg.test";
import "@os/3-commands/tests/integration/navigate.test";
import "@os/3-commands/tests/integration/focus.test";

export default function TodoPage() {
  usePlaywrightSpecs("todo", [runTodoSpec]);

  return (
    <Zone id="main" role="application" className="h-full flex">
      {/* 1. Category Navigation */}
      <Sidebar />

      {/* 2. Main Work Area */}
      <TodoPanel />
    </Zone>
  );
}
