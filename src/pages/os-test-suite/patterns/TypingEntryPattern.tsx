/**
 * OS Test Suite: typingEntry Zone Option
 *
 * Exercises: when typingEntry: true, printable characters (a-z, 0-9)
 * trigger onAction callback during navigation.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import type { TestCase } from "../index";

// ─── State ───

interface TypingEntryState {
  actionCount: number;
}

// ─── App Definition ───

export const TypingEntryApp = defineApp<TypingEntryState>(
  "os-test-typing-entry",
  { actionCount: 0 },
);

// Zone WITH typingEntry
const typingZone = TypingEntryApp.createZone("typing-zone");

const recordAction = typingZone.command("recordAction", (ctx) => ({
  state: { ...ctx.state, actionCount: ctx.state.actionCount + 1 },
}));

const TypingUI = typingZone.bind("grid", {
  getItems: () => ["box-a", "box-b", "box-c"],
  onAction: () => recordAction(),
  options: {
    typingEntry: true,
  },
});

// Zone WITHOUT typingEntry (control group)
const normalZone = TypingEntryApp.createZone("normal-zone");

const recordActionNormal = normalZone.command("recordActionNormal", (ctx) => ({
  state: { ...ctx.state, actionCount: ctx.state.actionCount + 1 },
}));

const NormalUI = normalZone.bind("listbox", {
  getItems: () => ["item-x", "item-y", "item-z"],
  onAction: () => recordActionNormal(),
});

// ─── Test Case Registry ───

export const typingEntryTests: TestCase[] = [
  { name: "printable char triggers onAction", status: "fail" },
  { name: "digit triggers onAction", status: "fail" },
  { name: "ArrowDown does NOT trigger onAction", status: "fail" },
  { name: "Enter still triggers onAction", status: "fail" },
  { name: "Ctrl+a does NOT trigger onAction", status: "fail" },
  { name: "no typingEntry — char is ignored", status: "fail" },
];

// ─── React Component ───

const BOXES = [
  { id: "box-a", label: "Box A" },
  { id: "box-b", label: "Box B" },
  { id: "box-c", label: "Box C" },
];

const ITEMS = [
  { id: "item-x", label: "Item X" },
  { id: "item-y", label: "Item Y" },
  { id: "item-z", label: "Item Z" },
];

export function TypingEntryPattern() {
  return (
    <div className="max-w-sm space-y-4">
      <h3 className="text-lg font-semibold">typingEntry Zone Option</h3>

      <div>
        <p className="text-sm text-gray-500 mb-2">
          Grid with <code>typingEntry: true</code> — type any letter/digit to
          trigger action.
        </p>
        <TypingUI.Zone
          aria-label="Typing Entry Grid"
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {BOXES.map(({ id, label }) => (
            <TypingUI.Item
              key={id}
              id={id}
              className="
                px-4 py-3 text-sm border-b border-gray-100 last:border-b-0
                data-[focused=true]:bg-blue-50 data-[focused=true]:text-blue-700
                cursor-pointer select-none
              "
            >
              {label}
            </TypingUI.Item>
          ))}
        </TypingUI.Zone>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-2">
          Listbox without typingEntry (control) — typing should do nothing.
        </p>
        <NormalUI.Zone
          aria-label="Normal Listbox"
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {ITEMS.map(({ id, label }) => (
            <NormalUI.Item
              key={id}
              id={id}
              className="
                px-4 py-3 text-sm border-b border-gray-100 last:border-b-0
                data-[focused=true]:bg-gray-50
                cursor-pointer select-none
              "
            >
              {label}
            </NormalUI.Item>
          ))}
        </NormalUI.Zone>
      </div>
    </div>
  );
}
