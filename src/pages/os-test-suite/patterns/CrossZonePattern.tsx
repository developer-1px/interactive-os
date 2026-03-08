/**
 * OS Test Suite: Cross-Zone Focus Transfer
 *
 * Exercises zone boundary crossing:
 *   1. Two independent zones (toolbar + list)
 *   2. Click item in zone B while zone A is active → activeZoneId transfers
 *   3. Tab moves between zones
 *   4. Focus state is consistent across zone boundary
 *
 * Known gap: OG-018 — headless page.goto() sets single activeZoneId.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { OS_ACTIVATE } from "@os-sdk/os";
import type { TestCase } from "../index";

export const crossZoneTests: TestCase[] = [
  { name: "click activates zone (bootstrap)", status: "pass" },
  { name: "click item in zone A focuses that item", status: "pass" },
  { name: "click item in zone B transfers activeZoneId", status: "pass" },
  { name: "Tab transfers focus to next zone", status: "pass" },
  { name: "Shift+Tab transfers focus to previous zone", status: "pass" },
  { name: "Tab from last zone wraps", status: "pass" },
  { name: "click in zone B while zone A active transfers", status: "pass" },
];

// ─── App Definition ───

export const CrossZoneApp = defineApp("os-test-cross-zone", {});

const toolbarZone = CrossZoneApp.createZone("cross-toolbar");
const ToolbarUI = toolbarZone.bind({
  role: "toolbar",
  getItems: () => ["btn-bold", "btn-italic", "btn-underline"],
  options: {
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

const listZone = CrossZoneApp.createZone("cross-list");
const ListUI = listZone.bind({
  role: "listbox",
  getItems: () => ["file-1", "file-2", "file-3"],
  options: {
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

// ─── React Component ───

const ACTIONS = [
  { id: "btn-bold", label: "B", title: "Bold" },
  { id: "btn-italic", label: "I", title: "Italic" },
  { id: "btn-underline", label: "U", title: "Underline" },
];

const FILES = [
  { id: "file-1", label: "document.txt" },
  { id: "file-2", label: "image.png" },
  { id: "file-3", label: "notes.md" },
];

export function CrossZonePattern() {
  return (
    <div className="max-w-md space-y-6">
      <h3 className="text-lg font-semibold mb-3">Cross-Zone Focus Transfer</h3>
      <p className="text-sm text-gray-500 mb-4">
        Two zones: toolbar (top) and list (bottom). Click items across zones.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd>{" "}
        should transfer focus between zones.
      </p>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Zone A: Toolbar
        </p>
        <ToolbarUI.Zone
          aria-label="Formatting"
          className="flex gap-1 p-2 border border-gray-200 rounded-lg bg-white"
        >
          {ACTIONS.map(({ id, label }) => (
            <ToolbarUI.Item
              key={id}
              id={id}
              className="
                w-10 h-10 flex items-center justify-center
                font-bold text-sm rounded-md
                border border-gray-200
                data-[focused=true]:ring-2 data-[focused=true]:ring-emerald-300
                aria-selected:bg-emerald-100
                hover:bg-gray-50
              "
            >
              {label}
            </ToolbarUI.Item>
          ))}
        </ToolbarUI.Zone>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Zone B: List
        </p>
        <ListUI.Zone
          aria-label="Files"
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          {FILES.map(({ id, label }) => (
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
    </div>
  );
}
