/**
 * OS Test Suite: Value Controls
 *
 * Exercises value adjustment chain:
 *   1. Arrow Up/Down increments/decrements by step
 *   2. PageUp/PageDown by largeStep
 *   3. Home/End to min/max bounds
 *   4. aria-valuenow projection
 */

import { Item, Zone } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import type { TestCase } from "../index";

export const valueTests: TestCase[] = [
  // Spinbutton
  {
    name: "spinbutton initial value is 50",
    status: "fail",
    gap: "value.initial not seeded into valueNow",
  },
  {
    name: "ArrowUp increments by step (1)",
    status: "fail",
    gap: "starts from 0, not initial",
  },
  {
    name: "ArrowDown decrements by step (1)",
    status: "fail",
    gap: "starts from 0, not initial",
  },
  {
    name: "PageUp increments by largeStep (10)",
    status: "fail",
    gap: "starts from 0",
  },
  {
    name: "PageDown decrements by largeStep (10)",
    status: "fail",
    gap: "starts from 0",
  },
  { name: "Home sets to min (0)", status: "pass" },
  { name: "End sets to max (100)", status: "pass" },
  { name: "value clamps at max (no overflow)", status: "pass" },
  { name: "value clamps at min (no underflow)", status: "pass" },
  // Slider
  {
    name: "slider initial value is 25",
    status: "fail",
    gap: "value.initial not seeded",
  },
  {
    name: "slider ArrowUp increments by step (5)",
    status: "fail",
    gap: "starts from 0",
  },
  {
    name: "slider ArrowDown decrements by step (5)",
    status: "fail",
    gap: "starts from 0",
  },
  {
    name: "slider PageUp increments by largeStep (20)",
    status: "fail",
    gap: "starts from 0",
  },
  { name: "slider Home sets to min (0)", status: "pass" },
  { name: "slider End sets to max (100)", status: "pass" },
];

// ─── App Definition ───

export const ValueApp = defineApp("os-test-value", {});

const spinZone = ValueApp.createZone("value-spin");
const SpinUI = spinZone.bind({
  role: "spinbutton",
  getItems: () => ["spin-item"],
  options: {
    value: {
      mode: "continuous",
      min: 0,
      max: 100,
      step: 1,
      largeStep: 10,
      initial: { "spin-item": 50 },
    },
  },
});

const sliderZone = ValueApp.createZone("value-slider");
const SliderUI = sliderZone.bind({
  role: "slider",
  getItems: () => ["slider-item"],
  options: {
    value: {
      mode: "continuous",
      min: 0,
      max: 100,
      step: 5,
      largeStep: 20,
      initial: { "slider-item": 25 },
    },
  },
});

// ─── React Component ───

export function ValuePattern() {
  return (
    <div className="max-w-md space-y-8">
      <h3 className="text-lg font-semibold">Value Controls</h3>
      <p className="text-sm text-gray-500">
        Use arrow keys to adjust values.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
          PageUp/Down
        </kbd>{" "}
        for large steps.{" "}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Home/End</kbd>{" "}
        for min/max.
      </p>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Spinbutton (step: 1, largeStep: 10, initial: 50)
        </p>
        <SpinUI.Zone
          aria-label="Spinbutton"
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          <SpinUI.Item
            id="spin-item"
            className="
              px-4 py-6 text-center text-2xl font-mono
              data-[focused=true]:bg-emerald-50 data-[focused=true]:ring-2 data-[focused=true]:ring-inset data-[focused=true]:ring-emerald-300
            "
          >
            Spin Value
          </SpinUI.Item>
        </SpinUI.Zone>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Slider (step: 5, largeStep: 20, initial: 25)
        </p>
        <SliderUI.Zone
          aria-label="Slider"
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          <SliderUI.Item
            id="slider-item"
            className="
              px-4 py-6 text-center text-2xl font-mono
              data-[focused=true]:bg-emerald-50 data-[focused=true]:ring-2 data-[focused=true]:ring-inset data-[focused=true]:ring-emerald-300
            "
          >
            Slider Value
          </SliderUI.Item>
        </SliderUI.Zone>
      </div>
    </div>
  );
}
