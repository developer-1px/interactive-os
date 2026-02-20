import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { useState } from "react";
import { BuilderApp, BuilderCanvasUI } from "@/apps/builder/app";
import { BuilderCursor } from "@/apps/builder/BuilderCursor";
// @ts-expect-error — spec-wrapper plugin transforms at build time
import runBuilderSpec from "@/apps/builder/tests/e2e/builder-spatial.spec.ts";
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

  return (
    <>
      {blocks.map((block) => {
        const Component = BLOCK_COMPONENTS[block.type];
        return Component ? <Component key={block.id} id={block.id} /> : null;
      })}
    </>
  );
}
