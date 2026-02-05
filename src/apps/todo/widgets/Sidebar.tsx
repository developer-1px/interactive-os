import { Zone } from "@os/app/export/primitives/Zone.tsx";
import { Item } from "@os/app/export/primitives/Item.tsx";
import { Trigger } from "@os/app/export/primitives/Trigger.tsx";
import { Kbd } from "@os/app/debug/components/Kbd";
import { useFocusGroupStore } from "@os/features/focus/primitives/FocusGroup"; // [NEW] Local Hook
import { useEngine } from "@os/features/command/ui/CommandContext";
import type { AppState } from "@apps/todo/model/types";
import { SelectCategory } from "@apps/todo/features/commands/MoveCategoryUp";
import {
  Inbox,
  Briefcase,
  User,
  Layout,
  MoveUp,
  MoveDown,
  CornerDownLeft,
  ArrowRight,
} from "lucide-react";

export function Sidebar() {
  return (
    <Zone
      id="sidebar"
      area="nav"
      role="listbox"
      navigate={{ entry: "restore" }}
      style={{ flex: "none" }}
    >
      <SidebarContent />
    </Zone>
  );
}

function SidebarContent() {
  const { state, dispatch } = useEngine<AppState>();
  // Now we can use the local store hook because we are inside the Zone context
  const store = useFocusGroupStore();
  const focusedItemId = store((s) => s.focusedItemId);

  if (!state || !state.data) return null;

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

  return (
    <div className="w-72 flex flex-col h-full bg-[#FCFCFD] border-r border-slate-100 relative overflow-hidden">
      <div className="p-8 pb-4 z-10">
        <h1 className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Layout size={16} className="text-white" />
          </div>
          <span className="opacity-90">Todo App</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar z-10 space-y-1">
        <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-4 mb-2">
          Categories
        </div>
        {state.data.categoryOrder.map((categoryId) => {
          const category = state.data.categories[categoryId];
          if (!category) return null;

          return (
            <Item
              key={category.id}
              id={category.id}
              asChild
            >
              <Trigger
                command={SelectCategory({ id: category.id })}
                asChild
                onMouseMove={() => {
                  if (focusedItemId !== category.id) {
                    dispatch({
                      type: "OS_FOCUS",
                      payload: {
                        id: category.id,
                        sourceId: "sidebar"
                      }
                    });
                  }
                }}
              >
                <div
                  className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold outline-none ring-0 cursor-pointer transition-colors duration-200 overflow-hidden
                                hover:bg-slate-100
                                data-[focused=true]:bg-indigo-50/50
                                before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-indigo-600 before:rounded-r-full before:opacity-0 data-[focused=true]:before:opacity-100 before:transition-opacity
                            `}
                >
                  <span
                    className={`transition-colors duration-200 ${state.ui.selectedCategoryId === category.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    {getIcon(category.id)}
                  </span>
                  <span
                    className={`transition-colors duration-200 ${state.ui.selectedCategoryId === category.id ? "text-slate-900 font-bold" : "text-slate-500 group-hover:text-slate-800"}`}
                  >
                    {category.text}
                  </span>

                  {/* Selection Indicator */}
                  {state.ui.selectedCategoryId === category.id && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </div>
              </Trigger>
            </Item>
          );
        })}
      </div>

      <div className="p-6 mt-auto border-t border-slate-100 bg-slate-50/50 z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Navigation
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Kbd size="xs" variant="ghost" className="bg-white border border-slate-200">
              <MoveUp size={10} />
            </Kbd>
            <Kbd size="xs" variant="ghost" className="bg-white border border-slate-200">
              <MoveDown size={10} />
            </Kbd>
            <span>Nav</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Kbd size="xs" variant="ghost" className="bg-white border border-slate-200">
              <CornerDownLeft size={10} />
            </Kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Kbd size="xs" variant="ghost" className="bg-white border border-slate-200">
              <ArrowRight size={10} />
            </Kbd>
            <span>Focus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
