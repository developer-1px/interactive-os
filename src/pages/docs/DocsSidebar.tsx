import clsx from "clsx";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";

// Types for our tree structure
export interface DocItem {
  name: string;
  path: string; // relative path from docs root, e.g. "1-project/foo.md"
  type: "file" | "folder";
  children?: DocItem[];
}

interface DocsSidebarProps {
  items: DocItem[];
}

// Helper to clean labels for display
export function cleanLabel(label: string) {
  return label
    .replace(/^0+(\d)/, "$1") // Strip zero-padding: 00 → 0, 01 → 1, 001 → 1
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\.md$/, "") // Remove .md extension
    .trim();
}

const SidebarItem = ({
  item,
  level = 0,
}: {
  item: DocItem;
  level?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  item.type === "file" && pathname === `/docs/${item.path}`;

  // Auto-expand if a child is active
  useEffect(() => {
    if (item.type === "folder" && item.children) {
      const hasActiveChild = (children: DocItem[]): boolean => {
        return children.some(
          (child) =>
            (child.type === "file" &&
              pathname === `/docs/${child.path}`) ||
            (child.type === "folder" &&
              child.children &&
              hasActiveChild(child.children)),
        );
      };
      if (hasActiveChild(item.children)) {
        setIsOpen(true);
      }
    }
  }, [pathname, item]);

  // Folder render
  if (item.type === "folder") {
    // Top level folders (PARA) get a special section header look if level 0
    if (level === 0) {
      return (
        <div className="mb-6">
          <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {cleanLabel(item.name)}
          </h3>
          <div className="flex flex-col">
            {item.children?.map((child) => (
              <SidebarItem key={child.path} item={child} level={level + 1} />
            ))}
          </div>
        </div>
      );
    }

    // Nested folders
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
            {item.children?.map((child) => (
              <SidebarItem key={child.path} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File render
  return (
    <Link
      to={`/docs/${item.path}`}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1 text-[13.5px] rounded-md transition-all duration-200 border border-transparent",
        pathname === `/docs/${item.path}`
          ? "bg-slate-100 text-slate-900 font-medium"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
      )}
      style={{ paddingLeft: `${level * 12 + 12}px` }}
    >
      <span className="w-[14px] flex justify-center opacity-50" />
      <span className="truncate">{cleanLabel(item.name)}</span>
    </Link>
  );
};

export function DocsSidebar({ items }: DocsSidebarProps) {
  return (
    <div className="w-72 border-r border-slate-100 flex flex-col bg-[#FBFBFB] h-full">
      <div className="px-5 py-5 flex items-center gap-2 mb-2">
        {/* Simple Header */}
        <div className="p-1 bg-white border border-slate-200 rounded-md shadow-sm">
          <FileText size={14} className="text-slate-700" />
        </div>
        <span className="font-semibold text-slate-700 text-sm tracking-tight">
          Handbook
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-10 custom-scrollbar">
        {items.map((item) => (
          <SidebarItem key={item.path} item={item} />
        ))}
      </nav>
    </div>
  );
}
