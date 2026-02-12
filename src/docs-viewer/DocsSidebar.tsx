import clsx from "clsx";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { cleanLabel, type DocItem } from "./docsUtils";

interface DocsSidebarProps {
  items: DocItem[];
  activePath: string | undefined;
  onSelect: (path: string) => void;
}

const SidebarItem = ({
  item,
  level = 0,
  index,
  activePath,
  onSelect,
}: {
  item: DocItem;
  level?: number;
  index?: number | undefined;
  activePath: string | undefined;
  onSelect: (path: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand if a child is active
  useEffect(() => {
    if (item.type === "folder" && item.children) {
      const hasActiveChild = (children: DocItem[]): boolean => {
        return children.some(
          (child) =>
            (child.type === "file" && child.path === activePath) ||
            (child.type === "folder" &&
              child.children &&
              hasActiveChild(child.children)),
        );
      };
      if (hasActiveChild(item.children)) {
        setIsOpen(true);
      }
    }
  }, [activePath, item]);

  // Folder render
  if (item.type === "folder") {
    if (level === 0) {
      return (
        <div className="mb-6">
          <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {cleanLabel(item.name)}
          </h3>
          <div className="flex flex-col">
            {item.children?.map((child, i) => (
              <SidebarItem
                key={child.path}
                item={child}
                level={level + 1}
                index={child.type === "file" ? i + 1 : undefined}
                activePath={activePath}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col select-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors",
            "text-left w-full truncate",
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          <span className="text-slate-400">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className="truncate font-medium">{cleanLabel(item.name)}</span>
        </button>
        {isOpen && (
          <div className="flex flex-col">
            {item.children?.map((child, i) => (
              <SidebarItem
                key={child.path}
                item={child}
                level={level + 1}
                index={child.type === "file" ? i + 1 : undefined}
                activePath={activePath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File render
  const isActive = item.path === activePath;
  const label =
    index != null
      ? `${index}. ${cleanLabel(item.name)}`
      : cleanLabel(item.name);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.path)}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1 text-[13.5px] rounded-md transition-all duration-200 border border-transparent",
        "text-left w-full",
        isActive
          ? "bg-slate-100 text-slate-900 font-medium"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
      )}
      style={{ paddingLeft: `${level * 12 + 12}px` }}
    >
      <span className="w-[14px] flex justify-center opacity-50" />
      <span className="truncate">{label}</span>
    </button>
  );
};

export function DocsSidebar({ items, activePath, onSelect }: DocsSidebarProps) {
  return (
    <div className="w-72 border-r border-slate-100 flex flex-col bg-[#FBFBFB] h-full">
      <div className="px-5 py-5 flex items-center gap-2 mb-2">
        <div className="p-1 bg-white border border-slate-200 rounded-md shadow-sm">
          <FileText size={14} className="text-slate-700" />
        </div>
        <span className="font-semibold text-slate-700 text-sm tracking-tight">
          Handbook
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-10 custom-scrollbar">
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </div>
  );
}
