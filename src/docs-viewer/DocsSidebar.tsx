import clsx from "clsx";
import { ChevronDown, ChevronRight, Clock, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import docsMeta from "virtual:docs-meta";
import {
  cleanLabel,
  type DocItem,
  formatRelativeTime,
  getRecentFiles,
} from "./docsUtils";

export interface DocsSidebarProps {
  items: DocItem[];
  allFiles: DocItem[];
  activePath: string | undefined;
  onSelect: (path: string) => void;
  className?: string;
  header?: React.ReactNode;
}

// --------------- Recent Section ---------------

function RecentSection({
  allFiles,
  activePath,
  onSelect,
}: {
  allFiles: DocItem[];
  activePath: string | undefined;
  onSelect: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const recentFiles = useMemo(
    () => getRecentFiles(allFiles, docsMeta, 7),
    [allFiles],
  );

  if (recentFiles.length === 0) return null;

  return (
    <div className="mb-4 pb-3 border-b border-slate-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1 w-full text-left group"
      >
        <Clock size={12} className="text-blue-400" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-1">
          Recent
        </span>
        <span className="text-slate-300 transition-transform">
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-1 flex flex-col">
          {recentFiles.map((file) => {
            const isActive = file.path === activePath;
            return (
              <button
                type="button"
                key={file.path}
                onClick={() => onSelect(file.path)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 text-[13px] rounded-md transition-all duration-150",
                  "text-left w-full group/recent",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
                )}
                style={{ paddingLeft: "20px" }}
              >
                <FileText
                  size={12}
                  className={clsx(
                    "shrink-0",
                    isActive ? "text-blue-400" : "text-slate-300",
                  )}
                />
                <span className="truncate flex-1">
                  {cleanLabel(file.name)}
                </span>
                <span
                  className={clsx(
                    "text-[10px] tabular-nums shrink-0",
                    isActive ? "text-blue-400" : "text-slate-300",
                  )}
                >
                  {formatRelativeTime(file.mtime)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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

export function DocsSidebar({
  items,
  allFiles,
  activePath,
  onSelect,
  className,
  header,
}: DocsSidebarProps) {
  return (
    <div
      className={clsx(
        "w-72 border-r border-slate-100 flex flex-col bg-[#FBFBFB] h-full",
        className,
      )}
    >
      {header ? (
        header
      ) : (
        <div className="px-5 py-5 flex items-center gap-2 mb-2">
          <div className="p-1 bg-white border border-slate-200 rounded-md shadow-sm">
            <FileText size={14} className="text-slate-700" />
          </div>
          <span className="font-semibold text-slate-700 text-sm tracking-tight">
            Handbook
          </span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-10 custom-scrollbar">
        {/* Recent Section — cross-folder, mtime-sorted */}
        <RecentSection
          allFiles={allFiles}
          activePath={activePath}
          onSelect={onSelect}
        />

        {/* Folder Tree */}
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
