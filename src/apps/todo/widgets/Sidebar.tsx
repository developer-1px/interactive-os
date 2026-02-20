/**
 * Sidebar — v5 native (createZone + bind).
 *
 * <TodoSidebar.Zone> with 0 bindings.
 */

import { TodoApp, TodoSidebar } from "@apps/todo/app";
import { Kbd } from "@inspector/shell/components/Kbd";
import { os } from "@os/kernel";
import { useSelection } from "@os/5-hooks/useSelection";
import {
  ArrowRight,
  Briefcase,
  CornerDownLeft,
  Inbox,
  MoveDown,
  MoveUp,
  User,
} from "lucide-react";
import { useEffect } from "react";

const getIcon = (id: string) => {
  switch (id) {
    case "cat_inbox":
      return <Inbox size={18} />;
    case "cat_work":
      return <Briefcase size={18} />;
    case "cat_personal":
      return <User size={18} />;
    default:
      return <Inbox size={18} />;
  }
};

export function Sidebar() {
  return (
    <TodoSidebar.Zone className="h-full">
      <SidebarContent />
    </TodoSidebar.Zone>
  );
}

// Extracted component to isolate category data subscription
function SidebarCategoryItem({ categoryId }: { categoryId: string }) {
  const category = TodoApp.useComputed((s) => s.data.categories[categoryId]);
  const selectedCategoryId = TodoApp.useComputed(
    (s) => s.ui.selectedCategoryId,
  );

  if (!category) return null;

  const isSelected = selectedCategoryId === category.id;

  return (
    <TodoSidebar.Item id={category.id} asChild>
      <TodoSidebar.triggers.SelectCategory
        payload={{
          id: category.id,
        }}
      >
        <div
          className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium outline-none ring-0 cursor-pointer transition-all duration-200 overflow-hidden
                            hover:bg-slate-100/80
                            data-[focused=true]:bg-indigo-50
                            data-[focused=true]:ring-2
                            data-[focused=true]:ring-indigo-400
                          `}
        >
          <span
            className={`transition-colors duration-200 ${isSelected ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
          >
            {getIcon(category.id)}
          </span>
          <span
            className={`transition-colors duration-200 ${isSelected ? "text-slate-900 font-semibold" : "text-slate-600 group-hover:text-slate-900"}`}
          >
            {category.text}
          </span>

          {isSelected && (
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-300" />
          )}
        </div>
      </TodoSidebar.triggers.SelectCategory>
    </TodoSidebar.Item>
  );
}

function SidebarContent() {
  const categoryOrder = TodoApp.useComputed((s) => s.data.categoryOrder);
  const selectedCategoryId = TodoApp.useComputed(
    (s) => s.ui.selectedCategoryId,
  );

  const selectionIds = useSelection("sidebar");
  const selectionId = selectionIds[0];

  useEffect(() => {
    if (selectionId && selectionId !== selectedCategoryId) {
      // Dispatch immediately to feel responsive
      os.dispatch(TodoSidebar.commands.selectCategory({ id: selectionId }));
    }
  }, [selectionId, selectedCategoryId]);

  return (
    <div className="w-72 flex flex-col h-full bg-[#FCFCFD] border-r border-slate-100 relative overflow-hidden">
      <div className="p-6 pb-2 z-10">
        <h1 className="font-bold text-slate-900 text-lg tracking-tight flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-indigo-600" />
          </div>
          <span className="opacity-100">Todo</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar z-10 space-y-1">
        <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-4 mb-2">
          Categories
        </div>
        {categoryOrder.map((categoryId) => (
          <SidebarCategoryItem key={categoryId} categoryId={categoryId} />
        ))}
      </div>

      <div className="p-6 mt-auto border-t border-slate-100 bg-slate-50/50 z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Navigation
          </span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="flex gap-0.5">
              <Kbd
                size="xs"
                variant="ghost"
                className="bg-white border border-slate-200 shadow-sm"
              >
                <MoveUp size={10} />
              </Kbd>
              <Kbd
                size="xs"
                variant="ghost"
                className="bg-white border border-slate-200 shadow-sm"
              >
                <MoveDown size={10} />
              </Kbd>
            </div>
            <span>Nav</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Kbd
              size="xs"
              variant="ghost"
              className="bg-white border border-slate-200 shadow-sm"
            >
              <CornerDownLeft size={10} />
            </Kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 col-span-2">
            <Kbd
              size="xs"
              variant="ghost"
              className="bg-white border border-slate-200 shadow-sm"
            >
              <ArrowRight size={10} />
            </Kbd>
            <span>Enter List</span>
          </div>
        </div>
      </div>
    </div>
  );
}
