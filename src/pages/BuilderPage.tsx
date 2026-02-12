import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { OS } from "@os/AntigravityOS";
import { useEffect, useState } from "react";
import { FocusDebugOverlay } from "@/apps/builder/FocusDebugOverlay";
import { kernel } from "@/os/kernel";
// Playwright spec
// @ts-expect-error
import runBuilderSpatial from "../../e2e/builder/builder-spatial.spec.ts";
import {
  EditorToolbar,
  NCPFooterBlock,
  NCPHeroBlock,
  NCPNewsBlock,
  NCPServicesBlock,
  PropertiesPanel,
  type PropertyType,
  type ViewportMode,
} from "./builder";

/**
 * BuilderPage
 *
 * Visual CMS / Web Builder 데모 - Light Theme
 */
export default function BuilderPage() {
  usePlaywrightSpecs("pw-builder-spatial", [runBuilderSpatial]);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  // Derive selection from kernel focus
  const focusedId = kernel.useComputed((state) => state.os.focus.focused);
  const [selectedType, setSelectedType] = useState<PropertyType>("text");

  useEffect(() => {
    if (!focusedId) return;

    // Small delay to ensure DOM is updated if focus changed rapidly
    // But usually sync is fine.
    const el = document.getElementById(focusedId);
    if (!el) return;

    let type: PropertyType = "text"; // Default fallback

    // 1. Check explicit builder type
    if (el.dataset.builderType) {
      type = el.dataset.builderType as PropertyType;
    }
    // 2. Infer from explicit level
    else if (el.dataset.level === "section") {
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
      // OS.Field usually has this attribute
      type = "text";
    }

    setSelectedType(type);
  }, [focusedId]);

  const getViewportStyle = () => {
    switch (viewport) {
      case "mobile":
        return { width: "375px", height: "100%" }; // Mobile preset
      case "tablet":
        return { width: "768px", height: "100%" }; // Tablet preset
      default:
        return { width: "100%", height: "100%" }; // Full width
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
        {/* Canvas Area */}
        <OS.Zone
          id="builder-canvas"
          className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-100/50"
          options={{
            navigate: { orientation: "corner" },
            tab: { behavior: "trap" },
          }}
        >
          {/* Focus Debug Overlay — inside scroll container */}
          <FocusDebugOverlay />

          {/* Page Being Edited - Centered Canvas */}
          <div className="min-h-full flex justify-center py-8 px-4 transition-all duration-300 ease-in-out">
            <div
              className="transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col shadow-2xl ring-1 ring-slate-900/5 bg-white shrink-0 origin-top"
              style={getViewportStyle()}
            >
              {/* Content Container */}
              <div className="flex-1 bg-white relative group/canvas">
                <NCPHeroBlock />
                <NCPNewsBlock />
                <NCPServicesBlock />
                <NCPFooterBlock />
              </div>
            </div>
          </div>
        </OS.Zone>

        {/* Properties Panel (Fixed Right) */}
        <PropertiesPanel selectedType={selectedType} />
      </div>
    </div>
  );
}
