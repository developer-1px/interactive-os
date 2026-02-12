/**
 * TodoPageV2 — createModule-based Todo page.
 * Uses only TodoModule (no todoSlice, no distributed commands).
 */

import { SidebarV2 } from "@apps/todo/widgets-v2/SidebarV2";
import { TodoPanelV2 } from "@apps/todo/widgets-v2/TodoPanelV2";
import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { OS } from "@os/AntigravityOS";
// Playwright spec — vite-plugin shim transforms for browser replay
// @ts-expect-error
import runTodoSpec from "../../e2e/todo/todo.spec.ts";

export default function TodoPageV2() {
  usePlaywrightSpecs("pw-todo-v2", [runTodoSpec]);

  return (
    <OS.Zone id="main" role="toolbar" className="h-full flex">
      <SidebarV2 />
      <TodoPanelV2 />
    </OS.Zone>
  );
}
