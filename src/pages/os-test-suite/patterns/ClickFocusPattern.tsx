/**
 * OS Test Suite: Click → Focus Chain
 *
 * Exercises the fundamental OS interaction chain:
 *   1. Click item → OS_ACTIVATE dispatched
 *   2. Focus moves to clicked item (focusedItemId updates)
 *   3. Keyboard navigation works from new focus position
 *
 * Verifies: click() in headless produces same state as browser click.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { OS_ACTIVATE } from "@os-sdk/os";
import type { TestCase } from "../index";

export const clickFocusTests: TestCase[] = [
  { name: "click item moves focus to that item", status: "pass" },
  { name: "click different item updates focus", status: "pass" },
  { name: "ArrowDown navigates from clicked position", status: "pass" },
  { name: "ArrowUp navigates backward from clicked position", status: "pass" },
  { name: "Home moves focus to first item", status: "pass" },
  { name: "End moves focus to last item", status: "pass" },
];

// ─── App Definition ───

export const ClickFocusApp = defineApp("os-test-click-focus", {});

const listZone = ClickFocusApp.createZone("click-focus-list");
const ListUI = listZone.bind({
  role: "listbox",
  getItems: () => ["item-a", "item-b", "item-c", "item-d", "item-e"],
  options: {
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

// ─── React Component ───

const ITEMS = [
  { id: "item-a", label: "Alpha" },
  { id: "item-b", label: "Bravo" },
  { id: "item-c", label: "Charlie" },
  { id: "item-d", label: "Delta" },
  { id: "item-e", label: "Echo" },
];

export function ClickFocusPattern() {
  return (
    <div className="max-w-sm">
      <h3 className="text-lg font-semibold mb-3">Click → Focus Chain</h3>
      <p className="text-sm text-gray-500 mb-4">
        Click any item. Focus should move to it. Then use{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
          Arrow keys
        </kbd>{" "}
        to navigate from the new position.
      </p>

      <ListUI.Zone
        aria-label="Click Focus Test"
        className="border border-gray-200 rounded-lg overflow-hidden"
      >
        {ITEMS.map(({ id, label }) => (
          <ListUI.Item
            key={id}
            id={id}
            className="
              px-4 py-3 text-sm border-b border-gray-100 last:border-b-0
              data-[focused=true]:bg-emerald-50 data-[focused=true]:text-emerald-700
              aria-selected:bg-emerald-100
              cursor-pointer select-none
            "
          >
            {label}
          </ListUI.Item>
        ))}
      </ListUI.Zone>
    </div>
  );
}
