/**
 * TodoPanel — v5 native layout.
 */

import { TodoApp } from "@apps/todo/app";
import { ListView } from "@apps/todo/widgets/ListView";
import { TodoToolbarView } from "@apps/todo/widgets/TodoToolbar";

export function TodoPanel() {
  const ui = TodoApp.useComputed((s) => s?.ui);

  if (!ui) return null;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <TodoToolbarView />
      <div className="flex-1 overflow-hidden relative">
        <ListView />
      </div>
    </div>
  );
}
