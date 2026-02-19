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
        (s) => s.os.focus.zones[CANVAS_ZONE_ID]?.lastFocusedId ?? null,
    );

    return (
        <BuilderSidebarUI.Zone
            id={SIDEBAR_ZONE_ID}
            className="w-48 shrink-0 bg-white border-r border-slate-200 flex flex-col py-3 overflow-y-auto"
            aria-label="Sections"
        >
            <div className="px-3 pb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Sections
                </span>
            </div>

            {sections.map((section, idx) => {
                const isCanvasActive = focusedCanvasId?.startsWith(section.id) ?? false;

                return (
                    <BuilderSidebarUI.Item key={section.id} id={`sidebar-${section.id}`}>
                        <div
                            className={`
                mx-2 mb-1 rounded-md cursor-pointer transition-colors
                flex items-center gap-2 px-2 py-2
                text-xs font-medium
                ${isCanvasActive ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-50"}
              `}
                        >
                            {/* Slide number */}
                            <span className="w-4 text-[10px] text-slate-400 tabular-nums text-right shrink-0">
                                {idx + 1}
                            </span>

                            {/* Thumbnail preview box */}
                            <div className="w-12 h-8 rounded border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center">
                                <span className="text-[7px] text-slate-300 font-medium">
                                    {section.label.slice(0, 3).toUpperCase()}
                                </span>
                            </div>

                            {/* Section name */}
                            <span className="truncate">{section.label}</span>
                        </div>
                    </BuilderSidebarUI.Item>
                );
            })}
        </BuilderSidebarUI.Zone>
    );
}
