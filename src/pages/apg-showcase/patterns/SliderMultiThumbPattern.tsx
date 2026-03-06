/**
 * APG Slider (Multi-Thumb) Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/examples/slider-multithumb/
 *
 * ZIFT Classification: Zone(navigation between thumbs via Tab) + Field(number value per thumb)
 *
 * W3C APG Example: Hotel price range with min/max thumbs.
 *
 * Headless pattern:
 *   OS injects aria-valuenow, aria-valuemin, aria-valuemax, role=slider onto each Item.
 *   Arrow keys adjust value via OS_VALUE_CHANGE. Tab moves between thumbs.
 *   CSS reads data-focused for visual focus ring.
 *
 * OS gap: Per-item value constraints (dependent thumbs) not supported at OS level.
 *   Zone-level min/max applies to all thumbs. App-level visual clamping only.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { os } from "@os-sdk/os";
import clsx from "clsx";

// ─── Thumb Data ───

interface ThumbDef {
  id: string;
  label: string;
  ariaLabel: string;
}

const THUMBS: ThumbDef[] = [
  { id: "thumb-min-price", label: "Min", ariaLabel: "Minimum Price" },
  { id: "thumb-max-price", label: "Max", ariaLabel: "Maximum Price" },
];

const RANGE_MIN = 0;
const RANGE_MAX = 400;
const STEP = 10;
const LARGE_STEP = 50;
const INITIAL_MIN = 100;
const INITIAL_MAX = 300;

// ─── App + Zone (defineApp pattern) ───

const MultiThumbApp = defineApp<Record<string, never>>(
  "apg-slider-multithumb-app",
  {},
);

const ZONE_ID = "apg-slider-multithumb-zone";

const sliderZone = MultiThumbApp.createZone(ZONE_ID);
const SliderUI = sliderZone.bind({
  role: "group",
  options: {
    tab: { behavior: "flow" },
    value: {
      mode: "continuous",
      min: RANGE_MIN,
      max: RANGE_MAX,
      step: STEP,
      largeStep: LARGE_STEP,
      initial: {
        "thumb-min-price": INITIAL_MIN,
        "thumb-max-price": INITIAL_MAX,
      },
    },
  },
});

// ─── Slider Rail (visual, non-interactive) ───

function SliderRail({
  minValue,
  maxValue,
}: {
  minValue: number;
  maxValue: number;
}) {
  const minPercent = ((minValue - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
  const maxPercent = ((maxValue - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;

  return (
    <div className="relative h-2 rounded-full bg-gray-200">
      {/* Active range highlight */}
      <div
        className="absolute inset-y-0 bg-indigo-500 rounded-full transition-all duration-75"
        style={{
          left: `${minPercent}%`,
          right: `${100 - maxPercent}%`,
        }}
      />
    </div>
  );
}

// ─── Thumb Component ───

function Thumb({
  thumb,
  value,
  rangeMin,
  rangeMax,
}: {
  thumb: ThumbDef;
  value: number;
  rangeMin: number;
  rangeMax: number;
}) {
  const percent = ((value - rangeMin) / (rangeMax - rangeMin)) * 100;

  return (
    <SliderUI.Item
      id={thumb.id}
      role="slider"
      aria-label={thumb.ariaLabel}
      aria-valuetext={`$${value}`}
      className={clsx(
        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10",
        "w-6 h-6 rounded-full bg-white border-2 border-indigo-500 shadow-md cursor-pointer",
        "transition-all duration-75",
        "data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-offset-2",
        "data-[focused=true]:border-indigo-700 data-[focused=true]:scale-110",
        "hover:scale-105",
      )}
      style={{ left: `${percent}%` }}
    >
      {/* Value tooltip */}
      <span
        className={clsx(
          "absolute -top-8 left-1/2 -translate-x-1/2",
          "px-2 py-0.5 text-xs font-mono font-semibold rounded",
          "bg-indigo-600 text-white",
          "opacity-0 group-data-[focused=true]:opacity-100",
          "transition-opacity pointer-events-none",
        )}
      >
        ${value}
      </span>
    </SliderUI.Item>
  );
}

// ─── Price Labels ───

function PriceLabels() {
  return (
    <div className="flex justify-between text-xs text-gray-400 mt-2">
      <span>${RANGE_MIN}</span>
      <span>${RANGE_MAX}</span>
    </div>
  );
}

// ─── Selected Range Display ───

function RangeDisplay({
  minValue,
  maxValue,
}: {
  minValue: number;
  maxValue: number;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm text-gray-600">Price Range</div>
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-mono font-semibold">
          ${minValue}
        </span>
        <span className="text-gray-400 text-xs">to</span>
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-mono font-semibold">
          ${maxValue}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function SliderMultiThumbPattern() {
  // Read values from OS kernel
  const values = os.useComputed((s) => {
    const z = s.os.focus.zones[ZONE_ID];
    return {
      min: z?.valueNow?.["thumb-min-price"] ?? INITIAL_MIN,
      max: z?.valueNow?.["thumb-max-price"] ?? INITIAL_MAX,
    };
  });

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">
        Slider (Multi-Thumb) — Price Range
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Multi-Thumb Slider Pattern: two thumbs on a single rail.{" "}
        <kbd>Tab</kbd> moves between thumbs. <kbd>Arrow</kbd> keys adjust value
        by ${STEP}. <kbd>PgUp/PgDn</kbd> by ${LARGE_STEP}. <kbd>Home/End</kbd>{" "}
        to min/max.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/examples/slider-multithumb/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
        {/* Range display */}
        <RangeDisplay minValue={values.min} maxValue={values.max} />

        {/* Slider track with thumbs */}
        <SliderUI.Zone
          className="relative pt-4 pb-2"
          aria-label="Hotel Price Range"
        >
          {/* Rail */}
          <SliderRail minValue={values.min} maxValue={values.max} />

          {/* Thumbs positioned absolutely on the rail */}
          <div className="relative h-0">
            <Thumb
              thumb={THUMBS[0]}
              value={values.min}
              rangeMin={RANGE_MIN}
              rangeMax={RANGE_MAX}
            />
            <Thumb
              thumb={THUMBS[1]}
              value={values.max}
              rangeMin={RANGE_MIN}
              rangeMax={RANGE_MAX}
            />
          </div>
        </SliderUI.Zone>

        {/* Min/Max labels */}
        <PriceLabels />

        {/* Instructions */}
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 space-y-1">
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
              Tab
            </kbd>{" "}
            switch between min/max thumbs
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
              Arrow keys
            </kbd>{" "}
            +/- ${STEP}
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
              PgUp/PgDn
            </kbd>{" "}
            +/- ${LARGE_STEP}
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
              Home/End
            </kbd>{" "}
            min/max
          </div>
        </div>
      </div>
    </div>
  );
}
