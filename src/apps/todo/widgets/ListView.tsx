/**
 * ListView — v5 native (createZone + bind).
 *
 * <TodoList.Zone> with 0 bindings — all from zone.bind declaration.
 */

import { TodoApp, TodoDraft, TodoList } from "@apps/todo/app";
import { selectVisibleTodoIds } from "@apps/todo/selectors";
import { TaskItem } from "@apps/todo/widgets/TaskItem";
import { Field } from "@os/6-components/field/Field";
import { Plus } from "lucide-react";

export function ListView() {
  const visibleTodoIds = TodoApp.useComputed(selectVisibleTodoIds);
  const draft = TodoApp.useComputed((s) => s.ui.draft ?? "");

  return (
    <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden font-sans">
      {/* Zero manual bindings — TodoList.Zone has everything from zone.bind */}
      <TodoList.Zone className="flex flex-col h-full">
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full z-10 p-8 sm:p-12 pb-6">
          {/* Header */}
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Tasks
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Manage your daily priorities
            </p>
          </header>

          <div className="flex-1 overflow-y-auto space-y-2 px-2 custom-scrollbar">
            {/* Draft Field — pre-bound via TodoDraft.Field */}
            <Field.Label className="group flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-text border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 has-[[data-focused=true]]:border-solid has-[[data-focused=true]]:border-indigo-400 has-[[data-focused=true]]:bg-white has-[[data-focused=true]]:ring-2 has-[[data-focused=true]]:ring-indigo-400/30 has-[[data-anchor=true]]:border-solid has-[[data-anchor=true]]:border-slate-300 has-[[data-anchor=true]]:bg-white has-[[data-anchor=true]]:ring-1 has-[[data-anchor=true]]:ring-slate-200">
              <div className="text-slate-400 group-has-[[data-focused=true]]:text-indigo-500 group-has-[[data-anchor=true]]:text-slate-400 transition-colors">
                <Plus size={18} strokeWidth={2.5} />
              </div>
              <TodoDraft.Field
                name="DRAFT"
                value={draft}
                className="flex-1 bg-transparent outline-none text-slate-700 text-[15px] font-medium placeholder:text-slate-400"
                placeholder="Add a new task..."
              />
            </Field.Label>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />

            {/* Task Items */}
            <div className="space-y-2.5">
              {visibleTodoIds.map((id) => (
                <TaskItem key={id} todoId={id} />
              ))}
            </div>

            {visibleTodoIds.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl opacity-20">📝</span>
                </div>
                <h3 className="text-slate-900 font-semibold mb-1">
                  No tasks in this list
                </h3>
                <p className="text-slate-500 text-sm">
                  Create a new task to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </TodoList.Zone>
    </div>
  );
}
