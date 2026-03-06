/**
 * APG Window Splitter Pattern -- Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/examples/window-splitter/
 *
 * W3C APG Window Splitter:
 *   - role="separator" on the focusable splitter element
 *   - aria-valuenow: current position (0-100, percentage of primary pane)
 *   - aria-valuemin: minimum primary pane size (0)
 *   - aria-valuemax: maximum primary pane size (100)
 *   - Arrow keys adjust value by step
 *   - Enter toggles collapse/restore
 *   - Home/End jump to min/max
 *
 * ZIFT: Field(number) -- same value axis as Slider.
 * OS pattern:
 *   OS injects role=separator, aria-valuenow/min/max, tabIndex, data-focused.
 *   Arrow keys -> OS_VALUE_CHANGE (built-in via Field layer, NUMBER_KEYMAP).
 *   Enter -> OS_VALUE_CHANGE({ action: "toggle" }) (via Item layer, separator resolver).
 *   CSS reads data-focused, aria-valuenow. No useState, no onClick, no onKeyDown.
 */

import { os } from "@os-sdk/os";
import { defineApp } from "@os-sdk/app/defineApp";
import clsx from "clsx";

// --- App + Zone (defineApp pattern) ---

const SplitterApp = defineApp<Record<string, never>>(
  "apg-window-splitter-app",
  {},
);

const SPLITTER_ID = "main-splitter";
const INITIAL_VALUE = 50;

const splitterZone = SplitterApp.createZone("apg-splitter-zone");
const SplitterUI = splitterZone.bind({
  role: "separator",
  options: {
    value: {
      min: 0,
      max: 100,
      step: 1,
      largeStep: 10,
      initial: { [SPLITTER_ID]: INITIAL_VALUE },
    },
  },
});

// --- Pane Content ---

function PrimaryPane() {
  return (
    <div className="p-4 overflow-auto h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Primary Pane</h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        This pane resizes when you adjust the splitter. Use arrow keys to move
        the splitter in small steps, or press{" "}
        <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to
        collapse/restore this pane.
      </p>
      <ul className="mt-3 space-y-1 text-sm text-gray-600">
        <li>Item Alpha</li>
        <li>Item Bravo</li>
        <li>Item Charlie</li>
        <li>Item Delta</li>
        <li>Item Echo</li>
      </ul>
    </div>
  );
}

function SecondaryPane() {
  return (
    <div className="p-4 overflow-auto h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Secondary Pane
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        This pane fills the remaining space. When the primary pane is collapsed,
        this pane takes the full width.
      </p>
    </div>
  );
}

// --- Splitter Handle ---

function SplitterHandle() {
  const value = os.useComputed((s) => {
    const z = s.os.focus.zones["apg-splitter-zone"];
    return z?.valueNow?.[SPLITTER_ID] ?? INITIAL_VALUE;
  });

  return (
    <SplitterUI.Item
      id={SPLITTER_ID}
      aria-label="Resize primary pane"
      className={clsx(
        "group relative flex-shrink-0 w-2 cursor-col-resize",
        "bg-gray-300 hover:bg-indigo-400 transition-colors duration-150",
        "data-[focused=true]:bg-indigo-500 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-offset-1",
      )}
    >
      {/* Visual grip indicator */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1">
        <div className="w-1 h-1 rounded-full bg-gray-500 group-data-[focused=true]:bg-white" />
        <div className="w-1 h-1 rounded-full bg-gray-500 group-data-[focused=true]:bg-white" />
        <div className="w-1 h-1 rounded-full bg-gray-500 group-data-[focused=true]:bg-white" />
      </div>

      {/* Value tooltip (shown when focused) */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-data-[focused=true]:block">
        <div className="px-2 py-1 text-xs font-mono bg-gray-800 text-white rounded shadow-lg whitespace-nowrap">
          {value}%
        </div>
      </div>
    </SplitterUI.Item>
  );
}

// --- Main Component ---

export function WindowSplitterPattern() {
  const value = os.useComputed((s) => {
    const z = s.os.focus.zones["apg-splitter-zone"];
    return z?.valueNow?.[SPLITTER_ID] ?? INITIAL_VALUE;
  });

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-3">Window Splitter</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Window Splitter Pattern: Adjustable separator between two panes.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
          Left/Right
        </kbd>{" "}
        adjust position.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
          Enter
        </kbd>{" "}
        collapse/restore.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
          Home/End
        </kbd>{" "}
        jump to min/max.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/examples/window-splitter/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Split container */}
        <SplitterUI.Zone
          className="flex h-64"
          aria-label="Resizable split view"
        >
          {/* Primary pane */}
          <div
            className="overflow-hidden bg-blue-50/30 transition-all duration-75"
            style={{
              width: `${value}%`,
              minWidth: value > 0 ? "40px" : "0px",
            }}
          >
            {value > 0 && <PrimaryPane />}
          </div>

          {/* Separator handle */}
          <SplitterHandle />

          {/* Secondary pane */}
          <div className="flex-1 overflow-hidden bg-amber-50/30">
            <SecondaryPane />
          </div>
        </SplitterUI.Zone>

        {/* Status bar */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            Primary: {value}% | Secondary: {100 - value}%
          </span>
          <span className={value === 0 ? "text-red-500 font-medium" : ""}>
            {value === 0 ? "Collapsed (press Enter to restore)" : "Expanded"}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-400 space-y-1">
        <div>
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
            Left/Right/Up/Down
          </kbd>{" "}
          adjust by 1%
        </div>
        <div>
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
            PgUp/PgDn
          </kbd>{" "}
          adjust by 10%
        </div>
        <div>
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
            Home/End
          </kbd>{" "}
          jump to 0% / 100%
        </div>
        <div>
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
            Enter
          </kbd>{" "}
          collapse / restore
        </div>
      </div>
    </div>
  );
}
