/**
 * Button Pattern — OS Headless + Projection Tests (Tier 2)
 *
 * W3C APG Button Pattern:
 *   - role="button" — activatable element
 *   - Enter/Space — activates
 *   - Toggle variant: aria-pressed="true" / "false"
 *
 * Tests verify both state (via command dispatch) and DOM projection
 * (via renderToString) without a real browser.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import { createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import {
  ActionButtonApp,
  ButtonPattern,
  PERFORM_ACTION,
  ToggleApp,
} from "@/pages/apg-showcase/patterns/ButtonPattern";

// ═══════════════════════════════════════════════════════════════════
// Action Button Tests
// ═══════════════════════════════════════════════════════════════════

describe("ButtonPattern: Action Button (Headless & Projection)", () => {
  let page: ReturnType<typeof createPage>;

  beforeEach(() => {
    page = createPage(ActionButtonApp, ButtonPattern);
  });

  it("initial state has actionCount=0", () => {
    expect(page.state.actionCount).toBe(0);
  });

  it("PERFORM_ACTION increments the counter", () => {
    page.dispatch(PERFORM_ACTION());
    expect(page.state.actionCount).toBe(1);

    page.dispatch(PERFORM_ACTION());
    expect(page.state.actionCount).toBe(2);
  });

  it("renders action buttons in the DOM", () => {
    const html = page.html();
    expect(html).toContain("Print Page");
    expect(html).toContain("Save Draft");
  });

  it("renders the action count", () => {
    page.dispatch(PERFORM_ACTION());
    page.dispatch(PERFORM_ACTION());
    page.dispatch(PERFORM_ACTION());
    const html = page.html();
    expect(html).toContain("3");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Toggle Button Tests
// ═══════════════════════════════════════════════════════════════════

describe("ButtonPattern: Toggle Button (Headless & Projection)", () => {
  let page: ReturnType<typeof createPage>;

  beforeEach(() => {
    page = createPage(ToggleApp, ButtonPattern);
  });

  it("renders toggle buttons in the DOM", () => {
    const html = page.html();
    expect(html).toContain("Text Formatting");
    // Toggle button icons
    expect(html).toContain(">B<");
    expect(html).toContain(">I<");
    expect(html).toContain(">U<");
  });

  it("renders aria-pressed attribute on toggle buttons", () => {
    const html = page.html();
    // Toggle buttons should have aria-pressed in rendered HTML
    expect(html).toContain("aria-pressed");
  });
});
