/**
 * TreePattern — VS Code-style flat tree using useFlatTree + flattenVisibleTree.
 *
 * All folders are expandable. No section headers.
 * Data-driven: tree structure in data, flat rendering in DOM.
 */
import { Icon } from "@/components/Icon";
import { useFlatTree } from "@/os/5-hooks/useFlatTree";
import { defineApp } from "@/os/defineApp";
import { Item } from "@os/6-components/primitives/Item";
import clsx from "clsx";
import type { DocItem, FlatTreeNode } from "@/docs-viewer/docsUtils";
import { flattenVisibleTree } from "@/docs-viewer/docsUtils";

// ── Static tree data (VS Code-style file explorer) ──

const fileTree: DocItem[] = [
  {
    name: "src", path: "src", type: "folder", children: [
      {
        name: "components", path: "src/components", type: "folder", children: [
          { name: "Button.tsx", path: "src/components/Button.tsx", type: "file" },
          { name: "Dialog.tsx", path: "src/components/Dialog.tsx", type: "file" },
          { name: "Input.tsx", path: "src/components/Input.tsx", type: "file" },
        ],
      },
      {
        name: "hooks", path: "src/hooks", type: "folder", children: [
          { name: "useAuth.ts", path: "src/hooks/useAuth.ts", type: "file" },
          { name: "useTheme.ts", path: "src/hooks/useTheme.ts", type: "file" },
        ],
      },
      { name: "App.tsx", path: "src/App.tsx", type: "file" },
      { name: "index.ts", path: "src/index.ts", type: "file" },
    ],
  },
  {
    name: "docs", path: "docs", type: "folder", children: [
      { name: "README.md", path: "docs/README.md", type: "file" },
      { name: "CHANGELOG.md", path: "docs/CHANGELOG.md", type: "file" },
    ],
  },
  { name: "package.json", path: "package.json", type: "file" },
  { name: "tsconfig.json", path: "tsconfig.json", type: "file" },
];

// ── Expandable IDs (computed from static data) ──

function collectExpandable(items: DocItem[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    if (item.type === "folder" && item.children?.length) {
      set.add(`folder:${item.path}`);
      collectExpandable(item.children).forEach((id) => set.add(id));
    }
  }
  return set;
}

const expandableIds = collectExpandable(fileTree);

// ── App + Zone (defineApp pattern) ──

const TreeApp = defineApp<Record<string, never>>("apg-tree-app", {});
const explorerZone = TreeApp.createZone("apg-explorer");
const ExplorerUI = explorerZone.bind({
  role: "tree",
  getExpandableItems: () => expandableIds,
  options: {
    activate: { onClick: true },
  },
});

// ── File icon helper ──

function fileIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "file-code";
  if (name.endsWith(".md")) return "file-text";
  if (name.endsWith(".json")) return "file-json";
  return "file";
}

function iconColor(name: string) {
  if (name.endsWith(".tsx")) return "text-blue-500";
  if (name.endsWith(".ts")) return "text-sky-500";
  if (name.endsWith(".md")) return "text-gray-500";
  if (name.endsWith(".json")) return "text-yellow-600";
  return "text-gray-400";
}

// ── Render ──

function TreeRow({ node }: { node: FlatTreeNode }) {
  if (node.type === "folder") {
    return (
      <ExplorerUI.Item id={node.id}>
        {({ isFocused, isExpanded }: { isFocused: boolean; isExpanded: boolean }) => (
          <div
            className={clsx(
              "flex items-center gap-1.5 py-0.5 rounded text-[13px] cursor-pointer",
              isFocused
                ? "bg-blue-100 text-blue-900"
                : "hover:bg-gray-100",
            )}
            style={{ paddingLeft: `${node.level * 16 + 8}px` }}
          >
            <Item.ExpandTrigger>
              <Icon
                name={isExpanded ? "chevron-down" : "chevron-right"}
                size={14}
                className="text-gray-400 shrink-0"
              />
            </Item.ExpandTrigger>
            <Icon name="folder" size={16} className="text-amber-500 shrink-0" />
            <span className="truncate font-medium">{node.name}</span>
          </div>
        )}
      </ExplorerUI.Item>
    );
  }

  return (
    <ExplorerUI.Item id={node.id}>
      {({ isFocused }: { isFocused: boolean }) => (
        <div
          className={clsx(
            "flex items-center gap-1.5 py-0.5 rounded text-[13px] cursor-pointer",
            isFocused
              ? "bg-blue-100 text-blue-900"
              : "hover:bg-gray-100",
          )}
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        >
          <span className="w-[14px]" />
          <Icon name={fileIcon(node.name)} size={16} className={iconColor(node.name) + " shrink-0"} />
          <span className="truncate">{node.name}</span>
        </div>
      )}
    </ExplorerUI.Item>
  );
}

export function TreePattern() {
  // VS Code style: no sectionLevel, all folders are expandable
  const visibleNodes = useFlatTree("apg-explorer", fileTree, flattenVisibleTree);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">VS Code-style File Explorer</h3>
      <p className="text-sm text-gray-500 mb-4">
        Flat tree rendering. <kbd>↑↓</kbd> navigate, <kbd>←→</kbd> expand/collapse,
        <kbd>Enter</kbd> or click to toggle folders. Data-driven — no recursive components.
      </p>

      <ExplorerUI.Zone className="flex flex-col" aria-label="File Explorer">
        {visibleNodes.map((node) => (
          <TreeRow key={node.id} node={node} />
        ))}
      </ExplorerUI.Zone>
    </div>
  );
}
