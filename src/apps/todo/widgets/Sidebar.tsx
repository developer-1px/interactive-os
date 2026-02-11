import { RedoCommand, UndoCommand } from "@apps/todo/features/commands/history";
import { SelectCategory } from "@apps/todo/features/commands/MoveCategoryUp";
import { Kbd } from "@inspector/shell/components/Kbd";
import { Item } from "@os/6-components/Item";
import { Trigger } from "@os/6-components/Trigger";
import { Zone } from "@os/6-components/Zone";
import { todoSlice } from "@apps/todo/app";
import {
  ArrowRight,
  Briefcase,
  CornerDownLeft,
  Inbox,
  MoveDown,
  MoveUp,
  User,
} from "lucide-react";

export function Sidebar() {
  return (
    <Zone
      id="sidebar"
      role="listbox"
      options={{
        navigate: { entry: "restore" },
      }}
      onAction={SelectCategory({ id: undefined })}
      onUndo={UndoCommand()}
      onRedo={RedoCommand()}
      // onSelect={SelectCategory({})} // Space is handled by onAction alias if needed, or separate command
      style={{ flex: "none" }}
      className="h-full"
    >
      <SidebarContent />
    </Zone>
  );
}

function SidebarContent() {
  const state = todoSlice.useComputed((s) => s);

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
        {(state.data.categoryOrder ?? []).map((categoryId) => {
          const category = state.data.categories?.[categoryId];
          if (!category) return null;

          return (
            <Item key={category.id} id={category.id} asChild>
              <Trigger onPress={SelectCategory({ id: category.id })} asChild>
                <div
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium outline-none ring-0 cursor-pointer transition-all duration-200 overflow-hidden
                                  hover:bg-slate-100/80
                                  data-[focused=true]:bg-indigo-50
                                  data-[focused=true]:ring-1
                                  data-[focused=true]:ring-indigo-200
                              `}
                >
                  <span
                    className={`transition-colors duration-200 ${state.ui.selectedCategoryId === category.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    {getIcon(category.id)}
                  </span>
                  <span
                    className={`transition-colors duration-200 ${state.ui.selectedCategoryId === category.id ? "text-slate-900 font-semibold" : "text-slate-600 group-hover:text-slate-900"}`}
                  >
                    {category.text}
                  </span>

                  {/* Selection Indicator */}
                  {state.ui.selectedCategoryId === category.id && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-300" />
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
