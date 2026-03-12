import initialAgentActivity from "virtual:agent-activity";
import { useFlatTree } from "@os-react/6-project/accessors/useFlatTree";
import { Item } from "@os-react/internal";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Edit3,
  Eye,
  FileText,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DocsApp, DocsFavoritesUI, DocsRecentUI, DocsSidebarUI } from "./app";
import {
  type AgentRecentFile,
  cleanLabel,
  type DocItem,
  type FlatTreeNode,
  flattenVisibleTree,
  getAgentRecentFiles,
  getFavoriteFiles,
} from "./docsUtils";
import type { AgentActivityEntry } from "./vite-plugin-agent-activity";

/** Subscribe to HMR custom events for live agent activity updates */
function useAgentActivity(): AgentActivityEntry[] {
  const [entries, setEntries] =
    useState<AgentActivityEntry[]>(initialAgentActivity);

  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.on(
        "agent-activity-update",
        (data: AgentActivityEntry[]) => {
          setEntries(data);
        },
      );
    }
  }, []);

  return entries;
}

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

// --------------- Recent Section (Agent activity log) ---------------

/** Project root for path normalization — stripped from absolute paths */
const PROJECT_ROOT = "/Users/user/Desktop/interactive-os/";

function FileIcon({ ext, className }: { ext: string; className?: string }) {
  if (ext === "ts" || ext === "tsx")
    return <Code size={12} className={className} />;
  return <FileText size={12} className={className} />;
}

function ToolBadge({ tool }: { tool: string }) {
  if (tool === "Read") return <Eye size={9} className="text-slate-300" />;
  if (tool === "Edit" || tool === "Write")
    return <Edit3 size={9} className="text-amber-400" />;
  return null;
}

function RecentFileItem({
  file,
  activePath,
}: {
  file: AgentRecentFile;
  activePath: string | undefined;
}) {
  const isActive = file.path === activePath;
  return (
    <DocsRecentUI.Item key={file.path} id={file.path}>
      {({ isFocused }: { isFocused: boolean }) => (
        <div
          className={clsx(
            "flex flex-col px-3 py-1.5 text-[12px] rounded-md transition-all duration-150",
            "text-left w-full group/recent cursor-pointer",
            isActive
              ? "bg-blue-50 text-blue-700 font-medium"
              : isFocused
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
          )}
          style={{ paddingLeft: "20px" }}
        >
          <div className="flex items-center gap-2">
            <FileIcon
              ext={file.ext}
              className={clsx(
                "shrink-0",
                isActive ? "text-blue-400" : "text-slate-300",
              )}
            />
            <span className="truncate flex-1" title={file.path}>
              {file.name}
            </span>
            <ToolBadge tool={file.tool} />
          </div>
          {file.commitMessage && (
            <span
              data-testid="commit-message"
              className="text-[10px] text-slate-400 truncate mt-0.5 pl-4"
            >
              {file.commitMessage}
            </span>
          )}
        </div>
      )}
    </DocsRecentUI.Item>
  );
}

function SessionGroupHeader({ sessionId }: { sessionId: string }) {
  return (
    <div
      data-session-group={sessionId}
      id={`session-group-${sessionId}`}
      className="px-3 py-1 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider"
    >
      {sessionId.slice(0, 6)}
    </div>
  );
}

function RecentSection({
  activePath,
  agentEntries,
}: {
  allFiles: DocItem[];
  activePath: string | undefined;
  agentEntries: AgentActivityEntry[];
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isGrouped = DocsApp.useComputed((s) => s.isGrouped);
  const recentFiles = useMemo(
    () => getAgentRecentFiles(agentEntries, PROJECT_ROOT, 15),
    [agentEntries],
  );

  const groupedFiles = useMemo(() => {
    if (!isGrouped) return null;
    const groups = new Map<string, AgentRecentFile[]>();
    for (const file of recentFiles) {
      const session = file.session ?? "unknown";
      const list = groups.get(session);
      if (list) {
        list.push(file);
      } else {
        groups.set(session, [file]);
      }
    }
    return groups;
  }, [isGrouped, recentFiles]);

  if (recentFiles.length === 0) return null;

  return (
    <div className="mb-4 pb-3 border-b border-slate-100">
      <div className="flex items-center gap-1.5 px-3 py-1 w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 flex-1 text-left group"
        >
          <Clock size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-1">
            Agent Activity
          </span>
          <span className="text-[9px] text-slate-300 tabular-nums mr-1">
            {recentFiles.length}
          </span>
          <span className="text-slate-300 transition-transform">
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        </button>
        <button
          type="button"
          data-testid="session-group-toggle"
          {...DocsRecentUI.triggers.ToggleGrouping()}
          className={clsx(
            "text-[9px] px-1.5 py-0.5 rounded transition-colors",
            isGrouped
              ? "bg-blue-100 text-blue-600"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          {isGrouped ? "Flat" : "Group"}
        </button>
      </div>

      {isOpen && (
        <DocsRecentUI.Zone className="mt-1 flex flex-col">
          {isGrouped && groupedFiles
            ? Array.from(groupedFiles.entries()).map(([session, files]) => (
                <div key={session}>
                  <SessionGroupHeader sessionId={session} />
                  {files.map((file) => (
                    <RecentFileItem
                      key={file.path}
                      file={file}
                      activePath={activePath}
                    />
                  ))}
                </div>
              ))
            : recentFiles.map((file) => (
                <RecentFileItem
                  key={file.path}
                  file={file}
                  activePath={activePath}
                />
              ))}
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: favVersion is intentional cache-busting trigger for localStorage changes
  const favoriteFiles = useMemo(
    () => getFavoriteFiles(allFiles),
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
                      isActive
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300 fill-slate-300",
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
      {({
        isFocused,
        isExpanded,
      }: {
        isFocused: boolean;
        isExpanded: boolean;
      }) => (
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
            <span
              className={clsx(
                "text-slate-400 transition-transform",
                isExpanded && "rotate-90",
              )}
            >
              <ChevronRight size={14} />
            </span>
          </Item.ExpandTrigger>
          <span className="truncate font-medium">{cleanLabel(node.name)}</span>
        </div>
      )}
    </DocsSidebarUI.Item>
  );
}

function FileRow({
  node,
  activePath,
}: {
  node: FlatTreeNode;
  activePath: string | undefined;
}) {
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
  const agentEntries = useAgentActivity();

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
          agentEntries={agentEntries}
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
            return (
              <FileRow key={node.id} node={node} activePath={activePath} />
            );
          })}
        </DocsSidebarUI.Zone>
      </div>
    </div>
  );
}
