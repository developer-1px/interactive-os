import { OS } from "@os/features/AntigravityOS";
import { FocusDebugOverlay } from "@os/features/focus/ui/FocusDebugOverlay";
import { usePlaywrightSpecs } from "@os/testBot/playwright/loader";
import { useState } from "react";
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
  const [selectedType, setSelectedType] = useState<PropertyType>("text"); // Default to text for demo

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
                {/* Mock Click Handlers for Demo */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Hero Text Click Zone */}
                  <div
                    className="absolute top-32 left-10 w-1/2 h-32 cursor-pointer pointer-events-auto hover:ring-2 hover:ring-violet-500/50 transition-all"
                    onClick={() => setSelectedType("text")}
                    title="Select Text"
                  />
                  {/* Button Click Zone */}
                  <div
                    className="absolute top-72 left-10 w-40 h-12 cursor-pointer pointer-events-auto hover:ring-2 hover:ring-emerald-500/50 transition-all"
                    onClick={() => setSelectedType("button")}
                    title="Select Button"
                  />
                  {/* Image Click Zone */}
                  <div
                    className="absolute top-20 right-10 w-1/3 h-96 cursor-pointer pointer-events-auto hover:ring-2 hover:ring-blue-500/50 transition-all"
                    onClick={() => setSelectedType("image")}
                    title="Select Image"
                  />
                  {/* Section Click Zone (Bottom) */}
                  <div
                    className="absolute bottom-0 left-0 w-full h-20 cursor-pointer pointer-events-auto hover:ring-2 hover:ring-amber-500/50 transition-all"
                    onClick={() => setSelectedType("section")}
                    title="Select Section"
                  />
                </div>

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
