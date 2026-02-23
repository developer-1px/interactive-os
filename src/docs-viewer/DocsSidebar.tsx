import { Item } from "@os/6-components/primitives/Item";
import { useFlatTree } from "@os/5-hooks/useFlatTree";
import clsx from "clsx";

import { ChevronDown, ChevronRight, Clock, FileText, Star } from "lucide-react";
import { useMemo, useState } from "react";
import docsMeta from "virtual:docs-meta";
import { DocsFavoritesUI, DocsRecentUI, DocsSidebarUI } from "./app";
import {
  cleanLabel,
  type DocItem,
  type FlatTreeNode,
  flattenVisibleTree,
  formatRelativeTime,
  getFavoriteFiles,
  getRecentFiles,
  toggleFavorite,
} from "./docsUtils";

/** DocsSidebar flatten: level 0 folders = section headers */
const flattenDocTree = (items: DocItem[], expanded: string[]) =>
  flattenVisibleTree(items, expanded, 0, { sectionLevel: 0 });

export interface DocsSidebarProps {
  items: DocItem[];
  allFiles: DocItem[];
  activePath: string | undefined;
  className?: string;
  header?: React.ReactNode;
}

// --------------- Recent Section (OS-managed) ---------------

function RecentSection({
  allFiles,
  activePath,
}: {
  allFiles: DocItem[];
  activePath: string | undefined;
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
        <DocsRecentUI.Zone className="mt-1 flex flex-col">
          {recentFiles.map((file) => {
            const isActive = file.path === activePath;
            return (
              <DocsRecentUI.Item key={file.path} id={file.path}>
                {({ isFocused }) => (
                  <div
                    className={clsx(
                      "flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md transition-all duration-150",
                      "text-left w-full group/recent cursor-pointer",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : isFocused
                          ? "bg-indigo-50 text-indigo-700"
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
                  </div>
                )}
              </DocsRecentUI.Item>
            );
          })}
        </DocsRecentUI.Zone>
      )}
    </div>
  );
}

// --------------- Favorites Section (OS-managed) ---------------

function FavoritesSection({
  allFiles,
  activePath,
  favVersion,
}: {
  allFiles: DocItem[];
  activePath: string | undefined;
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
      <DocsFavoritesUI.Zone className="mt-1 flex flex-col">
        {favoriteFiles.map((file) => {
          const isActive = file.path === activePath;
          return (
            <DocsFavoritesUI.Item key={file.path} id={file.path}>
              {({ isFocused }) => (
                <div
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-md transition-all duration-150",
                    "text-left w-full cursor-pointer",
                    isActive
                      ? "bg-amber-50 text-amber-800 font-medium"
                      : isFocused
                        ? "bg-indigo-50 text-indigo-700"
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
                </div>
              )}
            </DocsFavoritesUI.Item>
          );
        })}
      </DocsFavoritesUI.Zone>
    </div>
  );
}

// --------------- Flat Tree Node Renderers ---------------

function SectionHeader({ node }: { node: FlatTreeNode }) {
  return (
    <div className="mb-1 mt-4 first:mt-0">
      <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {cleanLabel(node.name)}
      </h3>
    </div>
  );
}

function FolderRow({ node }: { node: FlatTreeNode }) {
  return (
    <DocsSidebarUI.Item id={node.id}>
      {({ isFocused, isExpanded }: { isFocused: boolean; isExpanded: boolean }) => (
        <div
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1 text-[13px] rounded-md transition-colors cursor-pointer",
            "text-left w-full truncate",
            isFocused
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-600 hover:bg-slate-100",
          )}
          style={{ paddingLeft: `${node.level * 12 + 12}px` }}
        >
          <Item.ExpandTrigger>
            <span className={clsx("text-slate-400 transition-transform", isExpanded && "rotate-90")}>
              <ChevronRight size={14} />
            </span>
          </Item.ExpandTrigger>
          <span className="truncate font-medium">{cleanLabel(node.name)}</span>
        </div>
      )}
    </DocsSidebarUI.Item>
  );
}

function FileRow({ node, activePath }: { node: FlatTreeNode; activePath: string | undefined }) {
  const isActive = node.path === activePath;
  return (
    <DocsSidebarUI.Item id={node.id}>
      {({ isFocused }: { isFocused: boolean }) => (
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
          style={{ paddingLeft: `${node.level * 12 + 12}px` }}
        >
          <span className="w-[14px] flex justify-center opacity-50" />
          <span className="truncate">{cleanLabel(node.name)}</span>
        </div>
      )}
    </DocsSidebarUI.Item>
  );
}

// --------------- DocsSidebar ---------------

export function DocsSidebar({
  items,
  allFiles,
  activePath,
  className,
  header,
}: DocsSidebarProps) {
  const [favVersion] = useState(0);

  const visibleNodes = useFlatTree("docs-sidebar", items, flattenDocTree);

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
        {/* Favorites Section — OS Zone */}
        <FavoritesSection
          allFiles={allFiles}
          activePath={activePath}
          favVersion={favVersion}
        />

        {/* Recent Section — OS Zone */}
        <RecentSection
          allFiles={allFiles}
          activePath={activePath}
        />

        {/* Folder Tree — Flat rendering from OS state */}
        <DocsSidebarUI.Zone className="flex flex-col">
          {visibleNodes.map((node) => {
            // Section header (level 0 folder) — not an OS item
            if (node.type === "folder" && node.level === 0) {
              return <SectionHeader key={node.id} node={node} />;
            }
            // Expandable folder (level 1+) — OS item
            if (node.type === "folder") {
              return <FolderRow key={node.id} node={node} />;
            }
            // File — OS item
            return <FileRow key={node.id} node={node} activePath={activePath} />;
          })}
        </DocsSidebarUI.Zone>
      </div>
    </div>
  );
}

export { type DocsSidebarProps };
export { toggleFavorite as _toggleFavorite };
