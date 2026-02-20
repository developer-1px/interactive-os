/**
 * SectionSidebar — Block Tree visual projection.
 *
 * Displays a tree view of blocks with:
 *   - Indent per depth level (PPT outline style)
 *   - Collapse/expand for container blocks (those with children)
 *   - Active section indicator synced with canvas focus
 *
 * Uses BuilderSidebarUI.Zone + Item from app.ts bind().
 */

import type { Block } from "@/apps/builder/app";
import { BuilderApp, BuilderSidebarUI } from "@/apps/builder/app";
import { kernel } from "@/os/kernel";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";

const SIDEBAR_ZONE_ID = "builder-sidebar";
const CANVAS_ZONE_ID = "builder-canvas";

export function SectionSidebar() {
  const blocks = BuilderApp.useComputed((s) => s.data.blocks);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const focusedCanvasId = kernel.useComputed(
    (s) => s.os.focus.zones[CANVAS_ZONE_ID]?.lastFocusedId ?? null,
  );

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Flatten tree for sidebar display — each node gets a depth
  const flatNodes = flattenBlocks(blocks, 0, collapsed);

  return (
    <BuilderSidebarUI.Zone
      id={SIDEBAR_ZONE_ID}
      className="w-56 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col py-3 overflow-y-auto select-none"
      aria-label="Sections"
    >
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Sections
        </span>
        <span className="text-[10px] text-slate-300 font-medium">
          {blocks.length}
        </span>
      </div>

      <div className="flex-1 px-2 space-y-0.5">
        {flatNodes.map((node, idx) => {
          const isCanvasActive =
            focusedCanvasId?.startsWith(node.block.id) ?? false;
          const hasChildren =
            node.block.children && node.block.children.length > 0;
          const isCollapsed = collapsed[node.block.id] ?? false;

          return (
            <BuilderSidebarUI.Item
              key={node.block.id}
              id={`sidebar-${node.block.id}`}
              className="outline-none group focus:outline-none"
            >
              <div
                className={`
                  relative flex items-center gap-2 py-2 pr-3 rounded-lg cursor-pointer
                  transition-all duration-200 border border-transparent
                  group-focus:ring-2 group-focus:ring-indigo-500/50 group-focus:border-indigo-400
                  ${isCanvasActive
                    ? "bg-white shadow-sm border-slate-200/60"
                    : "hover:bg-white/60 hover:border-slate-200/50 text-slate-500 hover:text-slate-700"
                  }
                `}
                style={{ paddingLeft: `${12 + node.depth * 16}px` }}
              >
                {/* Active Indicator (Left Bar) */}
                {isCanvasActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-indigo-500 rounded-r-full" />
                )}

                {/* Collapse/Expand toggle or leaf indicator */}
                {hasChildren ? (
                  <button
                    type="button"
                    className={`
                      shrink-0 w-4 h-4 flex items-center justify-center rounded
                      hover:bg-slate-200 transition-colors
                      ${isCanvasActive ? "text-indigo-500" : "text-slate-400"}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapse(node.block.id);
                    }}
                    tabIndex={-1}
                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                  >
                    {isCollapsed ? (
                      <ChevronRight size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </button>
                ) : (
                  <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isCanvasActive ? "bg-indigo-400" : "bg-slate-300"
                        }`}
                    />
                  </span>
                )}

                {/* Block label */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className={`
                      text-xs font-medium truncate
                      ${isCanvasActive ? "text-slate-800" : "text-slate-600"}
                    `}
                  >
                    {node.block.label}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate hidden group-hover:block">
                    {node.block.type}
                  </span>
                </div>

                {/* Slide number for top-level */}
                {node.depth === 0 && (
                  <span
                    className={`
                      text-[10px] font-medium tabular-nums shrink-0
                      ${isCanvasActive ? "text-indigo-400" : "text-slate-300"}
                    `}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>
            </BuilderSidebarUI.Item>
          );
        })}
      </div>
    </BuilderSidebarUI.Zone>
  );
}

// ─── Flatten tree for rendering ───

interface FlatNode {
  block: Block;
  depth: number;
}

function flattenBlocks(
  blocks: Block[],
  depth: number,
  collapsed: Record<string, boolean>,
): FlatNode[] {
  const result: FlatNode[] = [];
  for (const block of blocks) {
    result.push({ block, depth });
    if (block.children && !collapsed[block.id]) {
      result.push(...flattenBlocks(block.children, depth + 1, collapsed));
    }
  }
  return result;
}
