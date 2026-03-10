/**
 * Layer Playground: Listbox Dropdown Showcase
 *
 * Demonstrates OS listbox overlay:
 *   - Trigger click → listbox popup opens
 *   - Arrow selection within listbox
 *   - Enter confirms selection → popup closes
 *   - Escape closes → focus restores
 */

import { PopoverPortal } from "@os-react/6-project/widgets/PopoverPortal";
import { Item } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { OS_OVERLAY_OPEN } from "@os-sdk/os";
import { Icon } from "@/components/Icon";

// ─── App Definition ───

export const ListboxDropdownShowcaseApp = defineApp(
  "layer-listbox-dropdown-showcase",
  {},
);

const triggerZone = ListboxDropdownShowcaseApp.createZone(
  "listbox-trigger-zone",
);
triggerZone.bind("toolbar", {
  getItems: () => ["OpenListboxBtn"],
  triggers: {
    OpenListboxBtn: () =>
      OS_OVERLAY_OPEN({
        id: "layer-listbox",
        type: "menu",
        entry: "first",
      }),
  },
});

const listboxZone = ListboxDropdownShowcaseApp.createZone("layer-listbox");
listboxZone.bind("listbox", {
  getItems: () => ["opt-red", "opt-green", "opt-blue", "opt-yellow"],
});

// ─── React Component ───

const OPTIONS = [
  { id: "opt-red", label: "Red", color: "bg-red-400" },
  { id: "opt-green", label: "Green", color: "bg-green-400" },
  { id: "opt-blue", label: "Blue", color: "bg-blue-400" },
  { id: "opt-yellow", label: "Yellow", color: "bg-yellow-400" },
];

const listbox = triggerZone.overlay("layer-listbox", {
  role: "listbox",
});

export function ListboxDropdownPattern() {
  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Listbox Dropdown</h3>
      <p className="text-sm text-gray-500 mb-4">
        A trigger that opens a listbox popup for selection. <kbd>Arrow</kbd>{" "}
        keys navigate options. <kbd>Enter</kbd> selects. <kbd>Escape</kbd>{" "}
        closes.
      </p>

      <div className="relative inline-block">
        <button
          {...listbox.trigger()}
          type="button"
          className="
            inline-flex items-center gap-2 px-4 py-2
            border border-gray-300 bg-white text-sm rounded-lg
            hover:bg-gray-50 transition-colors
            focus:ring-2 focus:ring-violet-400 focus:outline-none
          "
        >
          <Icon name="layers" size={14} />
          Choose Color
          <Icon name="chevron-down" size={14} className="text-gray-400" />
        </button>

        <PopoverPortal
          overlayId="layer-listbox"
          role="listbox"
          aria-label="Color options"
          className="
            absolute top-full left-0 mt-1 w-48 z-50
            bg-white border border-gray-200 rounded-lg shadow-lg py-1
          "
        >
          {OPTIONS.map((opt) => (
            <Item
              key={opt.id}
              id={opt.id}
              role="option"
              className="
                flex items-center gap-3 px-3 py-2 text-sm text-gray-700
                cursor-pointer select-none
                data-[focused=true]:bg-violet-50 data-[focused=true]:text-violet-700
              "
            >
              <span className={`w-3 h-3 rounded-full ${opt.color}`} />
              {opt.label}
            </Item>
          ))}
        </PopoverPortal>
      </div>
    </div>
  );
}
