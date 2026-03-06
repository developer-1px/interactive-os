/**
 * APG Checkbox Pattern (Two-State) — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox/
 *
 * W3C Example HTML structure (baseline markup):
 *   <h3 id="id-group-label">Sandwich Condiments</h3>
 *   <div role="group" aria-labelledby="id-group-label">
 *     <ul class="checkboxes">
 *       <li><div role="checkbox" aria-checked="false" tabindex="0">Lettuce</div></li>
 *       <li><div role="checkbox" ...>Tomato</div></li>
 *       <li><div role="checkbox" ...>Mustard</div></li>
 *       <li><div role="checkbox" ...>Sprouts</div></li>
 *     </ul>
 *   </div>
 *
 * Keyboard:
 *   Space: toggle aria-checked (keyup)
 *   Enter: MUST NOT toggle
 *   Click: toggle
 *
 * OS pattern:
 *   OS injects role=checkbox, aria-checked, tabIndex, data-focused onto Item.
 *   Space → OS_CHECK (built-in toggle via item-layer resolveCheckbox).
 *   Click → OS_ACTIVATE → onAction → OS_CHECK.
 *   CSS reads aria-checked. No useState, no onClick, no onKeyDown.
 *
 * Structural mapping (H IDs):
 *   H1: h3 heading → plain <h3>
 *   H2: div[role="group"] aria-labelledby → Zone with role="group" + aria-labelledby
 *   H3: ul > li list structure → <ul> > <li> wrapping each Item
 *   H4: div[role="checkbox"] with text content → Zone.Item, OS injects role
 *   H5: 4 condiments: Lettuce, Tomato, Mustard, Sprouts
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { OS_CHECK } from "@os-sdk/os";

// ─── Condiment Data (W3C Example: "Sandwich Condiments") ───

const CONDIMENTS = ["Lettuce", "Tomato", "Mustard", "Sprouts"];
const condimentId = (name: string) => `cond-${name.toLowerCase()}`;

// ─── App + Zone ───

export const CheckboxApp = defineApp<Record<string, never>>("apg-checkbox-app", {});
const checkboxZone = CheckboxApp.createZone("apg-checkbox");
const CheckboxUI = checkboxZone.bind({
  role: "checkbox",
  // Click → OS_ACTIVATE → onAction → OS_CHECK (built-in toggle)
  onAction: (cursor) => OS_CHECK({ targetId: cursor.focusId }),
});

// ─── Main Component ───
// Follows W3C Example HTML structure exactly:
//   h3 → div[role=group] → ul → li → div[role=checkbox]

export function CheckboxPattern() {
  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">Checkbox</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Checkbox Pattern (Two-State): <kbd>Space</kbd> toggles.{" "}
        <kbd>Enter</kbd> does NOT toggle. Click also toggles.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C Example →
        </a>
      </p>

      {/* H1: h3 heading used as group label */}
      <h3
        id="checkbox-group-label"
        className="text-sm font-semibold text-gray-700 mb-2"
      >
        Sandwich Condiments
      </h3>

      {/* H2: div[role="group"] aria-labelledby → native wrapper for ARIA grouping */}
      {/* 🔄 OS Auto: Zone doesn't accept role prop; group wrapping is outside Zone */}
      <div role="group" aria-labelledby="checkbox-group-label">
        <CheckboxUI.Zone className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* H3: ul > li list structure */}
          <ul className="list-none m-0 p-0 pl-1">
            {CONDIMENTS.map((name) => (
              <li key={name} className="m-px p-0">
                {/* H4: div[role="checkbox"] — OS injects role, aria-checked, tabIndex */}
                <CheckboxUI.Item
                  id={condimentId(name)}
                  className="
                  inline-flex items-center gap-2 px-2 py-1 cursor-pointer rounded
                  text-sm text-gray-900
                  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:bg-indigo-50
                  data-[focused=true]:outline-none
                  before:content-['☐'] before:text-base
                  aria-checked:before:content-['☑'] aria-checked:before:text-indigo-600
                "
                >
                  {/* H5: text content is the accessible name */}
                  {name}
                </CheckboxUI.Item>
              </li>
            ))}
          </ul>
        </CheckboxUI.Zone>
      </div>
    </div>
  );
}
