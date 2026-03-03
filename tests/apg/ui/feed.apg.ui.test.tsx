/**
 * FeedPattern — DOM rendering + interaction test
 *
 * This test renders the ACTUAL FeedPattern component
 * and verifies that DOM attributes and interactions work end-to-end.
 * The headless tests verify OS state; this verifies the DOM projection.
 */

import { OS_FOCUS } from "@os-core/4-command/focus";
import { os } from "@os-core/engine/kernel";
import { KeyboardListener } from "@os-react/1-listen/keyboard/KeyboardListener";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { produce } from "immer";
import { beforeEach, describe, expect, it } from "vitest";
import { FeedPattern } from "@/pages/apg-showcase/patterns/FeedPattern";

describe("FeedPattern (DOM Rendering)", () => {
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

  it("renders all 5 feed articles", () => {
    render(<FeedPattern />);

    expect(
      screen.getByText("Getting Started with Accessible Web Components"),
    ).toBeTruthy();
    expect(
      screen.getByText("The Feed Pattern: Infinite Scroll Done Right"),
    ).toBeTruthy();
    expect(
      screen.getByText("Keyboard Navigation Patterns You Should Know"),
    ).toBeTruthy();
    expect(
      screen.getByText("Understanding ARIA Roles and Properties"),
    ).toBeTruthy();
    expect(
      screen.getByText("Testing Accessibility with Headless Tools"),
    ).toBeTruthy();
  });

  it("articles have role=article from OS computeItem", () => {
    render(<FeedPattern />);

    const articles = screen.getAllByRole("article");
    expect(articles.length).toBe(5);
  });

  // ═══════════════════════════════════════════════════
  // ARIA attributes: aria-posinset / aria-setsize
  // ═══════════════════════════════════════════════════

  it("articles have aria-posinset and aria-setsize", () => {
    render(<FeedPattern />);

    for (let i = 0; i < 5; i++) {
      const el = document.getElementById(`article-${i + 1}`);
      expect(el).toBeTruthy();
      expect(el!.getAttribute("aria-posinset")).toBe(String(i + 1));
      expect(el!.getAttribute("aria-setsize")).toBe("5");
    }
  });

  it("articles have aria-labelledby pointing to title element", () => {
    render(<FeedPattern />);

    const el = document.getElementById("article-1");
    expect(el).toBeTruthy();
    expect(el!.getAttribute("aria-labelledby")).toBe("article-1-title");

    // Verify the title element exists
    const titleEl = document.getElementById("article-1-title");
    expect(titleEl).toBeTruthy();
  });

  it("articles have aria-describedby pointing to summary element", () => {
    render(<FeedPattern />);

    const el = document.getElementById("article-1");
    expect(el).toBeTruthy();
    expect(el!.getAttribute("aria-describedby")).toBe("article-1-desc");

    // Verify the description element exists
    const descEl = document.getElementById("article-1-desc");
    expect(descEl).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════
  // Keyboard: ArrowDown moves focus
  // ═══════════════════════════════════════════════════

  it("ArrowDown on focused article: moves to next article", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <FeedPattern />
      </>,
    );

    // Focus the first article
    const el = document.getElementById("article-1")!;
    el.focus();
    os.dispatch(OS_FOCUS({ zoneId: "apg-feed", itemId: "article-1" }));
    await new Promise((r) => setTimeout(r, 50));

    // Press ArrowDown
    await user.keyboard("{ArrowDown}");
    await new Promise((r) => setTimeout(r, 100));

    const el2 = document.getElementById("article-2")!;
    expect(el2.getAttribute("data-focused")).toBe("true");
    expect(el.getAttribute("data-focused")).toBeNull();
  });

  // ═══════════════════════════════════════════════════
  // Keyboard: PageDown moves to next article
  // ═══════════════════════════════════════════════════

  it("PageDown on focused article: moves to next article", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <FeedPattern />
      </>,
    );

    // Focus the first article
    const el = document.getElementById("article-1")!;
    el.focus();
    os.dispatch(OS_FOCUS({ zoneId: "apg-feed", itemId: "article-1" }));
    await new Promise((r) => setTimeout(r, 50));

    // Press PageDown
    await user.keyboard("{PageDown}");
    await new Promise((r) => setTimeout(r, 100));

    const el2 = document.getElementById("article-2")!;
    expect(el2.getAttribute("data-focused")).toBe("true");
  });

  it("PageUp on focused article: moves to previous article", async () => {
    const user = userEvent.setup();

    render(
      <>
        <KeyboardListener />
        <FeedPattern />
      </>,
    );

    // Focus the third article
    const el3 = document.getElementById("article-3")!;
    el3.focus();
    os.dispatch(OS_FOCUS({ zoneId: "apg-feed", itemId: "article-3" }));
    await new Promise((r) => setTimeout(r, 50));

    // Press PageUp
    await user.keyboard("{PageUp}");
    await new Promise((r) => setTimeout(r, 100));

    const el2 = document.getElementById("article-2")!;
    expect(el2.getAttribute("data-focused")).toBe("true");
  });
});
