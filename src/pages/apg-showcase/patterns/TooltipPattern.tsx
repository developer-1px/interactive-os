/**
 * APG Tooltip Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/examples/tooltip/
 *
 * W3C APG Tooltip:
 *   - role="tooltip" on the tooltip element
 *   - aria-describedby on the trigger, referencing the tooltip ID
 *   - Tooltip displays when trigger receives keyboard focus
 *   - Tooltip hides when trigger loses focus or Escape is pressed
 *   - Tooltip does NOT receive focus
 *   - Hover also triggers display (CSS handles this)
 *
 * ZIFT Classification: None (passive display).
 *   Tooltip is not a Zone, Item, Field, or Trigger.
 *   It is supplementary text shown via CSS based on data-focused.
 *
 * OS pattern:
 *   Triggers live inside a Zone (toolbar role).
 *   OS sets data-focused=true on the focused item.
 *   CSS shows the tooltip when data-focused=true or :hover.
 *   Escape exits the zone (dismiss: { escape: "close" }).
 *   No useState, no onClick, no onKeyDown, no addEventListener.
 */

import { defineApp } from "@os-sdk/app/defineApp";

// ─── Tooltip Data ───

interface TooltipButtonDef {
  id: string;
  label: string;
  tooltip: string;
  icon: string;
}

const TOOLBAR_BUTTONS: TooltipButtonDef[] = [
  {
    id: "btn-cut",
    label: "Cut",
    tooltip: "Cut to clipboard (Cmd+X)",
    icon: "scissors",
  },
  {
    id: "btn-copy",
    label: "Copy",
    tooltip: "Copy to clipboard (Cmd+C)",
    icon: "copy",
  },
  {
    id: "btn-paste",
    label: "Paste",
    tooltip: "Paste from clipboard (Cmd+V)",
    icon: "clipboard",
  },
  {
    id: "btn-bold",
    label: "Bold",
    tooltip: "Toggle bold text (Cmd+B)",
    icon: "bold",
  },
  {
    id: "btn-italic",
    label: "Italic",
    tooltip: "Toggle italic text (Cmd+I)",
    icon: "italic",
  },
];

// ─── App + Zone (defineApp pattern) ───

export const TooltipApp = defineApp<Record<string, never>>("apg-tooltip-app", {});
const tooltipZone = TooltipApp.createZone("apg-tooltip-toolbar");
const ToolbarUI = tooltipZone.bind({
  role: "toolbar",
  options: {
    dismiss: { escape: "close", outsideClick: "none" },
  },
});

// ─── Icon Component (simple SVG placeholders) ───

function ToolbarIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    scissors: "M 6 2 L 12 8 L 18 2 M 6 22 L 12 16 L 18 22 M 12 8 L 12 16",
    copy: "M 8 4 H 16 V 14 H 8 Z M 4 8 H 8 M 4 8 V 18 H 14 V 14",
    clipboard: "M 8 2 H 16 V 4 H 8 Z M 4 4 H 20 V 22 H 4 Z",
    bold: "M 6 4 H 14 Q 18 4 18 9 Q 18 13 14 13 H 6 M 6 13 H 15 Q 19 13 19 18 Q 19 22 15 22 H 6 Z",
    italic: "M 10 4 H 18 M 6 20 H 14 M 14 4 L 10 20",
  };

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path d={icons[name] || "M 12 12 L 12 12"} />
    </svg>
  );
}

// ─── Toolbar Button with Tooltip ───
// Zero JS state. Zero event handlers.
// OS sets data-focused=true. CSS shows the tooltip.
// aria-describedby references the tooltip element's ID.

function TooltipButton({ button }: { button: TooltipButtonDef }) {
  const tooltipId = `tooltip-${button.id}`;

  return (
    // Item is the group. OS injects data-focused, tabIndex, role.
    // Tooltip inside the Item uses group-data-[focused=true] to show.
    <ToolbarUI.Item
      id={button.id}
      aria-label={button.label}
      aria-describedby={tooltipId}
      className="
        group relative
        p-2 rounded-md text-gray-600 transition-colors cursor-default
        hover:bg-gray-100 hover:text-gray-900
        data-[focused=true]:bg-indigo-50 data-[focused=true]:text-indigo-700
        data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400
        data-[focused=true]:outline-none
      "
    >
      <ToolbarIcon name={button.icon} />

      {/* Tooltip — passive display. Visible on focus (data-focused) or hover. */}
      <div
        id={tooltipId}
        role="tooltip"
        className="
          pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50
          px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap
          bg-gray-900 text-white shadow-lg
          opacity-0 scale-95 transition-all duration-150
          group-hover:opacity-100 group-hover:scale-100
          group-data-[focused=true]:opacity-100 group-data-[focused=true]:scale-100
        "
      >
        {button.tooltip}
        {/* Arrow */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 bottom-full w-2 h-2 bg-gray-900 rotate-45"
        />
      </div>
    </ToolbarUI.Item>
  );
}

// ─── Main Component ───

export function TooltipPattern() {
  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Tooltip</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Tooltip Pattern: Descriptive text appears when a trigger
        receives keyboard focus or mouse hover. <kbd>Escape</kbd> dismisses all
        tooltips. Arrow keys navigate between buttons.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec →
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/examples/tooltip/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Formatting Toolbar
        </div>
        <ToolbarUI.Zone
          className="flex gap-1 items-center"
          aria-label="Text formatting toolbar"
        >
          {TOOLBAR_BUTTONS.map((button) => (
            <TooltipButton key={button.id} button={button} />
          ))}
        </ToolbarUI.Zone>

        <p className="text-xs text-gray-400 mt-4">
          Focus a button with <kbd>Tab</kbd>, then use arrow keys to navigate.
          Tooltips appear on focus and hover. Press <kbd>Escape</kbd> to
          dismiss.
        </p>
      </div>
    </div>
  );
}
