/**
 * Layer Playground: Popover Showcase
 *
 * Demonstrates OS popover overlay (non-modal):
 *   - Trigger click → popover opens
 *   - Non-modal: Tab should exit popover to next zone
 *   - Escape closes → focus restores to trigger
 *   - Outside click dismisses
 */

import { OS_OVERLAY_OPEN } from "@os-sdk/os";
import { Item } from "@os-react/internal";
import { PopoverPortal } from "@os-react/6-project/widgets/PopoverPortal";
import { defineApp } from "@os-sdk/app/defineApp";
import { Icon } from "@/components/Icon";

// ─── App Definition ───

export const PopoverShowcaseApp = defineApp("layer-popover-showcase", {});

const triggerZone = PopoverShowcaseApp.createZone("popover-trigger-zone");
triggerZone.bind({
  role: "toolbar",
  getItems: () => ["OpenPopoverBtn"],
  triggers: {
    OpenPopoverBtn: () =>
      OS_OVERLAY_OPEN({
        id: "layer-popover",
        type: "popover",
        entry: "first",
      }),
  },
});

const popoverZone = PopoverShowcaseApp.createZone("layer-popover");
popoverZone.bind({
  role: "group",
  getItems: () => ["popover-item-1", "popover-item-2", "popover-item-3"],
  options: {
    dismiss: { escape: "close" as const },
  },
});

// ─── React Component ───

const popover = triggerZone.overlay("layer-popover", {
  role: "popover",
});

export function PopoverPattern() {
  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Popover (Non-modal)</h3>
      <p className="text-sm text-gray-500 mb-4">
        Click the button to open a popover. Unlike Dialog, popover is{" "}
        <strong>non-modal</strong> — <kbd>Tab</kbd> can exit the popover.{" "}
        <kbd>Escape</kbd> closes it.
      </p>

      <div className="relative inline-block">
        <button
          {...popover.trigger()}
          type="button"
          className="
            inline-flex items-center gap-2 px-4 py-2
            bg-violet-600 text-white text-sm font-medium rounded-lg
            hover:bg-violet-700 transition-colors
            focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:outline-none
          "
        >
          <Icon name="info" size={14} />
          Show Info
        </button>

        <PopoverPortal
          overlayId="layer-popover"
          role="menu"
          aria-label="Information"
          className="
            absolute top-full left-0 mt-2 w-56 z-50
            bg-white border border-gray-200 rounded-lg shadow-lg p-3
          "
        >
          <Item
            id="popover-item-1"
            className="block px-2 py-1 text-sm text-gray-700 rounded data-[focused=true]:bg-violet-50"
          >
            Status: Active
          </Item>
          <Item
            id="popover-item-2"
            className="block px-2 py-1 text-sm text-gray-700 rounded data-[focused=true]:bg-violet-50"
          >
            Last updated: 2 min ago
          </Item>
          <Item
            id="popover-item-3"
            className="block px-2 py-1 text-sm text-gray-700 rounded data-[focused=true]:bg-violet-50"
          >
            Version: 1.2.3
          </Item>
        </PopoverPortal>
      </div>
    </div>
  );
}
