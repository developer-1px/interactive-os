/**
 * SectionSidebar — PPT-style section thumbnail list.
 *
 * Reads sections from BuilderApp state (dynamic).
 * Uses BuilderSidebarUI.Zone + Item from app.ts bind().
 */

import { BuilderSidebarUI, BuilderApp } from "@/apps/builder/app";
import { kernel } from "@/os/kernel";

const SIDEBAR_ZONE_ID = "builder-sidebar";
const CANVAS_ZONE_ID = "builder-canvas";

export function SectionSidebar() {
    const sections = BuilderApp.useComputed((s) => s.data.sections);

    const focusedCanvasId = kernel.useComputed(
        (s) => s.os.focus.zones[CANVAS_ZONE_ID]?.lastFocusedId ?? null
    );

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
                    {sections.length}
                </span>
            </div>

            <div className="flex-1 px-2 space-y-1">
                {sections.map((section, idx) => {
                    // "Active" means the user is editing/viewing this section in the canvas
                    const isCanvasActive =
                        focusedCanvasId?.startsWith(section.id) ?? false;

                    return (
                        <BuilderSidebarUI.Item
                            key={section.id}
                            id={`sidebar-${section.id}`}
                            className="outline-none group focus:outline-none"
                        >
                            <div
                                className={`
                  relative flex items-center gap-3 px-3 py-2.5
                  rounded-lg cursor-pointer transition-all duration-200
                  border border-transparent
                  group-focus:ring-2 group-focus:ring-indigo-500/50 group-focus:border-indigo-400
                  ${isCanvasActive
                                        ? "bg-white shadow-sm border-slate-200/60"
                                        : "hover:bg-white/60 hover:border-slate-200/50 text-slate-500 hover:text-slate-700"
                                    }
                `}
                            >
                                {/* Active Indicator (Left Bar) */}
                                {isCanvasActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-indigo-500 rounded-r-full" />
                                )}

                                {/* Slide number */}
                                <span
                                    className={`
                  text-[10px] font-medium tabular-nums text-right shrink-0 w-4
                  ${isCanvasActive ? "text-indigo-600" : "text-slate-400"}
                `}
                                >
                                    {idx + 1}
                                </span>

                                {/* Thumbnail preview box */}
                                <div
                                    className={`
                  w-10 h-7 rounded border shrink-0 flex items-center justify-center
                  transition-colors
                  ${isCanvasActive
                                            ? "bg-indigo-50 border-indigo-100"
                                            : "bg-slate-100 border-slate-200 group-hover:bg-white"
                                        }
                `}
                                >
                                    {/* Miniature representation */}
                                    <div className="flex flex-col gap-0.5 w-6">
                                        <div
                                            className={`h-0.5 rounded-full w-full ${isCanvasActive ? "bg-indigo-200" : "bg-slate-200"}`}
                                        />
                                        <div
                                            className={`h-0.5 rounded-full w-2/3 ${isCanvasActive ? "bg-indigo-200" : "bg-slate-200"}`}
                                        />
                                    </div>
                                </div>

                                {/* Section name */}
                                <div className="flex flex-col min-w-0">
                                    <span
                                        className={`
                    text-xs font-medium truncate
                    ${isCanvasActive ? "text-slate-800" : "text-slate-600"}
                  `}
                                    >
                                        {section.label}
                                    </span>
                                    <span className="text-[9px] text-slate-400 truncate hidden group-hover:block">
                                        {section.type}
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
