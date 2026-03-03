/**
 * APG Menu Button Pattern -- Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * W3C APG Menu Button:
 *   - A button that opens a menu popup
 *   - Button: role=button, aria-haspopup="menu", aria-expanded
 *   - Menu: role=menu, vertical navigation, loop, Escape closes
 *   - Enter/Space/Down Arrow on button opens menu
 *   - Escape in menu returns focus to button
 *
 * ZIFT classification: Trigger (button) + Zone (menu popup)
 *
 * OS pattern:
 *   Two zones: toolbar (trigger button) + menu (popup).
 *   Menu zone uses role="menu" with autoFocus + stack push/pop.
 *   The button triggers the menu open via onAction callback.
 *   CSS reads aria-expanded, data-focused, aria-haspopup.
 */

import { Zone } from "@os-react/6-project/Zone";
import { Item } from "@os-react/6-project/Item";
import { os } from "@os-core/engine/kernel";
import { OS_FOCUS } from "@os-core/4-command/focus";
import { Icon } from "@/components/Icon";

/**
 * Menu items for the "Actions" dropdown
 */
const MENU_ITEMS = [
  { id: "action-cut", label: "Cut", icon: "scissors" as const },
  { id: "action-copy", label: "Copy", icon: "copy" as const },
  { id: "action-paste", label: "Paste", icon: "clipboard" as const },
  { id: "action-delete", label: "Delete", icon: "trash-2" as const },
];

/**
 * MenuButtonPattern
 *
 * Demonstrates the W3C APG Menu Button pattern using two OS zones:
 *   1. A toolbar zone containing the trigger button
 *   2. A menu zone (popup) that opens on activation
 *
 * The menu zone uses role="menu" which provides:
 *   - Vertical navigation with loop
 *   - Escape closes (dismiss.escape: "close")
 *   - Tab trapped within menu
 *   - Auto-focus on first item when opened
 *   - Stack push/pop for focus restoration
 */
export function MenuButtonPattern() {
  // Track menu visibility via OS state
  const isOpen = os.useComputed(
    (s) => s.os.focus.activeZoneId === "apg-menu-button-menu",
  );

  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Menu Button</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Menu Button: A button that opens a dropdown menu.{" "}
        <kbd>Enter</kbd>, <kbd>Space</kbd>, or <kbd>Down Arrow</kbd> opens the
        menu. <kbd>Escape</kbd> closes it.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
      </p>

      <div className="relative inline-block">
        {/* Trigger Button Zone */}
        <Zone
          id="apg-menu-button-trigger"
          role="toolbar"
          options={{
            navigate: { orientation: "horizontal" },
          }}
          className="inline-flex"
          onAction={() => {
            // Open the menu: focus the menu zone's first item
            // The menu Zone has autoFocus=true + stack push, so
            // just setting focus to the menu zone is enough.
            os.dispatch(
              OS_FOCUS({
                zoneId: "apg-menu-button-menu",
                itemId: "action-cut",
              }),
            );
            return [];
          }}
        >
          <Item
            id="mb-actions-trigger"
            role="button"
            as="button"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            className="
              group inline-flex items-center gap-2 px-4 py-2
              bg-indigo-600 text-white text-sm font-medium rounded-lg
              hover:bg-indigo-700 transition-colors
              data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-offset-2
            "
          >
            Actions
            <Icon
              name="chevron-down"
              size={14}
              className="transition-transform group-aria-expanded:rotate-180"
            />
          </Item>
        </Zone>

        {/* Menu Popup Zone -- only rendered when open */}
        {isOpen && (
          <Zone
            id="apg-menu-button-menu"
            role="menu"
            options={{
              navigate: { orientation: "vertical", loop: true },
              dismiss: { escape: "close" },
              tab: { behavior: "trap" },
              project: { autoFocus: true },
            }}
            aria-label="Actions"
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
                role="menuitem"
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
          </Zone>
        )}
      </div>
    </div>
  );
}
