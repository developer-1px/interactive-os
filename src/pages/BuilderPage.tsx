import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { useEffect, useState } from "react";
import {
  BuilderApp,
  BuilderCanvasUI,
  type PropertyType,
  selectElement,
} from "@/apps/builder/app";
import { FocusDebugOverlay } from "@/apps/builder/FocusDebugOverlay";
// @ts-expect-error — spec-wrapper plugin transforms at build time
import runBuilderSpec from "@/apps/builder/tests/e2e/builder-spatial.spec.ts";
import { kernel } from "@/os/kernel";
import {
  EditorToolbar,
  NCPFooterBlock,
  NCPHeroBlock,
  NCPNewsBlock,
  NCPPricingBlock,
  NCPServicesBlock,
  PropertiesPanel,
  SectionSidebar,
  type ViewportMode,
} from "./builder";

const CANVAS_ZONE_ID = "builder-canvas";

/**
 * BuilderPage
 *
 * Visual CMS / Web Builder 데모 - Light Theme
 * Kernel focus → BuilderApp.selectElement 동기화
 *
 * Zone behavior (navigation, keybindings, itemFilter) is declared
 * in app.ts via canvasZone.bind() — not wired manually here.
 */
export default function BuilderPage() {
  usePlaywrightSpecs("builder", [runBuilderSpec]);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  // Derive selection from builder-canvas zone's last focused item.
  // Uses lastFocusedId so selection persists even when panel gains focus.
  const focusedId = kernel.useComputed(
    (state) => state.os.focus.zones[CANVAS_ZONE_ID]?.lastFocusedId ?? null,
  );

  useEffect(() => {
    if (!focusedId) {
      kernel.dispatch(selectElement({ id: null, type: null }));
      return;
    }

    const el = document.getElementById(focusedId);
    if (!el) return;

    let type: PropertyType = "text"; // Default fallback

    // 1. Check explicit builder type
    if (el.dataset["builderType"]) {
      type = el.dataset["builderType"] as PropertyType;
    }
    // 2. Infer from explicit level
    else if (el.dataset["level"] === "section") {
      type = "section";
    }
    // 3. Infer from DOM tags/structure
    else if (el.tagName === "IMG" || el.querySelector("img")) {
      type = "image";
    } else if (el.tagName === "A" || el.closest("a")) {
      type = "link";
    } else if (el.tagName === "BUTTON" || el.closest("button")) {
      type = "button";
    } else if (el.querySelector("svg")) {
      type = "icon";
    } else if (
      el.hasAttribute("data-os-field") ||
      el.querySelector("[data-os-field]")
    ) {
      type = "text";
    }

    kernel.dispatch(selectElement({ id: focusedId, type }));
  }, [focusedId]);

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
        <BuilderCanvasUI.Zone
          id={CANVAS_ZONE_ID}
          className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-100/50"
        >
          {/* Focus Debug Overlay — inside scroll container */}
          <FocusDebugOverlay />

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

const BLOCK_COMPONENTS: Record<
  string,
  React.FC<{ id: string }>
> = {
  hero: NCPHeroBlock,
  news: NCPNewsBlock,
  services: NCPServicesBlock,
  pricing: NCPPricingBlock,
  footer: NCPFooterBlock,
};

function SectionRenderer() {
  const blocks = BuilderApp.useComputed((s) => s.data.blocks);

  return (
    <>
      {blocks.map((block) => {
        const Component = BLOCK_COMPONENTS[block.type];
        return Component ? (
          <Component key={block.id} id={block.id} />
        ) : null;
      })}
    </>
  );
}
