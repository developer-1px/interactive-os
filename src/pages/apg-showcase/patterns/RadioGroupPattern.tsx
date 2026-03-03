/**
 * APG RadioGroup Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * W3C APG RadioGroup:
 *   - role="radiogroup" container, role="radio" items
 *   - aria-checked="true" on selected, "false" on others
 *   - All 4 arrows (R/D/L/U) move focus + check (linear-both)
 *   - Loop at boundaries
 *   - Space checks focused radio (if not already checked)
 *   - Only one radio checked at a time (disallowEmpty)
 *   - Tab enters on checked radio (entry: "selected")
 *
 * OS pattern:
 *   OS injects role=radio, aria-checked, tabIndex, data-focused onto Item.
 *   Arrow keys → navigate + followFocus → auto-check.
 *   check.mode="check" → aria-checked (not aria-selected).
 *   No useState, no onClick, no onKeyDown.
 */

import { defineApp } from "@os-sdk/app/defineApp";

// ─── Radio Data ───

interface RadioOption {
    id: string;
    label: string;
}

const PIZZA_CRUSTS: RadioOption[] = [
    { id: "radio-regular", label: "Regular crust" },
    { id: "radio-deep", label: "Deep dish" },
    { id: "radio-thin", label: "Thin crust" },
];

const PIZZA_DELIVERY: RadioOption[] = [
    { id: "radio-pickup", label: "Pick up" },
    { id: "radio-home", label: "Home delivery" },
    { id: "radio-dine", label: "Dine in" },
];

// ─── Apps + Zones ───

const CrustApp = defineApp<Record<string, never>>("apg-radiogroup-crust", {});
const crustZone = CrustApp.createZone("radiogroup-crust");
const CrustUI = crustZone.bind({ role: "radiogroup" });

const DeliveryApp = defineApp<Record<string, never>>(
    "apg-radiogroup-delivery",
    {},
);
const deliveryZone = DeliveryApp.createZone("radiogroup-delivery");
const DeliveryUI = deliveryZone.bind({ role: "radiogroup" });

// ─── Radio Button Component ───

function RadioButton({ item }: { item: RadioOption }) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer">
            {/* Item wraps the visual radio indicator */}
            <span className="text-sm text-gray-800">{item.label}</span>
        </div>
    );
}

// ─── Radio Group Section ───

function RadioGroupSection({
    title,
    options,
    UI,
    groupLabel,
}: {
    title: string;
    options: RadioOption[];
    UI: typeof CrustUI;
    groupLabel: string;
}) {
    return (
        <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
            <UI.Zone
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                aria-label={groupLabel}
            >
                {options.map((item) => (
                    <UI.Item
                        key={item.id}
                        id={item.id}
                        className="
              flex items-center gap-3 px-4 py-2.5 cursor-pointer
              transition-colors hover:bg-gray-50
              data-[focused=true]:bg-indigo-50
              data-[focused=true]:ring-2 data-[focused=true]:ring-inset data-[focused=true]:ring-indigo-400
            "
                    >
                        {/* Radio circle — driven by aria-checked */}
                        <span
                            aria-hidden="true"
                            className="
                flex-shrink-0 w-4 h-4 rounded-full border-2 border-gray-300
                flex items-center justify-center
                group-aria-checked:border-indigo-600
              "
                        >
                            <span className="w-2 h-2 rounded-full bg-transparent aria-checked:parent:bg-indigo-600" />
                        </span>
                        <span className="text-sm text-gray-800">{item.label}</span>
                    </UI.Item>
                ))}
            </UI.Zone>
        </div>
    );
}

// ─── Main Component ───

export function RadioGroupPattern() {
    return (
        <div className="max-w-md">
            <h3 className="text-lg font-semibold mb-3">Radio Group</h3>
            <p className="text-sm text-gray-500 mb-4">
                W3C APG RadioGroup: All 4 arrows move + check. Loop at boundaries.
                Only one radio checked at a time.{" "}
                <a
                    href="https://www.w3.org/WAI/ARIA/apg/patterns/radio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline"
                >
                    W3C APG Spec →
                </a>
            </p>

            <RadioGroupSection
                title="Pizza Crust"
                options={PIZZA_CRUSTS}
                UI={CrustUI}
                groupLabel="Pizza Crust"
            />

            <RadioGroupSection
                title="Pizza Delivery"
                options={PIZZA_DELIVERY}
                UI={DeliveryUI}
                groupLabel="Pizza Delivery"
            />
        </div>
    );
}
