/**
 * OS Test Suite: Value Controls
 *
 * Exercises spinbutton and slider value adjustment.
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { expect, describe, it } from "vitest";
import { ValueApp } from "@/pages/os-test-suite/patterns/ValuePattern";

function createPage() {
  const page = createHeadlessPage(ValueApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Spinbutton", () => {
  it("initial value is 50", () => {
    const page = createPage();
    page.click("spin-item");

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(50);
  });

  it("ArrowUp increments by step (1)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("ArrowUp");

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(51);
  });

  it("ArrowDown decrements by step (1)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("ArrowDown");

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(49);
  });

  it("PageUp increments by largeStep (10)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("PageUp");

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(60);
  });

  it("PageDown decrements by largeStep (10)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("PageDown");

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(40);
  });

  it("Home sets to min (0)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("Home");

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(0);
  });

  it("End sets to max (100)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("End");

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(100);
  });

  it("value clamps at max (no overflow)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("End"); // 100
    page.keyboard.press("ArrowUp"); // should stay 100

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(100);
  });

  it("value clamps at min (no underflow)", () => {
    const page = createPage();
    page.click("spin-item");

    page.keyboard.press("Home"); // 0
    page.keyboard.press("ArrowDown"); // should stay 0

    expect(page.attrs("spin-item")["aria-valuenow"]).toBe(0);
  });
});

describe("OS Pipeline: Slider", () => {
  it("initial value is 25", () => {
    const page = createPage();
    page.click("spin-item"); // go to spin first
    page.keyboard.press("Tab"); // tab to slider
    // Or just click slider directly
    page.click("slider-item");

    expect(page.attrs("slider-item")["aria-valuenow"]).toBe(25);
  });

  it("ArrowUp increments by step (5)", () => {
    const page = createPage();
    page.click("slider-item");

    page.keyboard.press("ArrowUp");

    expect(page.attrs("slider-item")["aria-valuenow"]).toBe(30);
  });

  it("ArrowDown decrements by step (5)", () => {
    const page = createPage();
    page.click("slider-item");

    page.keyboard.press("ArrowDown");

    expect(page.attrs("slider-item")["aria-valuenow"]).toBe(20);
  });

  it("PageUp increments by largeStep (20)", () => {
    const page = createPage();
    page.click("slider-item");

    page.keyboard.press("PageUp");

    expect(page.attrs("slider-item")["aria-valuenow"]).toBe(45);
  });

  it("Home sets to min (0)", () => {
    const page = createPage();
    page.click("slider-item");

    page.keyboard.press("Home");

    expect(page.attrs("slider-item")["aria-valuenow"]).toBe(0);
  });

  it("End sets to max (100)", () => {
    const page = createPage();
    page.click("slider-item");

    page.keyboard.press("End");

    expect(page.attrs("slider-item")["aria-valuenow"]).toBe(100);
  });
});
