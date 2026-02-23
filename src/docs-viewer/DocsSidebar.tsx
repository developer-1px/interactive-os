import clsx from "clsx";
import { ChevronDown, ChevronRight, Clock, FileText, Star } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import docsMeta from "virtual:docs-meta";
import { DocsSidebarUI } from "./app";
import {
  cleanLabel,
  type DocItem,
  formatRelativeTime,
  getFavoriteFiles,
  getRecentFiles,
  toggleFavorite,
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
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-1">
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
                  "flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md transition-all duration-150",
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
                    "text-[9px] tabular-nums shrink-0",
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

// --------------- Favorites Section ---------------

function FavoritesSection({
  allFiles,
  activePath,
  onSelect,
  favVersion,
}: {
  allFiles: DocItem[];
  activePath: string | undefined;
  onSelect: (path: string) => void;
  favVersion: number;
}) {
  const favoriteFiles = useMemo(
    () => getFavoriteFiles(allFiles),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allFiles, favVersion],
  );

  if (favoriteFiles.length === 0) return null;

  return (
    <div className="mb-4 pb-3 border-b border-slate-100">
      <div className="flex items-center gap-1.5 px-3 py-1">
        <Star size={11} className="text-amber-400 fill-amber-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-1">
          Pinned
        </span>
      </div>
      <div className="mt-1 flex flex-col">
        {favoriteFiles.map((file) => {
          const isActive = file.path === activePath;
          return (
            <button
              type="button"
              key={file.path}
              onClick={() => onSelect(file.path)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md transition-all duration-150",
                "text-left w-full",
                isActive
                  ? "bg-amber-50 text-amber-800 font-medium"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
              )}
              style={{ paddingLeft: "20px" }}
            >
              <Star
                size={11}
                className={clsx(
                  "shrink-0",
                  isActive ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-slate-300",
                )}
              />
              <span className="truncate flex-1">
                {cleanLabel(file.name)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --------------- Tree Item (OS-managed) ---------------

const TreeItem = ({
  item,
  level = 0,
  index,
  activePath,
}: {
  item: DocItem;
  level?: number;
  index?: number | undefined;
  activePath: string | undefined;
}) => {
  // Folder render
  if (item.type === "folder") {
    if (level === 0) {
      return (
        <div className="mb-6">
          <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {cleanLabel(item.name)}
          </h3>
          <div className="flex flex-col">
            {item.children?.map((child, i) => (
              <TreeItem
                key={child.path}
                item={child}
                level={level + 1}
                index={child.type === "file" ? i + 1 : undefined}
                activePath={activePath}
              />
            ))}
          </div>
        </div>
      );
    }

    // Nested folder — OS-managed expand/collapse via Item
    return (
      <DocsSidebarUI.Item id={`folder:${item.path}`}>
        {({ isFocused, isExpanded }) => (
          <div className="flex flex-col select-none">
            <div
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 text-[13px] rounded-md transition-colors cursor-pointer",
                "text-left w-full truncate",
                isFocused
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100",
              )}
              style={{ paddingLeft: `${level * 12 + 12}px` }}
            >
              <span className={clsx("text-slate-400 transition-transform", isExpanded && "rotate-90")}>
                <ChevronRight size={14} />
              </span>
              <span className="truncate font-medium">{cleanLabel(item.name)}</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col">
                {item.children?.map((child, i) => (
                  <TreeItem
                    key={child.path}
                    item={child}
                    level={level + 1}
                    index={child.type === "file" ? i + 1 : undefined}
                    activePath={activePath}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </DocsSidebarUI.Item>
    );
  }

  // File render — OS Item
  const isActive = item.path === activePath;
  const label =
    index != null
      ? `${index}. ${cleanLabel(item.name)}`
      : cleanLabel(item.name);

  return (
    <DocsSidebarUI.Item id={item.path}>
      {({ isFocused }) => (
        <div
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1 text-[12.5px] rounded-md transition-all duration-200 border border-transparent",
            "text-left w-full cursor-pointer",
            isActive
              ? "bg-slate-100 text-slate-900 font-medium"
              : isFocused
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          <span className="w-[14px] flex justify-center opacity-50" />
          <span className="truncate">{label}</span>
        </div>
      )}
    </DocsSidebarUI.Item>
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
  const [favVersion, setFavVersion] = useState(0);

  const handleToggleFavorite = useCallback((path: string) => {
    toggleFavorite(path);
    setFavVersion((v) => v + 1);
  }, []);

  // onAction callback: Enter or Click on an Item
  // OS auto-handles expandable items (OS_ACTIVATE → OS_EXPAND)
  // cursor.isExpandable provided by OS — no string convention needed
  const handleAction = useCallback(
    (cursor: { focusId: string; isExpandable: boolean }) => {
      if (cursor.isExpandable) return;
      onSelect(cursor.focusId);
    },
    [onSelect],
  );

  // onSelect callback: Arrow key with followFocus → preview file
  // Expandable items (folders) skipped — no document load
  const handleSelect = useCallback(
    (cursor: { focusId: string; isExpandable: boolean }) => {
      if (cursor.isExpandable) return;
      onSelect(cursor.focusId);
    },
    [onSelect],
  );

  // Expandable items: only folders are expandable (not files)
  const getExpandableItems = useCallback(() => {
    const set = new Set<string>();
    const collect = (list: DocItem[]) => {
      for (const item of list) {
        if (item.type === "folder" && item.children) {
          set.add(`folder:${item.path}`);
          collect(item.children);
        }
      }
    };
    collect(items);
    return set;
  }, [items]);

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
          <span className="font-semibold text-slate-700 text-[13px] tracking-tight">
            Handbook
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-10 custom-scrollbar">
        {/* Favorites Section — pinned docs */}
        <FavoritesSection
          allFiles={allFiles}
          activePath={activePath}
          onSelect={onSelect}
          favVersion={favVersion}
        />

        {/* Recent Section — cross-folder, mtime-sorted */}
        <RecentSection
          allFiles={allFiles}
          activePath={activePath}
          onSelect={onSelect}
        />

        {/* Folder Tree — OS Zone */}
        <DocsSidebarUI.Zone
          className="flex flex-col"
          onAction={handleAction}
          onSelect={handleSelect}
          getExpandableItems={getExpandableItems}
        >
          {items.map((item) => (
            <TreeItem
              key={item.path}
              item={item}
              activePath={activePath}
            />
          ))}
        </DocsSidebarUI.Zone>
      </div>
    </div>
  );
}

export { type DocsSidebarProps };
export { toggleFavorite as _toggleFavorite };

