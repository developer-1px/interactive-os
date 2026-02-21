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

import { ChevronDown, ChevronRight, Layers, Plus, X } from "lucide-react";
import { useState } from "react";
import type { Block } from "@/apps/builder/app";
import {
  addBlock,
  BuilderApp,
  BuilderSidebarUI,
} from "@/apps/builder/app";
import { BLOCK_PRESETS } from "@/apps/builder/presets/blocks";
import { useFocusExpansion as useExpansion } from "@/os/5-hooks/useFocusExpansion";
import { useFocusedItem } from "@/os/5-hooks/useFocusedItem";
import { os } from "@/os/kernel";

const CANVAS_ZONE_ID = "canvas";

export function SectionSidebar() {
  return (
    <div className="w-56 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col overflow-visible select-none relative">
      {/* ── Sidebar Header: Logo + Page + Add ── */}
      <div className="px-3 py-2.5 border-b border-slate-200 flex items-center gap-2.5">
        <Layers size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 text-[13px] font-semibold tracking-tight truncate">
              Landing Page
            </span>
            <span className="px-1 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded tracking-wide shrink-0">
              SAVED
            </span>
          </div>
        </div>
        <AddBlockButton />
      </div>

      {/* ── Block Tree (Zone) ── */}
      <BuilderSidebarUI.Zone
        className="flex-1 flex flex-col py-3 overflow-y-auto"
        aria-label="Sections"
      >
        <SidebarContent />
      </BuilderSidebarUI.Zone>
    </div>
  );
}

