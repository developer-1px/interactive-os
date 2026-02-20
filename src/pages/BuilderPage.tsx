import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { useState } from "react";
import {
  BuilderApp,
  BuilderCanvasUI,
  loadPagePreset,
} from "@/apps/builder/app";
import { BuilderCursor } from "@/apps/builder/BuilderCursor";
import { PAGE_PRESETS } from "@/apps/builder/presets/pages";
// @ts-expect-error — spec-wrapper plugin transforms at build time
import runBuilderSpec from "@/apps/builder/tests/e2e/builder-spatial.spec.ts";
import { os } from "@/os/kernel";
import {
  EditorToolbar,
  NCPFooterBlock,
  NCPHeroBlock,
  NCPNewsBlock,
  NCPPricingBlock,
  NCPServicesBlock,
  PropertiesPanel,
  SectionSidebar,
  TabContainerBlock,
  type ViewportMode,
} from "./builder";

/**
 * BuilderPage
 *
 * Visual CMS / Web Builder 데모 - Light Theme
 *
 * Zone behavior (navigation, keybindings, itemFilter) is declared
 * in app.ts via canvasZone.bind() — not wired manually here.
 * PropertiesPanel reads focused item type directly via OS item queries.
 */
export default function BuilderPage() {
  usePlaywrightSpecs("builder", [runBuilderSpec]);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  const getViewportStyle = () => {
    switch (viewport) {
      case "mobile":
        return { width: "375px", height: "100%" };
      case "tablet":
        return { width: "768px", height: "100%" };
      default:
        return { width: "100%", height: "100%" };
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Editor Toolbar */}
      <EditorToolbar
        currentViewport={viewport}
        onViewportChange={setViewport}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Section Sidebar (PPT-style) */}
        <SectionSidebar />

        {/* Canvas Area — behavior declared in app.ts bind() */}
        <BuilderCanvasUI.Zone className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-100/50">
          {/* Builder Cursor — visual focus indicator inside scroll container */}
          <BuilderCursor />

          {/* Page Being Edited - Centered Canvas */}
          <div className="min-h-full flex justify-center py-8 px-4 transition-all duration-300 ease-in-out">
            <div
              className="transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col shadow-2xl ring-1 ring-slate-900/5 bg-white shrink-0 origin-top"
              style={getViewportStyle()}
            >
              {/* Content Container — dynamic from state */}
              <div className="flex-1 bg-white relative group/canvas">
                <SectionRenderer />
              </div>
            </div>
          </div>
        </BuilderCanvasUI.Zone>

        {/* Properties Panel (Fixed Right) — reads state from BuilderApp */}
        <PropertiesPanel />
      </div>
    </div>
  );
}

// ─── Section Renderer — maps section.type → block component ───

const BLOCK_COMPONENTS: Record<string, React.FC<{ id: string }>> = {
  hero: NCPHeroBlock,
  news: NCPNewsBlock,
  services: NCPServicesBlock,
  pricing: NCPPricingBlock,
  tabs: TabContainerBlock, // generic tab container — data-driven from Block.children
  footer: NCPFooterBlock,
};

function SectionRenderer() {
  const blocks = BuilderApp.useComputed((s) => s.data.blocks);

  if (blocks.length === 0) {
    return <PagePresetPicker />;
  }

  return (
    <>
      {blocks.map((block) => {
        const Component = BLOCK_COMPONENTS[block.type];
        return Component ? <Component key={block.id} id={block.id} /> : null;
      })}
    </>
  );
}

/** Shown when canvas is empty — lets user pick a page preset to start from. */
function PagePresetPicker() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            새 페이지를 시작하세요
          </h2>
          <p className="text-sm text-slate-500">
            템플릿을 선택하거나, 빈 페이지에서 블록을 하나씩 추가하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PAGE_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() =>
                os.dispatch(loadPagePreset({ blocks: preset.blocks }))
              }
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 text-center cursor-pointer"
            >
              <span className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl bg-slate-50 group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-300">
                {preset.icon}
              </span>
              <div>
                <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors block">
                  {preset.label}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {preset.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
