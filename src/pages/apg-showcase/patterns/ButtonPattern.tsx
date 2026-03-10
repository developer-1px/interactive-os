/**
 * APG Button Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/button/
 *
 * W3C APG Button Pattern:
 *   - role="button" — activatable element
 *   - Enter/Space — activates the button
 *   - Toggle variant: aria-pressed="true" / "false"
 *   - aria-disabled="true" when action is unavailable
 *
 * ZIFT Classification:
 *   - Action Button = Trigger (Fire-and-forget command dispatch)
 *   - Toggle Button = Field (boolean) mapped to aria-pressed via check axis
 *
 * OS pattern:
 *   Action buttons: triggers declared in bind(), prop-getter from result.
 *   Toggle buttons: Zone+Item with role="toolbar" (child role=button),
 *     check.mode="check" for toggle. OS computes aria-pressed (not aria-checked)
 *     for button-role items. CSS reads aria-pressed. No useState, no onClick.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { OS_PRESS } from "@os-sdk/os";

// ═══════════════════════════════════════════════════════════════════
// Section 1: Action Buttons (triggers declared in bind)
// ═══════════════════════════════════════════════════════════════════

export const ActionButtonApp = defineApp<{ actionCount: number }>(
  "apg-action-button",
  { actionCount: 0 },
);

const actionZone = ActionButtonApp.createZone("action-buttons");

const actionCounter = ActionButtonApp.selector(
  "actionCount",
  (s) => s.actionCount,
);

export const PERFORM_ACTION = actionZone.command("PERFORM_ACTION", (ctx) => ({
  state: { actionCount: ctx.state.actionCount + 1 },
}));

// ─── Bind (triggers declared here — single declaration point) ───

const ActionUI = actionZone.bind("toolbar", {
  options: {
    navigate: { orientation: "horizontal" },
  },
  triggers: {
    PrintPage: () => PERFORM_ACTION(),
    SaveDraft: () => PERFORM_ACTION(),
  },
});

function ActionButtonSection() {
  const count = ActionButtonApp.useComputed(actionCounter);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Action Buttons
      </h4>
      <p className="text-xs text-gray-500">
        Activates on <kbd>Enter</kbd>, <kbd>Space</kbd>, or click. Pure Trigger
        pattern (prop-getter).
      </p>

      <ActionUI.Zone
        className="flex gap-3 items-center"
        aria-label="Action buttons"
      >
        <ActionUI.Item id="btn-print">
          <button
            type="button"
            {...ActionUI.triggers.PrintPage()}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-indigo-600 text-white
              hover:bg-indigo-700 active:bg-indigo-800
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
              transition-colors
            "
          >
            Print Page
          </button>
        </ActionUI.Item>

        <ActionUI.Item id="btn-save">
          <button
            type="button"
            {...ActionUI.triggers.SaveDraft()}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 text-gray-700 bg-white
              hover:bg-gray-50 active:bg-gray-100
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
              transition-colors
            "
          >
            Save Draft
          </button>
        </ActionUI.Item>

        <span className="text-xs text-gray-400 ml-2">
          Actions fired: {count}
        </span>
      </ActionUI.Zone>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Section 2: Toggle Buttons (Zone+Item — Field boolean via check axis)
// ═══════════════════════════════════════════════════════════════════

interface ToggleDef {
  id: string;
  label: string;
  icon: string;
}

const TOGGLES: ToggleDef[] = [
  { id: "toggle-bold", label: "Bold", icon: "B" },
  { id: "toggle-italic", label: "Italic", icon: "I" },
  { id: "toggle-underline", label: "Underline", icon: "U" },
];

export const ToggleApp = defineApp<Record<string, never>>(
  "apg-toggle-button-app",
  {},
);
const toggleZone = ToggleApp.createZone("apg-toggle-buttons");
const ToggleUI = toggleZone.bind("toolbar", {
  options: {
    navigate: { orientation: "horizontal", loop: true },
    inputmap: {
      Space: [OS_PRESS()],
      Enter: [OS_PRESS()],
      click: [OS_PRESS()],
    },
  },
});

function ToggleButtonSection() {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Toggle Buttons
      </h4>
      <p className="text-xs text-gray-500">
        <kbd>Enter</kbd>/<kbd>Space</kbd>/click toggles{" "}
        <code>aria-pressed</code>. Arrow keys navigate. OS manages all state.
      </p>

      <ToggleUI.Zone
        className="flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 rounded-lg shadow-sm w-fit"
        aria-label="Text Formatting"
      >
        {TOGGLES.map((toggle) => (
          <ToggleUI.Item
            key={toggle.id}
            id={toggle.id}
            className="
              w-9 h-9 flex items-center justify-center rounded text-gray-700
              cursor-pointer select-none transition-colors
              hover:bg-gray-200
              aria-pressed:bg-indigo-600 aria-pressed:text-white aria-pressed:shadow-inner
              data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:z-10
            "
          >
            <span
              className={`text-sm font-bold ${toggle.id === "toggle-italic" ? "italic" : ""}`}
              aria-hidden="true"
            >
              {toggle.icon}
            </span>
          </ToggleUI.Item>
        ))}
      </ToggleUI.Zone>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Pattern Component
// ═══════════════════════════════════════════════════════════════════

export function ButtonPattern() {
  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Button</h3>
      <p className="text-sm text-gray-500 mb-6">
        W3C APG Button Pattern: Action buttons fire commands. Toggle buttons
        manage boolean state via <code>aria-pressed</code>.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/button/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/button/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <div className="space-y-8">
        <ActionButtonSection />
        <hr className="border-gray-200" />
        <ToggleButtonSection />
      </div>
    </div>
  );
}
