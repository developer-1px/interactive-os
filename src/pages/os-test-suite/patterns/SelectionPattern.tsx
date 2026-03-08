/**
 * OS Test Suite: Selection Modes
 *
 * Exercises selection interaction chain:
 *   1. Single select (click replaces)
 *   2. Multi-select (Shift+click range, Ctrl+click toggle)
 *   3. Keyboard select (Space, Shift+Arrow)
 *   4. Select all (Meta+A)
 */

import { Item, Zone } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { OS_ACTIVATE } from "@os-sdk/os";
import type { TestCase } from "../index";

export const selectionTests: TestCase[] = [
  { name: "click selects item (single)", status: "pass" },
  { name: "click another replaces selection (single)", status: "pass" },
  { name: "Space toggles selection on focused item", status: "pass" },
  {
    name: "click selects single item (multi, replace mode)",
    status: "fail",
    gap: "multi-select click returns empty",
  },
  {
    name: "Shift+click selects range",
    status: "fail",
    gap: "multi-select modifier not applied",
  },
  {
    name: "Meta+click toggles individual items",
    status: "fail",
    gap: "multi-select modifier not applied",
  },
  {
    name: "Shift+ArrowDown extends selection",
    status: "fail",
    gap: "multi-select keyboard range",
  },
  { name: "Meta+A selects all", status: "fail", gap: "multi-select keyboard" },
];

// ─── App Definition ───

export const SelectionApp = defineApp("os-test-selection", {});

const singleZone = SelectionApp.createZone("select-single");
const SingleUI = singleZone.bind({
  role: "listbox",
  getItems: () => ["s-alpha", "s-bravo", "s-charlie", "s-delta"],
  options: {
    select: { mode: "single", followFocus: false },
    activate: { onClick: true },
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

const multiZone = SelectionApp.createZone("select-multi");
const MultiUI = multiZone.bind({
  role: "listbox",
  getItems: () => ["m-alpha", "m-bravo", "m-charlie", "m-delta", "m-echo"],
  options: {
    select: { mode: "multiple" },
    activate: { onClick: true },
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

// ─── React Component ───

const SINGLE_ITEMS = [
  { id: "s-alpha", label: "Alpha" },
  { id: "s-bravo", label: "Bravo" },
  { id: "s-charlie", label: "Charlie" },
  { id: "s-delta", label: "Delta" },
];

const MULTI_ITEMS = [
  { id: "m-alpha", label: "Alpha" },
  { id: "m-bravo", label: "Bravo" },
  { id: "m-charlie", label: "Charlie" },
  { id: "m-delta", label: "Delta" },
  { id: "m-echo", label: "Echo" },
];

export function SelectionPattern() {
  return (
    <div className="max-w-lg space-y-8">
      <h3 className="text-lg font-semibold">Selection Modes</h3>
      <p className="text-sm text-gray-500">
        Single-select (top) and multi-select (bottom). Try{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
          Shift+Click
        </kbd>{" "}
        for range and{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
          Ctrl+Click
        </kbd>{" "}
        for toggle.
      </p>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Single Select (followFocus: false)
        </p>
        <SingleUI.Zone
          aria-label="Single Select"
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          {SINGLE_ITEMS.map(({ id, label }) => (
            <SingleUI.Item
              key={id}
              id={id}
              className="
                px-4 py-3 text-sm border-b border-gray-100 last:border-b-0
                data-[focused=true]:bg-emerald-50
                aria-selected:bg-emerald-100 aria-selected:text-emerald-800
                cursor-pointer select-none
              "
            >
              {label}
            </SingleUI.Item>
          ))}
        </SingleUI.Zone>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Multi Select (Shift+Click range, Ctrl+Click toggle)
        </p>
        <MultiUI.Zone
          aria-label="Multi Select"
          aria-multiselectable="true"
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          {MULTI_ITEMS.map(({ id, label }) => (
            <MultiUI.Item
              key={id}
              id={id}
              className="
                px-4 py-3 text-sm border-b border-gray-100 last:border-b-0
                data-[focused=true]:bg-emerald-50
                aria-selected:bg-emerald-100 aria-selected:text-emerald-800
                cursor-pointer select-none
              "
            >
              {label}
            </MultiUI.Item>
          ))}
        </MultiUI.Zone>
      </div>
    </div>
  );
}
