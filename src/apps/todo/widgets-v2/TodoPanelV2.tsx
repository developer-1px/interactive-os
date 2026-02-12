/**
 * TodoPanelV2 — TodoModule-based version.
 */

import { TodoModule } from "@apps/todo/module";
import { ListViewV2 } from "@apps/todo/widgets-v2/ListViewV2";
import { TodoToolbarV2 } from "@apps/todo/widgets-v2/TodoToolbarV2";

export function TodoPanelV2() {
  const state = TodoModule.useComputed((s) => s);

  if (!state || !state.ui) return null;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <TodoToolbarV2 />
      <div className="flex-1 overflow-hidden relative">
        <ListViewV2 />
      </div>
    </div>
  );
}
