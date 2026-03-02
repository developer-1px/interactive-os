/**
 * APG Switch Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 *
 * W3C APG Switch:
 *   - role="switch" — on/off toggle
 *   - aria-checked="true" / "false" — current state
 *   - Space or Enter — toggles
 *   - Click — toggles
 *   - Focusable (tabIndex=0 when focused)
 *
 * OS pattern:
 *   OS injects role=switch, aria-checked, tabIndex, data-focused onto Item.
 *   Space/Enter → OS_CHECK (built-in toggle via item-layer resolver).
 *   Click → OS_ACTIVATE → onAction → OS_CHECK.
 *   CSS reads data-focused, aria-checked. No useState, no onClick, no onKeyDown.
 */

import { OS_CHECK } from "@os/4-command/activate/check";
import { defineApp } from "@/os/app/defineApp";

// ─── Switch Data ───

interface SwitchDef {
  id: string;
  label: string;
  description: string;
}

const SWITCHES: SwitchDef[] = [
  {
    id: "switch-notifications",
    label: "Notifications",
    description: "Receive push notifications for important updates.",
  },
  {
    id: "switch-dark-mode",
    label: "Dark Mode",
    description: "Use dark color scheme throughout the app.",
  },
  {
    id: "switch-auto-save",
    label: "Auto-save",
    description: "Automatically save changes as you work.",
  },
];

// ─── App + Zone (defineApp pattern) ───

const SwitchApp = defineApp<Record<string, never>>("apg-switch-app", {});
const switchZone = SwitchApp.createZone("apg-switch");
const SwitchUI = switchZone.bind({
  role: "switch",
  onAction: (cursor: any) => OS_CHECK({ targetId: cursor.focusId }),
});

// ─── Switch Row ───
// Zero render-prop. Zero JS state.
// OS → aria-checked, data-focused → CSS reads them.

function SwitchRow({ item }: { item: SwitchDef }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{item.label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
      </div>

      {/* Switch toggle — this IS the Item */}
      <SwitchUI.Item
        id={item.id}
        aria-label={item.label}
        className="
          group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
          rounded-full border-2 border-transparent transition-colors duration-200
          bg-gray-200 aria-checked:bg-indigo-600
          data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-offset-2
        "
      >
        {/* Sliding knob — visual only, driven by aria-checked on parent */}
        <span
          aria-hidden="true"
          className="
            pointer-events-none inline-block h-5 w-5 rounded-full
            bg-white shadow ring-0 transition-transform duration-200
            translate-x-0 group-aria-checked:translate-x-5
          "
        />
      </SwitchUI.Item>
    </div>
  );
}

// ─── Main Component ───

export function SwitchPattern() {
  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">Switch</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Switch Pattern: Toggle on/off settings. <kbd>Space</kbd> or{" "}
        <kbd>Enter</kbd> toggles. Click also toggles.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/switch/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec →
        </a>
      </p>

      <SwitchUI.Zone
        className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm"
        aria-label="Settings Switches"
      >
        {SWITCHES.map((item) => (
          <SwitchRow key={item.id} item={item} />
        ))}
      </SwitchUI.Zone>
    </div>
  );
}
