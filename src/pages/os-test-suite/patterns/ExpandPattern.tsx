/**
 * OS Test Suite: Expand/Collapse
 *
 * Exercises disclosure expand/collapse chain:
 *   1. Enter/Space toggles aria-expanded
 *   2. Click toggles (via inputmap)
 *   3. Initial expand state from config
 *   4. Multiple items expand independently
 *
 * Known gap: OG-024 — dynamic item initial expand not declarative.
 */

import { Item, Zone } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { OS_EXPAND } from "@os-sdk/os";
import type { TestCase } from "../index";

export const expandTests: TestCase[] = [
  { name: "section-a starts expanded (initial config)", status: "fail", gap: "expand.initial not seeded in headless goto()" },
  { name: "section-b starts collapsed", status: "fail", gap: "expand.initial not seeded" },
  { name: "section-c starts collapsed", status: "fail", gap: "expand.initial not seeded" },
  { name: "Enter toggles expanded state", status: "fail", gap: "click bootstrap conflicts with toggle inputmap" },
  { name: "Space toggles expanded state", status: "fail", gap: "click bootstrap conflicts with toggle inputmap" },
  { name: "click toggles expanded state (via inputmap)", status: "fail", gap: "click bootstrap conflicts with toggle inputmap" },
  { name: "multiple items expand independently", status: "fail", gap: "expand.initial not seeded" },
];

// ─── App Definition ───

export const ExpandApp = defineApp("os-test-expand", {});

const disclosureZone = ExpandApp.createZone("expand-disclosure");
const DisclosureUI = disclosureZone.bind({
  role: "disclosure",
  getItems: () => ["section-a", "section-b", "section-c"],
  options: {
    expand: { mode: "all", initial: ["section-a"] },
    inputmap: { click: [OS_EXPAND({ toggle: true })] },
  },
});

// ─── React Component ───

const SECTIONS = [
  {
    id: "section-a",
    title: "Section A (initially expanded)",
    content: "Content for section A. This should be visible on load.",
  },
  {
    id: "section-b",
    title: "Section B (initially collapsed)",
    content: "Content for section B. Hidden until expanded.",
  },
  {
    id: "section-c",
    title: "Section C (initially collapsed)",
    content: "Content for section C. Hidden until expanded.",
  },
];

export function ExpandPattern() {
  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">Expand / Collapse</h3>
      <p className="text-sm text-gray-500 mb-4">
        Disclosure pattern.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> or{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd>{" "}
        toggles expand. Section A starts expanded.
      </p>

      <DisclosureUI.Zone
        aria-label="Sections"
        className="border border-gray-200 rounded-lg overflow-hidden bg-white"
      >
        {SECTIONS.map(({ id, title, content }) => (
          <DisclosureUI.Item
            key={id}
            id={id}
            className="border-b border-gray-100 last:border-b-0"
          >
            <div
              className="
                px-4 py-3 text-sm font-medium cursor-pointer select-none
                data-[focused=true]:bg-emerald-50
                aria-expanded:text-emerald-700
              "
            >
              {title}
            </div>
            <Item.Region>
              <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50">
                {content}
              </div>
            </Item.Region>
          </DisclosureUI.Item>
        ))}
      </DisclosureUI.Zone>
    </div>
  );
}
