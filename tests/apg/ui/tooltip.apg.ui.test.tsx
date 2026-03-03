/**
 * TooltipPattern — DOM rendering + interaction test
 *
 * This test renders the ACTUAL TooltipPattern component
 * and verifies that DOM attributes and interactions work end-to-end.
 * The headless tests verify OS state; this verifies the DOM projection.
 *
 * W3C APG Tooltip:
 *   - role="tooltip" on the tooltip element
 *   - aria-describedby on the trigger references the tooltip
 *   - Tooltip visible when trigger has focus (data-focused=true)
 *   - Escape dismisses tooltip
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import { OS_FOCUS } from "@os-core/4-command/focus";
import { os } from "@os-core/engine/kernel";
import { KeyboardListener } from "@os-react/1-listen/keyboard/KeyboardListener";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { produce } from "immer";
import { beforeEach, describe, expect, it } from "vitest";
import { TooltipPattern } from "@/pages/apg-showcase/patterns/TooltipPattern";

describe("TooltipPattern (DOM Rendering)", () => {
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

  it("renders all 5 toolbar buttons", () => {
    render(<TooltipPattern />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });

  it("each button has aria-describedby referencing a tooltip", () => {
    render(<TooltipPattern />);

    const el = document.getElementById("btn-cut");
    expect(el).toBeTruthy();
    expect(el!.getAttribute("aria-describedby")).toBe("tooltip-btn-cut");
  });

  it("tooltip elements have role=tooltip", () => {
    render(<TooltipPattern />);

    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips.length).toBe(5);
  });

  it("tooltip content matches button descriptions", () => {
    render(<TooltipPattern />);

    const tooltip = document.getElementById("tooltip-btn-cut");
    expect(tooltip).toBeTruthy();
    expect(tooltip!.textContent).toContain("Cut to clipboard");
  });

  // ═══════════════════════════════════════════════════
  // Focus: data-focused drives tooltip visibility
  // ═══════════════════════════════════════════════════

  it("focused button gets data-focused=true", async () => {
    render(
      <>
        <KeyboardListener />
        <TooltipPattern />
      </>,
    );

    const el = document.getElementById("btn-cut")!;
    el.focus();
    os.dispatch(
      OS_FOCUS({ zoneId: "apg-tooltip-toolbar", itemId: "btn-cut" }),
    );
    await new Promise((r) => setTimeout(r, 50));

    expect(el.getAttribute("data-focused")).toBe("true");
  });

  it("unfocused buttons do not have data-focused", async () => {
    render(
      <>
        <KeyboardListener />
        <TooltipPattern />
      </>,
    );

    const cut = document.getElementById("btn-cut")!;
    const copy = document.getElementById("btn-copy")!;
    cut.focus();
    os.dispatch(
      OS_FOCUS({ zoneId: "apg-tooltip-toolbar", itemId: "btn-cut" }),
    );
    await new Promise((r) => setTimeout(r, 50));

    expect(cut.getAttribute("data-focused")).toBe("true");
    expect(copy.getAttribute("data-focused")).toBeNull();
  });

  // ═══════════════════════════════════════════════════
  // Arrow navigation moves data-focused between buttons
  // ═══════════════════════════════════════════════════

  it("ArrowRight moves focus (and tooltip) to next button", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <TooltipPattern />
      </>,
    );

    const cut = document.getElementById("btn-cut")!;
    const copy = document.getElementById("btn-copy")!;
    cut.focus();
    os.dispatch(
      OS_FOCUS({ zoneId: "apg-tooltip-toolbar", itemId: "btn-cut" }),
    );
    await new Promise((r) => setTimeout(r, 50));

    await user.keyboard("{ArrowRight}");
    await new Promise((r) => setTimeout(r, 100));

    expect(cut.getAttribute("data-focused")).toBeNull();
    expect(copy.getAttribute("data-focused")).toBe("true");
  });

  // ═══════════════════════════════════════════════════
  // Escape: dismisses all tooltips by closing the zone
  // ═══════════════════════════════════════════════════

  it("Escape clears data-focused (tooltip hides)", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <TooltipPattern />
      </>,
    );

    const cut = document.getElementById("btn-cut")!;
    cut.focus();
    os.dispatch(
      OS_FOCUS({ zoneId: "apg-tooltip-toolbar", itemId: "btn-cut" }),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(cut.getAttribute("data-focused")).toBe("true");

    await user.keyboard("{Escape}");
    await new Promise((r) => setTimeout(r, 100));

    // After Escape, zone is closed — no data-focused on any button
    expect(cut.getAttribute("data-focused")).toBeNull();
  });
});
