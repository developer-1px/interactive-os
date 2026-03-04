/**
 * APG Meter Pattern — UI Projection Test (Tier 2: render → DOM)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * Verifies that the MeterPattern component correctly projects
 * OS headless state into DOM attributes via the OS rendering pipeline.
 *
 * ZIFT Classification: Field (readonly)
 */

import { OS_VALUE_CHANGE } from "@os-core/4-command";
import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp";
import { beforeEach, describe, expect, it } from "vitest";

// ─── Minimal meter app for testing ───

const MeterTestApp = defineApp<Record<string, never>>(
  "apg-meter-ui-test",
  {},
);
const meterZone = MeterTestApp.createZone("meter-ui-zone");
const MeterUI = meterZone.bind({
  role: "meter",
  options: {
    navigate: { orientation: "vertical" },
  },
});

const METER_IDS = ["meter-cpu", "meter-memory", "meter-disk"];

function MeterTestComponent() {
  return (
    <MeterUI.Zone aria-label="Test Meters">
      {METER_IDS.map((id) => (
        <MeterUI.Item key={id} id={id} aria-label={id}>
          {({ valueNow }: { valueNow?: number }) => (
            <span>{valueNow ?? 0}</span>
          )}
        </MeterUI.Item>
      ))}
    </MeterUI.Zone>
  );
}

describe("APG Meter: UI Projection", () => {
  let page: ReturnType<typeof createPage>;

  beforeEach(() => {
    page = createPage(MeterTestApp, MeterTestComponent);
    page.goto("meter-ui-zone", {
      items: METER_IDS,
      focusedItemId: "meter-cpu",
    });
  });

  it("items have role=meter", () => {
    expect(page.attrs("meter-cpu").role).toBe("meter");
    expect(page.attrs("meter-memory").role).toBe("meter");
    expect(page.attrs("meter-disk").role).toBe("meter");
  });

  it("focused item has tabIndex=0, others have tabIndex=-1", () => {
    expect(page.attrs("meter-cpu").tabIndex).toBe(0);
    expect(page.attrs("meter-memory").tabIndex).toBe(-1);
    expect(page.attrs("meter-disk").tabIndex).toBe(-1);
  });

  it("focused item has data-focused=true", () => {
    expect(page.attrs("meter-cpu")["data-focused"]).toBe(true);
  });

  it("aria-valuemin and aria-valuemax are projected from config", () => {
    expect(page.attrs("meter-cpu")["aria-valuemin"]).toBe(0);
    expect(page.attrs("meter-cpu")["aria-valuemax"]).toBe(100);
  });

  it("aria-valuenow updates after OS_VALUE_CHANGE dispatch", () => {
    page.dispatch(
      OS_VALUE_CHANGE({
        action: "set",
        value: 73,
        itemId: "meter-cpu",
        zoneId: "meter-ui-zone",
      }),
    );
    expect(page.attrs("meter-cpu")["aria-valuenow"]).toBe(73);
  });

  it("multiple meters can have independent values", () => {
    page.dispatch(
      OS_VALUE_CHANGE({
        action: "set",
        value: 25,
        itemId: "meter-cpu",
        zoneId: "meter-ui-zone",
      }),
    );
    page.dispatch(
      OS_VALUE_CHANGE({
        action: "set",
        value: 80,
        itemId: "meter-memory",
        zoneId: "meter-ui-zone",
      }),
    );

    expect(page.attrs("meter-cpu")["aria-valuenow"]).toBe(25);
    expect(page.attrs("meter-memory")["aria-valuenow"]).toBe(80);
  });

  it("arrow keys do NOT change meter values (read-only)", () => {
    page.dispatch(
      OS_VALUE_CHANGE({
        action: "set",
        value: 50,
        itemId: "meter-cpu",
        zoneId: "meter-ui-zone",
      }),
    );

    page.keyboard.press("ArrowUp");
    expect(page.attrs("meter-cpu")["aria-valuenow"]).toBe(50);

    page.keyboard.press("ArrowDown");
    expect(page.attrs("meter-cpu")["aria-valuenow"]).toBe(50);
  });
});
