/**
 * OS Test Suite: Value Controls
 *
 * Exercises spinbutton and slider value adjustment.
 */

import { computeAttrs } from "@os-core/3-inject/compute";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { ValueApp } from "@/pages/os-test-suite/patterns/ValuePattern";

function setup() {
  const { page } = createPage(ValueApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Spinbutton", () => {
  it("initial value is 50", () => {
    const page = setup();
    page.click("spin-item");

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(50);
  });

  it("ArrowUp increments by step (1)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("ArrowUp");

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(51);
  });

  it("ArrowDown decrements by step (1)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("ArrowDown");

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(49);
  });

  it("PageUp increments by largeStep (10)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("PageUp");

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(60);
  });

  it("PageDown decrements by largeStep (10)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("PageDown");

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(40);
  });

  it("Home sets to min (0)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("Home");

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(0);
  });

  it("End sets to max (100)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("End");

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(100);
  });

  it("value clamps at max (no overflow)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("End"); // 100
    page.keyboard.press("ArrowUp"); // should stay 100

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(100);
  });

  it("value clamps at min (no underflow)", () => {
    const page = setup();
    page.click("spin-item");

    page.keyboard.press("Home"); // 0
    page.keyboard.press("ArrowDown"); // should stay 0

    expect(computeAttrs(os, "spin-item")["aria-valuenow"]).toBe(0);
  });
});

describe("OS Pipeline: Slider", () => {
  it("initial value is 25", () => {
    const page = setup();
    page.click("spin-item"); // go to spin first
    page.keyboard.press("Tab"); // tab to slider
    // Or just click slider directly
    page.click("slider-item");

    expect(computeAttrs(os, "slider-item")["aria-valuenow"]).toBe(25);
  });

  it("ArrowUp increments by step (5)", () => {
    const page = setup();
    page.click("slider-item");

    page.keyboard.press("ArrowUp");

    expect(computeAttrs(os, "slider-item")["aria-valuenow"]).toBe(30);
  });

  it("ArrowDown decrements by step (5)", () => {
    const page = setup();
    page.click("slider-item");

    page.keyboard.press("ArrowDown");

    expect(computeAttrs(os, "slider-item")["aria-valuenow"]).toBe(20);
  });

  it("PageUp increments by largeStep (20)", () => {
    const page = setup();
    page.click("slider-item");

    page.keyboard.press("PageUp");

    expect(computeAttrs(os, "slider-item")["aria-valuenow"]).toBe(45);
  });

  it("Home sets to min (0)", () => {
    const page = setup();
    page.click("slider-item");

    page.keyboard.press("Home");

    expect(computeAttrs(os, "slider-item")["aria-valuenow"]).toBe(0);
  });

  it("End sets to max (100)", () => {
    const page = setup();
    page.click("slider-item");

    page.keyboard.press("End");

    expect(computeAttrs(os, "slider-item")["aria-valuenow"]).toBe(100);
  });
});
