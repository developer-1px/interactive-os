/**
 * APG Meter Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * W3C APG Meter:
 *   - role="meter" — read-only numeric display within a defined range
 *   - aria-valuenow: current value (required)
 *   - aria-valuemin: minimum value (required)
 *   - aria-valuemax: maximum value (required)
 *   - aria-valuetext: (optional) human-readable text
 *   - aria-label / aria-labelledby: accessible name
 *   - Keyboard interaction: NOT APPLICABLE (read-only)
 *
 * OS pattern:
 *   OS injects role=meter, aria-valuenow/min/max, tabIndex, data-focused onto Item.
 *   Value axis (mode="continuous") handles attribute projection.
 *   ROLE_FIELD_TYPE_MAP maps meter→"readonly" — Field layer empty keymap.
 *   No keyboard interaction. Values updated externally via OS_VALUE_CHANGE.
 *   CSS reads data-focused. No useState, no onClick, no onKeyDown.
 *
 * ZIFT Classification: Field (readonly)
 */

import { OS_VALUE_CHANGE } from "@os-core/4-command";
import { os } from "@os-core/engine/kernel";
import { defineApp } from "@os-sdk/app/defineApp";
import clsx from "clsx";
import { useEffect, useRef } from "react";

// ─── Meter Data ───

interface MeterDef {
  id: string;
  label: string;
  min: number;
  max: number;
  initial: number;
  /** Color when value is low (< 33%) */
  lowColor: string;
  /** Color when value is medium (33-66%) */
  midColor: string;
  /** Color when value is high (> 66%) */
  highColor: string;
  unit: string;
}

const METERS: MeterDef[] = [
  {
    id: "meter-cpu",
    label: "CPU Usage",
    min: 0,
    max: 100,
    initial: 42,
    lowColor: "bg-green-500",
    midColor: "bg-yellow-500",
    highColor: "bg-red-500",
    unit: "%",
  },
  {
    id: "meter-memory",
    label: "Memory Usage",
    min: 0,
    max: 16,
    initial: 9.6,
    lowColor: "bg-blue-400",
    midColor: "bg-blue-500",
    highColor: "bg-blue-700",
    unit: "GB",
  },
  {
    id: "meter-disk",
    label: "Disk Usage",
    min: 0,
    max: 512,
    initial: 340,
    lowColor: "bg-emerald-400",
    midColor: "bg-amber-500",
    highColor: "bg-red-600",
    unit: "GB",
  },
];

// ─── App + Zone (defineApp pattern) ───

const MeterApp = defineApp<Record<string, never>>("apg-meter-app", {});

const meterZone = MeterApp.createZone("apg-meter-zone");
const MeterUI = meterZone.bind({
  role: "meter",
  options: {
    navigate: { orientation: "vertical" },
  },
});

// ─── Meter Bar (visual, non-interactive) ───

function MeterBar({
  value,
  min,
  max,
  lowColor,
  midColor,
  highColor,
}: {
  value: number;
  min: number;
  max: number;
  lowColor: string;
  midColor: string;
  highColor: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  const barColor =
    percent < 33 ? lowColor : percent < 66 ? midColor : highColor;

  return (
    <div className="relative h-4 rounded-full overflow-hidden bg-gray-200 flex-1">
      {/* Filled portion */}
      <div
        className={clsx(
          "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
          barColor,
        )}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

// ─── Individual Meter Row ───

function MeterRow({ meter }: { meter: MeterDef }) {
  return (
    <MeterUI.Item
      id={meter.id}
      aria-label={meter.label}
      className={clsx(
        "group flex items-center gap-4 px-4 py-3 rounded-lg transition-all",
        "data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:bg-indigo-50/50",
      )}
    >
      {({ valueNow }: { valueNow?: number }) => {
        const value = valueNow ?? meter.initial;
        const displayValue =
          meter.max <= 100
            ? Math.round(value)
            : Number.isInteger(value)
              ? value
              : value.toFixed(1);

        return (
          <>
            {/* Label */}
            <span className="text-sm font-medium text-gray-700 w-28 shrink-0">
              {meter.label}
            </span>

            {/* Meter bar */}
            <MeterBar
              value={value}
              min={meter.min}
              max={meter.max}
              lowColor={meter.lowColor}
              midColor={meter.midColor}
              highColor={meter.highColor}
            />

            {/* Value display */}
            <span className="text-sm font-mono text-gray-600 w-20 text-right tabular-nums shrink-0">
              {displayValue} / {meter.max} {meter.unit}
            </span>
          </>
        );
      }}
    </MeterUI.Item>
  );
}

// ─── Simulated value updates (like CPU usage changing) ───

function useSimulatedValues() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Initialize values
    for (const meter of METERS) {
      os.dispatch(
        OS_VALUE_CHANGE({
          action: "set",
          value: meter.initial,
          itemId: meter.id,
          zoneId: "apg-meter-zone",
        }),
      );
    }

    // Simulate changing values every 3 seconds
    intervalRef.current = setInterval(() => {
      for (const meter of METERS) {
        const range = meter.max - meter.min;
        const delta = (Math.random() - 0.5) * range * 0.1;
        const currentState = os.getState().os.focus.zones["apg-meter-zone"];
        const currentValue =
          currentState?.valueNow?.[meter.id] ?? meter.initial;
        const newValue = Math.max(
          meter.min,
          Math.min(meter.max, currentValue + delta),
        );

        os.dispatch(
          OS_VALUE_CHANGE({
            action: "set",
            value: Number(newValue.toFixed(1)),
            itemId: meter.id,
            zoneId: "apg-meter-zone",
          }),
        );
      }
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

// ─── Main Component ───

export function MeterPattern() {
  useSimulatedValues();

  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Meter — System Monitor</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Meter Pattern: Read-only graphical display of a numeric value
        within a defined range. No keyboard interaction. Values update
        automatically every 3 seconds to simulate system metrics.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/meter/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec →
        </a>
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-1">
        <MeterUI.Zone
          className="flex flex-col gap-1"
          aria-label="System Resource Meters"
        >
          {METERS.map((meter) => (
            <MeterRow key={meter.id} meter={meter} />
          ))}
        </MeterUI.Zone>

        {/* Legend */}
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 mt-3">
          Values update automatically every 3 seconds. Meter is a read-only
          display — no keyboard interaction applies.
        </div>
      </div>
    </div>
  );
}
