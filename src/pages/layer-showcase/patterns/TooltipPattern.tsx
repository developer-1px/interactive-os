/**
 * Layer Playground: Tooltip Showcase
 *
 * Demonstrates OS tooltip overlay:
 *   - Hover/Focus trigger → tooltip appears
 *   - Non-interactive content
 *   - Escape dismisses
 *
 * OS GAP EXPECTED: hover trigger headless support is incomplete.
 * This showcase exists to identify and document the gap.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { Icon } from "@/components/Icon";

// ─── App Definition ───

export const TooltipShowcaseApp = defineApp("layer-tooltip-showcase", {});

const tooltipZone = TooltipShowcaseApp.createZone("tooltip-zone");

const TooltipTrigger = tooltipZone.overlay("layer-tooltip", {
  role: "tooltip",
});

// ─── React Component ───

export function TooltipPattern() {
  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Tooltip</h3>
      <p className="text-sm text-gray-500 mb-4">
        Hover or focus the button to show a tooltip. Tooltips are{" "}
        <strong>non-interactive</strong> — they contain only text.{" "}
        <kbd>Escape</kbd> dismisses the tooltip.
      </p>
      <p className="text-xs text-amber-600 mb-4">
        Note: Hover trigger is not yet supported in headless testing (OS gap).
      </p>

      <TooltipTrigger.Root>
        <TooltipTrigger.Trigger>
          <button
            type="button"
            className="
              inline-flex items-center gap-2 px-4 py-2
              border border-gray-300 bg-white text-sm rounded-lg
              hover:bg-gray-50 transition-colors
              focus:ring-2 focus:ring-violet-400 focus:outline-none
            "
          >
            <Icon name="help-circle" size={14} />
            Hover me
          </button>
        </TooltipTrigger.Trigger>

        <TooltipTrigger.Popover
          aria-label="Help information"
          className="
            absolute top-full left-0 mt-2 z-50
            bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg
            max-w-xs
          "
        >
          This is a tooltip with helpful information about the button.
        </TooltipTrigger.Popover>
      </TooltipTrigger.Root>
    </div>
  );
}
