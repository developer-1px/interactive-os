/**
 * APG Spinbutton Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/spinbutton-date/
 *
 * ZIFT Classification: Field (number) — same as Slider.
 * OS injects aria-valuenow, aria-valuemin, aria-valuemax, role=spinbutton onto Item.
 * Arrow Up/Down adjust value via OS_VALUE_CHANGE. CSS reads data-focused.
 *
 * Example: Day Planner — configure hours, minutes, and duration for a meeting.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

// ─── Spinbutton Data ───

interface SpinbuttonDef {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  largeStep: number;
  initial: number;
  unit: string;
  formatValue?: (v: number) => string;
}

export const SPINBUTTONS: SpinbuttonDef[] = [
  {
    id: "spin-hours",
    label: "Hours",
    min: 0,
    max: 23,
    step: 1,
    largeStep: 6,
    initial: 9,
    unit: "h",
    formatValue: (v) => v.toString().padStart(2, "0"),
  },
  {
    id: "spin-minutes",
    label: "Minutes",
    min: 0,
    max: 59,
    step: 1,
    largeStep: 15,
    initial: 30,
    unit: "m",
    formatValue: (v) => v.toString().padStart(2, "0"),
  },
  {
    id: "spin-duration",
    label: "Duration",
    min: 15,
    max: 480,
    step: 15,
    largeStep: 60,
    initial: 60,
    unit: "min",
    formatValue: (v) => {
      if (v < 60) return `${v}min`;
      const h = Math.floor(v / 60);
      const m = v % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    },
  },
];

// ─── App + Zone (defineApp pattern) ───

export const SpinbuttonApp = defineApp<Record<string, never>>(
  "apg-spinbutton-app",
  {},
);

const spinbuttonZone = SpinbuttonApp.createZone("apg-spinbutton-zone");
const SpinUI = spinbuttonZone.bind("spinbutton", {
  options: {
    navigate: { orientation: "vertical" },
    value: {
      initial: Object.fromEntries(SPINBUTTONS.map((s) => [s.id, s.initial])),
    },
  },
});

// ─── Value Sync (defers setState to after render) ───

function ValueSync({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (id: string, value: number) => void;
}) {
  useEffect(() => {
    onChange(id, value);
  }, [id, value, onChange]);
  return null;
}

// ─── Individual Spinbutton Row ───

function SpinbuttonRow({
  spinner,
  onValueChange,
}: {
  spinner: SpinbuttonDef;
  onValueChange: (id: string, value: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Label */}
      <span className="text-sm font-medium text-gray-600 w-20">
        {spinner.label}
      </span>

      {/* Spinbutton control */}
      <SpinUI.Item
        id={spinner.id}
        aria-label={spinner.label}
        className={clsx(
          "group flex items-center gap-2 px-3 py-2 rounded-lg",
          "border border-gray-300 bg-white",
          "data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:border-indigo-400",
          "transition-all cursor-default select-none",
        )}
      >
        {({ valueNow }: { valueNow?: number }) => {
          const value = valueNow ?? spinner.initial;
          const display = spinner.formatValue
            ? spinner.formatValue(value)
            : `${value}`;

          return (
            <>
              <ValueSync
                id={spinner.id}
                value={value}
                onChange={onValueChange}
              />
              <span className="text-lg font-mono font-semibold text-gray-800 w-16 text-center tabular-nums">
                {display}
              </span>
            </>
          );
        }}
      </SpinUI.Item>

      {/* Unit label */}
      <span className="text-xs text-gray-400 w-8">{spinner.unit}</span>
    </div>
  );
}

// ─── Summary Display ───

function MeetingSummary({
  hours,
  minutes,
  duration,
}: {
  hours: number;
  minutes: number;
  duration: number;
}) {
  const startTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  const endMinutes = hours * 60 + minutes + duration;
  const endH = Math.floor(endMinutes / 60) % 24;
  const endM = endMinutes % 60;
  const endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-lg">
      <div className="text-indigo-600">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-semibold text-indigo-800">
          {startTime} - {endTime}
        </div>
        <div className="text-xs text-indigo-500">
          {duration >= 60
            ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ""}`
            : `${duration} min`}{" "}
          meeting
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function SpinbuttonPattern() {
  const [values, setValues] = useState({
    "spin-hours": 9,
    "spin-minutes": 30,
    "spin-duration": 60,
  });

  const handleValueChange = useCallback((id: string, value: number) => {
    setValues((prev) => {
      if (prev[id as keyof typeof prev] === value) return prev;
      return { ...prev, [id]: value };
    });
  }, []);

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-semibold mb-3">Spinbutton — Day Planner</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Spinbutton Pattern: configure meeting time and duration.{" "}
        <kbd>Up/Down</kbd> adjust by step. <kbd>PgUp/PgDn</kbd> adjust by large
        step. <kbd>Home/End</kbd> jump to min/max.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/spinbutton-date/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Meeting summary — reads from React state, not OS kernel */}
        <MeetingSummary
          hours={values["spin-hours"]}
          minutes={values["spin-minutes"]}
          duration={values["spin-duration"]}
        />

        {/* Spinbuttons */}
        <SpinUI.Zone
          className="flex flex-col gap-1"
          aria-label="Meeting Time Spinbuttons"
        >
          {SPINBUTTONS.map((spinner) => (
            <SpinbuttonRow
              key={spinner.id}
              spinner={spinner}
              onValueChange={handleValueChange}
            />
          ))}
        </SpinUI.Zone>

        {/* Instructions */}
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 space-y-1">
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
              Up/Down
            </kbd>{" "}
            adjust by step
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
              PgUp/PgDn
            </kbd>{" "}
            adjust by large step
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">
              Home/End
            </kbd>{" "}
            jump to min/max
          </div>
        </div>
      </div>
    </div>
  );
}
