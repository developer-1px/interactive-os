/**
 * APG Disclosure (Show/Hide) Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/
 *
 * W3C APG Disclosure:
 *   - Button with role="button" toggles visibility of content section
 *   - aria-expanded="true" when visible, "false" when hidden
 *   - Enter/Space toggles visibility
 *   - Click toggles visibility
 *   - Tab navigates between disclosure buttons (standard tab order)
 *
 * ZIFT Classification: Zone + Trigger
 *   Zone groups the disclosure buttons. Tab flows between them.
 *   Each button is a Trigger that toggles expand/collapse.
 *
 * OS pattern:
 *   OS injects role=button, aria-expanded, tabIndex, data-focused onto Item.
 *   Enter/Space → OS_ACTIVATE → OS_EXPAND (toggle).
 *   Click → OS_ACTIVATE → OS_EXPAND (toggle).
 *   Item.Content: OS-driven visibility via expandedItems.
 *   CSS reads data-focused, aria-expanded. No useState, no onClick, no onKeyDown.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { Icon } from "@/components/Icon";

// ─── FAQ Data ───

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "disc-faq-1",
    question: "What is a disclosure widget?",
    answer:
      "A disclosure widget is a button that controls the visibility of a section of content. " +
      "When the controlled content is hidden, the button is often styled as a right-pointing " +
      "triangle or arrow to hint that activating it will reveal additional content. When the " +
      "content is visible, the arrow or triangle typically points down.",
  },
  {
    id: "disc-faq-2",
    question: "When should I use disclosure?",
    answer:
      "Use disclosure when you have supplementary content that does not need to be visible at " +
      "all times. Common use cases include FAQ sections, collapsible navigation menus, and " +
      "additional details sections. It helps reduce visual clutter while keeping content accessible.",
  },
  {
    id: "disc-faq-3",
    question: "How is disclosure different from accordion?",
    answer:
      "While both patterns show and hide content, accordion groups multiple panels where " +
      "typically only one panel can be open at a time (or all can be toggled independently). " +
      "Disclosure is a simpler pattern — each button independently controls its own content " +
      "section with no relationship between disclosures. Accordion also uses roving tabindex " +
      "with arrow key navigation, while disclosure buttons use standard Tab navigation.",
  },
];

// ─── App + Zone (defineApp pattern) ───

export const DisclosureApp = defineApp<Record<string, never>>(
  "apg-disclosure-app",
  {},
);
const disclosureZone = DisclosureApp.createZone("apg-disclosure");
const DisclosureUI = disclosureZone.bind({ role: "disclosure" });

// ─── Disclosure Row ───
// Zero render-prop. Zero JS state.
// OS → data-focused, aria-expanded → CSS reads them.

function DisclosureRow({ item }: { item: FaqItem }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Button — this IS the Item. Toggles the content below. */}
      <DisclosureUI.Item
        id={item.id}
        className="group w-full cursor-pointer select-none data-[focused=true]:ring-2 data-[focused=true]:ring-inset data-[focused=true]:ring-indigo-400"
      >
        <div className="w-full px-5 py-4 flex items-center justify-between text-sm text-gray-900 transition-colors hover:bg-gray-50 group-data-[focused=true]:bg-indigo-50">
          <span className="font-medium text-left">{item.question}</span>
          <Icon
            name="chevron-down"
            size={16}
            className="text-gray-400 flex-shrink-0 ml-3 transition-transform group-aria-expanded:rotate-180"
          />
        </div>
      </DisclosureUI.Item>

      {/* Content — OS-driven visibility via Item.Content */}
      <DisclosureUI.Item.Content
        for={item.id}
        className="px-5 pb-4 pt-2 border-t border-gray-100 bg-gray-50"
      >
        <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
      </DisclosureUI.Item.Content>
    </div>
  );
}

// ─── Main Component ───

export function DisclosurePattern() {
  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Disclosure (Show/Hide)</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Disclosure Pattern: Buttons toggle visibility of content
        sections. <kbd>Enter</kbd> or <kbd>Space</kbd> toggles. Click also
        toggles. <kbd>Tab</kbd> navigates between buttons.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec →
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <DisclosureUI.Zone
        className="space-y-3"
        aria-label="Frequently Asked Questions"
      >
        {FAQ_ITEMS.map((item) => (
          <DisclosureRow key={item.id} item={item} />
        ))}
      </DisclosureUI.Zone>
    </div>
  );
}
