/**
 * APG Accordion Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
 *
 * W3C APG Example: Form divided into three sections.
 *
 * Headless pattern:
 *   OS injects data-focused, aria-expanded, role, tabIndex onto Item.
 *   CSS reads those attributes. No render-prop, no JS state.
 */

import { Icon } from "@/components/Icon";
import { defineApp } from "@/os/defineApp";

// ─── Section Data ───

interface AccordionSection {
  id: string;
  title: string;
  fields: { label: string; required: boolean; type: string }[];
}

const SECTIONS: AccordionSection[] = [
  {
    id: "acc-personal",
    title: "Personal Information",
    fields: [
      { label: "Name", required: true, type: "text" },
      { label: "Email", required: true, type: "email" },
      { label: "Phone", required: false, type: "tel" },
      { label: "Extension", required: false, type: "text" },
      { label: "Country", required: false, type: "text" },
      { label: "City/Province", required: false, type: "text" },
    ],
  },
  {
    id: "acc-billing",
    title: "Billing Address",
    fields: [
      { label: "Address 1", required: false, type: "text" },
      { label: "Address 2", required: false, type: "text" },
      { label: "City", required: false, type: "text" },
      { label: "State", required: false, type: "text" },
      { label: "Zip Code", required: false, type: "text" },
    ],
  },
  {
    id: "acc-shipping",
    title: "Shipping Address",
    fields: [
      { label: "Address 1", required: false, type: "text" },
      { label: "Address 2", required: false, type: "text" },
      { label: "City", required: false, type: "text" },
      { label: "State", required: false, type: "text" },
      { label: "Zip Code", required: false, type: "text" },
    ],
  },
];

// ─── App + Zone (defineApp pattern) ───

const AccordionApp = defineApp<Record<string, never>>("apg-accordion-app", {});
const accordionZone = AccordionApp.createZone("apg-accordion");
const AccordionUI = accordionZone.bind({
  role: "accordion",
  // expand.mode: "all" is automatic from role preset
  // → no getExpandableItems needed
});

// ─── Accordion Row ───
// Zero render-prop. Zero JS state.
// OS → data-focused, aria-expanded → CSS reads them.

function AccordionRow({ section }: { section: AccordionSection }) {
  return (
    <AccordionUI.Item
      id={section.id}
      aria-controls={`panel-${section.id}`}
      className="group cursor-pointer select-none data-[focused=true]:ring-2 data-[focused=true]:ring-inset data-[focused=true]:ring-indigo-400"
    >
      {/* Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between text-sm text-gray-900 transition-colors hover:bg-indigo-50 group-data-[focused=true]:bg-indigo-50">
        <span className="font-medium">{section.title}</span>
        <Icon
          name="chevron-down"
          size={16}
          className="text-gray-400 flex-shrink-0 transition-transform group-aria-expanded:rotate-180"
        />
      </div>

      {/* Panel — hidden by default, shown when aria-expanded on parent Item */}
      <div
        id={`panel-${section.id}`}
        role="region"
        aria-labelledby={section.id}
        className="hidden group-aria-expanded:block px-6 pb-5 pt-2 border-t border-gray-100"
      >
        <fieldset className="border-0 m-0 p-0 space-y-3">
          {section.fields.map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>
              <input
                type={field.type}
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                "
              />
            </div>
          ))}
        </fieldset>
      </div>
    </AccordionUI.Item>
  );
}

// ─── Main Component ───

export function AccordionPattern() {
  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">Accordion</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Example: Form divided into three sections using an accordion.
        Enter/Space toggles panels. Arrow keys navigate between headers.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec →
        </a>
      </p>

      <AccordionUI.Zone
        className="border-2 border-gray-400 rounded-lg overflow-hidden divide-y divide-gray-300"
        aria-label="Accordion Example"
      >
        {SECTIONS.map((section) => (
          <AccordionRow key={section.id} section={section} />
        ))}
      </AccordionUI.Zone>
    </div>
  );
}
