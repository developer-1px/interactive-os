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
import { EXPAND } from "@/os/3-commands/expand/index";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback } from "react";

const SIDEBAR_ZONE_ID = "builder-sidebar";
const CANVAS_ZONE_ID = "builder-canvas";

export function SectionSidebar() {
  const blocks = BuilderApp.useComputed((s) => s.data.blocks);
  // OS expandedItems = toggled items = collapsed (inverted: default empty = all expanded)
  const expandedItems = kernel.useComputed(
    (s) => s.os.focus.zones[SIDEBAR_ZONE_ID]?.expandedItems ?? [],
  );
  const collapsed = new Set(expandedItems);

  const focusedCanvasId = kernel.useComputed(
    (s) => s.os.focus.zones[CANVAS_ZONE_ID]?.lastFocusedId ?? null,
  );

  const toggleCollapse = useCallback((itemId: string) => {
    kernel.dispatch(EXPAND({ itemId, action: "toggle" }));
  }, []);

  // Flatten tree for sidebar display — each node gets a depth
  const flatNodes = getFlatNodes(blocks, collapsed);

  return (
    <BuilderSidebarUI.Zone
      id={SIDEBAR_ZONE_ID}
      className="w-56 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col py-3 overflow-y-auto select-none"
      aria-label="Sections"
    >
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Slides
        </span>
        <span className="text-[10px] text-slate-300 font-medium">
          {flatNodes.filter(n => !n.isSection).length}
        </span>
      </div>

      <div className="flex-1 px-2 space-y-0.5">
        {flatNodes.map((node) => {
          const itemId = `sidebar-${node.block.id}`;
          const isCanvasActive =
            focusedCanvasId?.startsWith(node.block.id) ?? false;
          const isCollapsed = collapsed.has(itemId);

          if (node.isSection) {
            // ─── PPT SECTION HEADER ───
            return (
              <BuilderSidebarUI.Item
                key={node.block.id}
                id={`sidebar-${node.block.id}`}
                className="outline-none group focus:outline-none mt-3 mb-1 first:mt-0"
              >
                <div
                  className={`
                    flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer transition-colors
                    group-focus:ring-2 group-focus:ring-indigo-500/50 
                    ${isCanvasActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-200/50 text-slate-500"}
                  `}
                  onClick={() => toggleCollapse(itemId)}
                >
                  <button
                    type="button"
                    className="shrink-0 p-0.5 rounded hover:bg-slate-300/50 transition-colors"
                    aria-label={isCollapsed ? "Expand" : "Collapse"}
                  >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <span className="text-[11px] font-bold uppercase tracking-widest truncate">{node.block.label}</span>
                </div>
              </BuilderSidebarUI.Item>
            );
          }

          // ─── PPT SLIDE (Leaf Node) ───
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
                    : "hover:bg-white/60 hover:border-slate-200/50 text-slate-600 hover:text-slate-800"
                  }
                `}
                style={{ paddingLeft: `${node.depth > 0 ? 12 : 8}px` }}
              >
                {/* Active Indicator (Left Bar) */}
                {isCanvasActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-indigo-500 rounded-r-full" />
                )}

                {/* Slide number */}
                <span
                  className={`
                    text-[10px] font-bold tabular-nums text-right shrink-0 w-5
                    ${isCanvasActive ? "text-indigo-600" : "text-slate-400"}
                  `}
                >
                  {node.slideIndex}
                </span>

                {/* Restored PPT Thumbnail */}
                <div
                  className={`
                  w-10 h-7 rounded border shrink-0 flex items-center justify-center
                  transition-colors ml-1
                  ${isCanvasActive
                      ? "bg-indigo-50 border-indigo-100"
                      : "bg-slate-100 border-slate-200 group-hover:bg-white"
                    }
                `}
                >
                  <div className="flex flex-col gap-0.5 w-6">
                    <div className={`h-0.5 rounded-full w-full ${isCanvasActive ? "bg-indigo-200" : "bg-slate-200"}`} />
                    <div className={`h-[2.5px] rounded-full w-2/3 ${isCanvasActive ? "bg-indigo-200" : "bg-slate-200"}`} />
                  </div>
                </div>

                {/* Block label */}
                <div className="flex flex-col min-w-0 flex-1 ml-1">
                  <span
                    className={`
                      text-xs font-medium truncate
                      ${isCanvasActive ? "text-slate-900" : "text-slate-700"}
                    `}
                  >
                    {node.block.label}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate hidden group-hover:block">
                    {node.block.type}
                  </span>
                </div>
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
  isSection: boolean;
  slideIndex: number | null;
}

function getFlatNodes(blocks: Block[], collapsed: Set<string>) {
  let slideIndex = 1;
  const result: FlatNode[] = [];

  function traverse(list: Block[], depth: number) {
    for (const block of list) {
      const isSection = block.children && block.children.length > 0;
      result.push({
        block,
        depth,
        isSection: !!isSection,
        slideIndex: isSection ? null : slideIndex++
      });
      // Inverted: items IN collapsed set are collapsed
      if (isSection && !collapsed.has(`sidebar-${block.id}`)) {
        traverse(block.children!, depth + 1);
      }
    }
  }

  traverse(blocks, 0);
  return result;
}