/** Inner component — must be a child of Zone so useExpansion reads the correct FocusGroupContext */
function SidebarContent() {
  const blocks = BuilderApp.useComputed((s) => s.data.blocks);

  // OS-provided expansion hook — reads sidebar zone context (not parent)
  const { isExpanded, toggleExpanded } = useExpansion();

  const focusedCanvasId = useFocusedItem(CANVAS_ZONE_ID);

  // Flatten tree for sidebar display — each node gets a depth
  const flatNodes = getFlatNodes(blocks, isExpanded);

  return (
    <>
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Slides
        </span>
        <span className="text-[10px] text-slate-300 font-medium">
          {flatNodes.filter((n) => !n.isSection).length}
        </span>
      </div>

      <div className="flex-1 px-2 space-y-0.5">
        {flatNodes.map((node) => {
          const itemId = node.block.id;
          const isCanvasActive =
            focusedCanvasId?.startsWith(node.block.id) ?? false;
          const itemExpanded = isExpanded(itemId);

          // Depth-based indent: 8px base + 16px per level
          const indent = 8 + node.depth * 16;

          // Depth-based surface colors (subtle background tint per level)
          const depthBg =
            node.depth === 0
              ? ""
              : node.depth === 1
                ? "bg-slate-100/40"
                : "bg-slate-100/70";

          if (node.isSection) {
            // ─── TREE SECTION HEADER (expandable) ───
            return (
              <BuilderSidebarUI.Item
                key={node.block.id}
                id={node.block.id}
                className="outline-none group focus:outline-none"
              >
                <div
                  className={`
                    flex items-center gap-1.5 py-1.5 rounded cursor-pointer
                    ${node.depth === 0 ? "mt-3 mb-1 first:mt-0" : "mt-0.5"}
                    group-focus:ring-2 group-focus:ring-indigo-500/50
                    group-aria-selected:bg-indigo-100 group-aria-selected:text-indigo-700
                    ${depthBg}
                    ${isCanvasActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-200/50 text-slate-500"}
                  `}
                  style={{ paddingLeft: `${indent}px` }}
                  onClick={() => toggleExpanded(itemId)}
                >
                  <button
                    type="button"
                    className="shrink-0 p-0.5 rounded hover:bg-slate-300/50"
                    aria-label={itemExpanded ? "Collapse" : "Expand"}
                  >
                    {itemExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  <span
                    className={`
                    truncate
                    ${node.depth === 0
                        ? "text-[11px] font-bold uppercase tracking-widest"
                        : "text-[11px] font-semibold tracking-wide"
                      }
                  `}
                  >
                    {node.block.label}
                  </span>
                  <span className="ml-auto text-[9px] text-slate-400 shrink-0">
                    {node.block.type}
                  </span>
                </div>
              </BuilderSidebarUI.Item>
            );
          }

          // ─── TREE LEAF NODE ───
          return (
            <BuilderSidebarUI.Item
              key={node.block.id}
              id={node.block.id}
              className="outline-none group focus:outline-none"
            >
              <div
                className={`
                  relative flex items-center gap-2 py-2 pr-3 rounded-lg cursor-pointer
                  border border-transparent
                  group-focus:ring-2 group-focus:ring-indigo-500/50 group-focus:border-indigo-400
                  group-aria-selected:bg-indigo-50 group-aria-selected:border-indigo-200 group-aria-selected:shadow-sm
                  ${depthBg}
                  ${isCanvasActive
                    ? "bg-white shadow-sm border-slate-200/60"
                    : "hover:bg-white/60 hover:border-slate-200/50 text-slate-600 hover:text-slate-800"
                  }
                `}
                style={{ paddingLeft: `${indent}px` }}
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

                {/* Mini Thumbnail */}
                <div
                  className={`
                  w-10 h-7 rounded border shrink-0 flex items-center justify-center
                  ml-1
                  ${isCanvasActive
                      ? "bg-indigo-50 border-indigo-100"
                      : "bg-slate-100 border-slate-200 group-hover:bg-white"
                    }
                `}
                >
                  <div className="flex flex-col gap-0.5 w-6">
                    <div
                      className={`h-0.5 rounded-full w-full ${isCanvasActive ? "bg-indigo-200" : "bg-slate-200"}`}
                    />
                    <div
                      className={`h-[2.5px] rounded-full w-2/3 ${isCanvasActive ? "bg-indigo-200" : "bg-slate-200"}`}
                    />
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
                  <span className="text-[9px] text-slate-400 truncate">
                    {node.block.type}
                  </span>
                </div>
              </div>
            </BuilderSidebarUI.Item>
          );
        })}
      </div>
    </>
  );
}

// ─── Flatten tree for rendering ───

interface FlatNode {
  block: Block;
  depth: number;
  isSection: boolean;
  slideIndex: number | null;
}

function getFlatNodes(blocks: Block[], isExpanded: (id: string) => boolean) {
  let slideIndex = 1;
  const result: FlatNode[] = [];

  function traverse(list: Block[], depth: number) {
    for (const block of list) {
      const isSection = block.children && block.children.length > 0;
      result.push({
        block,
        depth,
        isSection: !!isSection,
        slideIndex: isSection ? null : slideIndex++,
      });
      // Show children only when section is expanded
      if (isSection && isExpanded(block.id)) {
        traverse(block.children!, depth + 1);
      }
    }
  }

  traverse(blocks, 0);
  return result;
}

// ─── Add Block Button (Header) ───

function AddBlockButton() {
  const [open, setOpen] = useState(false);

  const handleAdd = (preset: (typeof BLOCK_PRESETS)[number]) => {
    os.dispatch(addBlock({ block: preset.block }));
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-6 h-6 flex items-center justify-center rounded-md transition-colors shrink-0
          ${open
            ? "bg-indigo-100 text-indigo-600"
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          }
        `}
        title="블록 추가"
      >
        {open ? <X size={14} /> : <Plus size={14} />}
      </button>

      {/* Side panel — opens to the right of the sidebar */}
      {open && (
        <div className="absolute left-full top-0 bottom-0 w-64 bg-white border-r border-slate-200 shadow-xl z-[100] flex flex-col">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-800">
              블록 추가
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={12} />
            </button>
          </div>

          {/* Block list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {BLOCK_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.type}
                onClick={() => handleAdd(preset)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors group text-left"
              >
                <span className="text-lg shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 group-hover:bg-indigo-100 transition-colors">
                  {preset.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate leading-tight">
                    {preset.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
