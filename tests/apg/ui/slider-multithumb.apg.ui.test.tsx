/**
 * SliderMultiThumbPattern — DOM rendering + interaction test (Tier 2)
 *
 * This test renders the ACTUAL SliderMultiThumbPattern component
 * and verifies that DOM attributes and interactions work end-to-end.
 * The headless tests verify OS state; this verifies the DOM projection.
 */

import { OS_FOCUS } from "@os-core/4-command/focus";
import { os } from "@os-core/engine/kernel";
import { KeyboardListener } from "@os-react/1-listen/keyboard/KeyboardListener";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { produce } from "immer";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { SliderMultiThumbPattern } from "@/pages/apg-showcase/patterns/SliderMultiThumbPattern";

/**
 * Helper: render the component and wait for mount effects (useEffect init values).
 * Returns the rendered container.
 */
async function renderAndInit() {
  const result = render(
    <>
      <KeyboardListener />
      <SliderMultiThumbPattern />
    </>,
  );
  // Wait for useEffect to dispatch initial OS_VALUE_CHANGE commands
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  return result;
}

describe("SliderMultiThumbPattern (DOM Rendering)", () => {
  beforeEach(() => {
    os.setState((state) =>
      produce(state, (draft) => {
        draft.os.focus.zones = {};
        draft.os.focus.activeZoneId = null;
      }),
    );
  });

  // ═══════════════════════════════════════════════════
  // Basic rendering
  // ═══════════════════════════════════════════════════

  it("renders both thumb elements", async () => {
    await renderAndInit();

    const thumbMin = document.getElementById("thumb-min-price");
    const thumbMax = document.getElementById("thumb-max-price");
    expect(thumbMin).toBeTruthy();
    expect(thumbMax).toBeTruthy();
  });

  it("both thumbs have role=slider from OS computeItem", async () => {
    await renderAndInit();

    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBe(2);
  });

  it("thumbs have correct aria-label", async () => {
    await renderAndInit();

    const sliders = screen.getAllByRole("slider");
    const labels = sliders.map((s) => s.getAttribute("aria-label"));
    expect(labels).toContain("Minimum Price");
    expect(labels).toContain("Maximum Price");
  });

  // ═══════════════════════════════════════════════════
  // ARIA value attributes (after init)
  // ═══════════════════════════════════════════════════

  it("thumbs have aria-valuenow after initialization", async () => {
    await renderAndInit();

    const thumbMin = document.getElementById("thumb-min-price")!;
    const thumbMax = document.getElementById("thumb-max-price")!;

    // Values set by useEffect in the component: min=100, max=300
    expect(thumbMin.getAttribute("aria-valuenow")).toBe("100");
    expect(thumbMax.getAttribute("aria-valuenow")).toBe("300");
  });

  it("thumbs have aria-valuemin and aria-valuemax from zone config", async () => {
    await renderAndInit();

    const thumbMin = document.getElementById("thumb-min-price")!;
    expect(thumbMin.getAttribute("aria-valuemin")).toBe("0");
    expect(thumbMin.getAttribute("aria-valuemax")).toBe("400");
  });

  // ═══════════════════════════════════════════════════
  // Keyboard: Arrow keys adjust value
  // ═══════════════════════════════════════════════════

  it("ArrowRight on focused thumb increases aria-valuenow", async () => {
    const user = userEvent.setup();
    await renderAndInit();

    // Focus thumb-min
    const thumbMin = document.getElementById("thumb-min-price")!;
    await act(async () => {
      thumbMin.focus();
      os.dispatch(
        OS_FOCUS({
          zoneId: "apg-slider-multithumb-zone",
          itemId: "thumb-min-price",
        }),
      );
      await new Promise((r) => setTimeout(r, 50));
    });

    await user.keyboard("{ArrowRight}");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(thumbMin.getAttribute("aria-valuenow")).toBe("110");
  });

  it("ArrowLeft on focused thumb decreases aria-valuenow", async () => {
    const user = userEvent.setup();
    await renderAndInit();

    // Focus thumb-max
    const thumbMax = document.getElementById("thumb-max-price")!;
    await act(async () => {
      thumbMax.focus();
      os.dispatch(
        OS_FOCUS({
          zoneId: "apg-slider-multithumb-zone",
          itemId: "thumb-max-price",
        }),
      );
      await new Promise((r) => setTimeout(r, 50));
    });

    await user.keyboard("{ArrowLeft}");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(thumbMax.getAttribute("aria-valuenow")).toBe("290");
  });

  // ═══════════════════════════════════════════════════
  // Tab navigation between thumbs
  // ═══════════════════════════════════════════════════

  it("Tab from min-thumb moves focus to max-thumb", async () => {
    const user = userEvent.setup();
    await renderAndInit();

    // Focus thumb-min
    const thumbMin = document.getElementById("thumb-min-price")!;
    await act(async () => {
      thumbMin.focus();
      os.dispatch(
        OS_FOCUS({
          zoneId: "apg-slider-multithumb-zone",
          itemId: "thumb-min-price",
        }),
      );
      await new Promise((r) => setTimeout(r, 50));
    });

    await user.keyboard("{Tab}");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const thumbMax = document.getElementById("thumb-max-price")!;
    expect(thumbMax.getAttribute("data-focused")).toBe("true");
  });
});
