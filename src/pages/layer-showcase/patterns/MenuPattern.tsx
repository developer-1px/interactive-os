/**
 * Layer Playground: Menu Showcase
 *
 * Demonstrates OS menu overlay:
 *   - Trigger click → dropdown menu opens
 *   - Arrow nav (vertical, loop)
 *   - Enter activates item → menu closes
 *   - Escape closes → focus restores to trigger
 */

import { PopoverPortal } from "@os-react/6-project/widgets/PopoverPortal";
import { Item } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { OS_OVERLAY_OPEN } from "@os-sdk/os";
import { Icon } from "@/components/Icon";

// ─── App Definition ───

export const MenuShowcaseApp = defineApp("layer-menu-showcase", {});

const triggerZone = MenuShowcaseApp.createZone("menu-trigger-zone");
triggerZone.bind("toolbar", {
  getItems: () => ["OpenMenuBtn"],
  triggers: {
    OpenMenuBtn: () =>
      OS_OVERLAY_OPEN({
        id: "layer-menu",
        type: "menu",
        entry: "first",
      }),
  },
});

const menuZone = MenuShowcaseApp.createZone("layer-menu");
menuZone.bind("menu", {
  getItems: () => ["menu-cut", "menu-copy", "menu-paste", "menu-delete"],
});

// ─── React Component ───

const MENU_ITEMS = [
  { id: "menu-cut", label: "Cut", icon: "x" as const },
  { id: "menu-copy", label: "Copy", icon: "copy" as const },
  { id: "menu-paste", label: "Paste", icon: "clipboard" as const },
  { id: "menu-delete", label: "Delete", icon: "trash" as const },
];

const menu = triggerZone.overlay("layer-menu", {
  role: "menu",
});

export function MenuPattern() {
  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Menu (Dropdown)</h3>
      <p className="text-sm text-gray-500 mb-4">
        Click the button to open a dropdown menu. <kbd>Arrow</kbd> keys
        navigate. <kbd>Enter</kbd> activates. <kbd>Escape</kbd> closes.
      </p>

      <div className="relative inline-block">
        <button
          {...menu.trigger()}
          type="button"
          className="
            group inline-flex items-center gap-2 px-4 py-2
            bg-violet-600 text-white text-sm font-medium rounded-lg
            hover:bg-violet-700 transition-colors
            focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:outline-none
          "
        >
          Edit Actions
          <Icon
            name="chevron-down"
            size={14}
            className="transition-transform group-aria-expanded:rotate-180"
          />
        </button>

        <PopoverPortal
          overlayId="layer-menu"
          aria-label="Edit Actions"
          className="
            absolute top-full left-0 mt-1 w-48 z-50
            bg-white border border-gray-200 rounded-lg shadow-lg py-1
          "
        >
          {MENU_ITEMS.map((item) => (
            <Item
              key={item.id}
              id={item.id}
              className="
                group flex items-center gap-3 px-3 py-2 text-sm text-gray-700
                cursor-pointer select-none
                hover:bg-gray-50
                data-[focused=true]:bg-violet-50 data-[focused=true]:text-violet-700
              "
            >
              <Icon
                name={item.icon}
                size={14}
                className="text-gray-400 group-data-[focused=true]:text-violet-500"
              />
              {item.label}
            </Item>
          ))}
        </PopoverPortal>
      </div>
    </div>
  );
}
