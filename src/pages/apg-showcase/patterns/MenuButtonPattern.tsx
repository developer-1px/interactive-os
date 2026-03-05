/**
 * APG Menu Button Pattern -- Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/
 *
 * W3C APG Menu Button (element.focus() variant):
 *   - A button that opens a menu popup
 *   - Button: native <button>, aria-haspopup="true", aria-expanded, aria-controls
 *   - Menu: role="menu", aria-labelledby → button, vertical nav, loop, Escape closes
 *   - Enter/Space on button opens menu (focus → first menuitem)
 *   - Down Arrow on button opens menu (optional, focus → first menuitem)
 *   - Escape in menu returns focus to button
 *   - Click on button opens/closes menu
 *
 * ZIFT classification: Trigger (button) + Zone (menu popup via createTrigger)
 *
 * OS pattern: createTrigger({ role: "menu" }) auto-dispatches OS_OVERLAY_OPEN.
 *   Menu.Popover renders a non-modal Zone (role="menu") when overlay is open.
 *   Trigger is wrapped in a toolbar zone for keyboard focus management.
 */

import { Item } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { Icon } from "@/components/Icon";

/**
 * Menu items for the "Actions" dropdown
 */
const MENU_ITEMS = [
  { id: "action-cut", label: "Cut", icon: "x" as const },
  { id: "action-copy", label: "Copy", icon: "copy" as const },
  { id: "action-paste", label: "Paste", icon: "clipboard" as const },
  { id: "action-delete", label: "Delete", icon: "trash" as const },
];

// ─── App + Zones (defineApp pattern) ───

export const MenuButtonApp = defineApp<Record<string, never>>(
  "apg-menu-button",
  {},
);

// Trigger zone: toolbar with a single menu button
const triggerZone = MenuButtonApp.createZone("mb-trigger-zone");
const TriggerUI = triggerZone.bind({ role: "toolbar" });

// Menu trigger: createTrigger with role="menu" — pure projection + Popover
const ActionsMenu = MenuButtonApp.createTrigger({
  id: "apg-menu-button-popup",
  role: "menu",
});

/**
 * MenuButtonPattern
 *
 * W3C APG Menu Button using defineApp + createTrigger({ role: "menu" }).
 * ActionsMenu.Trigger handles:
 *   - Click → OS_OVERLAY_OPEN (menu opens)
 *   - Enter/Space (via OS_ACTIVATE → onActivate) → menu opens
 *   - aria-haspopup, aria-expanded managed by the <button>
 *
 * ActionsMenu.Popover handles:
 *   - Conditional rendering (no <dialog>)
 *   - Zone with role="menu" (vertical nav, loop, escape dismiss)
 *   - Outside click → close
 */
export function MenuButtonPattern() {
  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Menu Button</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Menu Button: A button that opens a dropdown menu.{" "}
        <kbd>Enter</kbd>, <kbd>Space</kbd>, or click opens the menu.{" "}
        <kbd>Escape</kbd> closes it.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <TriggerUI.Zone aria-label="Actions Menu">
        <ActionsMenu.Root>
          <div className="relative inline-block">
            <ActionsMenu.Trigger>
              <button
                type="button"
                className="
                  group inline-flex items-center gap-2 px-4 py-2
                  bg-indigo-600 text-white text-sm font-medium rounded-lg
                  hover:bg-indigo-700 transition-colors
                  focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:outline-none
                "
              >
                Actions
                <Icon
                  name="chevron-down"
                  size={14}
                  className="transition-transform group-aria-expanded:rotate-180"
                />
              </button>
            </ActionsMenu.Trigger>

            <ActionsMenu.Popover
              aria-labelledby="apg-menu-button-popup-trigger"
              className="
                absolute top-full left-0 mt-1 w-48 z-50
                bg-white border border-gray-200 rounded-lg shadow-lg py-1
                animate-in fade-in slide-in-from-top-1 duration-150
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
                    data-[focused=true]:bg-indigo-50 data-[focused=true]:text-indigo-700
                    data-[focused=true]:outline-none
                  "
                >
                  <Icon
                    name={item.icon}
                    size={14}
                    className="text-gray-400 group-data-[focused=true]:text-indigo-500"
                  />
                  {item.label}
                </Item>
              ))}
            </ActionsMenu.Popover>
          </div>
        </ActionsMenu.Root>
      </TriggerUI.Zone>
    </div>
  );
}
