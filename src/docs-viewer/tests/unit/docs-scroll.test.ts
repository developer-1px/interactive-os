/**
 * Docs Viewer — Middleware Tests
 *
 * Tests the docs-navigate-redirect middleware and heading-based navigation.
 */

import { NAVIGATE } from "@os/3-commands/navigate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { os } from "@/os/kernel";

// Side-effect: register DOCS_SCROLL_PAGE command + middleware
import "@/docs-viewer/register";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof os.getState>;

function createScrollContainer(): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("data-docs-scroll", "");
  // Mock scroll state
  Object.defineProperty(el, "clientHeight", { value: 800, configurable: true });
  Object.defineProperty(el, "scrollHeight", {
    value: 2400,
    configurable: true,
  });
  Object.defineProperty(el, "scrollTop", {
    value: 0,
    writable: true,
    configurable: true,
  });

  // Mock container rect (0,0 to 800,800)
  el.getBoundingClientRect = () =>
    ({
      top: 0,
      bottom: 800,
      height: 800,
      width: 1000,
      left: 0,
      right: 1000,
    }) as DOMRect;

  el.scrollBy = vi.fn((opts: ScrollToOptions) => {
    if (opts.top) el.scrollTop += opts.top;
  }) as unknown as typeof el.scrollBy;
  el.scrollTo = vi.fn((opts: ScrollToOptions) => {
    if (opts.top !== undefined) el.scrollTop = opts.top;
  }) as unknown as typeof el.scrollTo;

  document.body.appendChild(el);
  return el;
}

function addHeading(
  container: HTMLElement,
  level: number,
  top: number,
): HTMLElement {
  const h = document.createElement(`h${level}`);
  container.appendChild(h);
  // Mock rect relative to viewport.
  // absolute top - scrollTop
  h.getBoundingClientRect = () =>
    ({
      top: top - container.scrollTop,
      bottom: top - container.scrollTop + 40,
      height: 40,
    }) as DOMRect;
  return h;
}

function createNavLink(type: "prev" | "next"): HTMLAnchorElement {
  const a = document.createElement("a");
  a.setAttribute(`data-docs-nav-${type}`, "");
  a.click = vi.fn();
  document.body.appendChild(a);
  return a;
}

function cleanup() {
  document.body.innerHTML = "";
}

beforeEach(() => {
  snapshot = os.getState();
  cleanup();
});

afterEach(() => {
  os.setState(() => snapshot);
  cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// Heading Navigation Tests
// ═══════════════════════════════════════════════════════════════════

describe("DOCS_SCROLL_PAGE (heading snapping)", () => {
  it("snaps to next heading skipping current if aligned", () => {
    const el = createScrollContainer();
    // Headings at 100, 500
    addHeading(el, 1, 100);
    addHeading(el, 2, 500);

    os.setState((prev) => ({
      ...prev,
      os: { ...prev.os, focus: { ...prev.os.focus, activeZoneId: null } },
    }));

    // 1. Jump to H1 (100) -> snaps to 76 (100 - 24)
    os.dispatch(NAVIGATE({ direction: "right" }));
    expect(el.scrollBy).toHaveBeenCalledWith({
      top: 76,
      behavior: "instant",
    });

    // Manually update scroll to simulate snap
    el.scrollTop = 76;

    // 2. Jump to H2 (500)
    // H1 top relative: 100 - 76 = 24.
    // 24 > 30 is False. H1 skipped.
    // H2 top relative: 500 - 76 = 424.
    // 424 > 30 is True. H2 picked.
    // Snap target: 424 - 24 = 400.
    // scrollBy(400)

    // Clear mock history
    vi.clearAllMocks();

    os.dispatch(NAVIGATE({ direction: "right" }));
    expect(el.scrollBy).toHaveBeenCalledWith({
      top: 400,
      behavior: "instant",
    });
  });

  it("snaps to start of current section if reading body (Backward)", () => {
    const el = createScrollContainer();
    addHeading(el, 1, 100);

    // Reading body of H1
    el.scrollTop = 200;

    os.setState((prev) => ({
      ...prev,
      os: { ...prev.os, focus: { ...prev.os.focus, activeZoneId: null } },
    }));

    // H1 top relative: 100 - 200 = -100.
    // -100 < 18 is True. H1 picked.
    // Snap target: relativeOffset(-100) - 24 = -124.
    // scrollBy(-124).
    // New scrollTop will be 200 - 124 = 76 (which is 100 - 24). Correct.

    os.dispatch(NAVIGATE({ direction: "left" }));
    expect(el.scrollBy).toHaveBeenCalledWith({
      top: -124,
      behavior: "instant",
    });
  });

  it("snaps to previous section if at start of current (Backward)", () => {
    const el = createScrollContainer();
    addHeading(el, 1, 100);
    addHeading(el, 2, 500);

    // At start of H2
    el.scrollTop = 476; // 500 - 24

    os.setState((prev) => ({
      ...prev,
      os: { ...prev.os, focus: { ...prev.os.focus, activeZoneId: null } },
    }));

    // H2 top relative: 500 - 476 = 24.
    // 24 < 18 is False. H2 skipped.
    // H1 top relative: 100 - 476 = -376.
    // -376 < 18 is True. H1 picked.
    // Snap target: -376 - 24 = -400.
    // scrollBy(-400).
    // New scrollTop: 476 - 400 = 76 (100 - 24). Correct.

    os.dispatch(NAVIGATE({ direction: "left" }));
    expect(el.scrollBy).toHaveBeenCalledWith({
      top: -400,
      behavior: "instant",
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary Tests
// ═══════════════════════════════════════════════════════════════════

describe("DOCS_SCROLL_PAGE (boundaries)", () => {
  it("clicks next link when no more headings and at bottom", () => {
    const el = createScrollContainer();
    // At bottom
    el.scrollTop = 1600; // 1600 + 800 = 2400 (scrollHeight)
    const nextLink = createNavLink("next");

    os.setState((prev) => ({
      ...prev,
      os: { ...prev.os, focus: { ...prev.os.focus, activeZoneId: null } },
    }));

    os.dispatch(NAVIGATE({ direction: "right" }));

    expect(nextLink.click).toHaveBeenCalled();
  });

  it("clicks prev link when no more headings above and at top", () => {
    const el = createScrollContainer();
    el.scrollTop = 0;
    const prevLink = createNavLink("prev");

    os.setState((prev) => ({
      ...prev,
      os: { ...prev.os, focus: { ...prev.os.focus, activeZoneId: null } },
    }));

    os.dispatch(NAVIGATE({ direction: "left" }));

    expect(prevLink.click).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Stale activeZoneId Tests
// ═══════════════════════════════════════════════════════════════════

describe("DOCS_SCROLL_PAGE (stale activeZoneId)", () => {
  it("redirects when activeZoneId points to unmounted zone", () => {
    const el = createScrollContainer();
    addHeading(el, 1, 100);

    // Simulate stale zone: activeZoneId set but no matching DOM element
    os.setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        focus: { ...prev.os.focus, activeZoneId: "stale-zone-id" },
      },
    }));

    os.dispatch(NAVIGATE({ direction: "right" }));
    expect(el.scrollBy).toHaveBeenCalled();
  });

  it("redirects when activeZoneId zone exists but has no items", () => {
    const el = createScrollContainer();
    addHeading(el, 1, 100);

    // Create a zone element in DOM but with no [data-item-id] children
    const zoneEl = document.createElement("div");
    zoneEl.id = "empty-zone";
    zoneEl.setAttribute("data-focus-group", "empty-zone");
    document.body.appendChild(zoneEl);

    os.setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        focus: { ...prev.os.focus, activeZoneId: "empty-zone" },
      },
    }));

    os.dispatch(NAVIGATE({ direction: "right" }));
    expect(el.scrollBy).toHaveBeenCalled();
  });

  it("skips redirect when activeZoneId zone has focusable items", () => {
    const el = createScrollContainer();
    addHeading(el, 1, 100);

    // Create a zone with actual focusable items
    const zoneEl = document.createElement("div");
    zoneEl.id = "real-zone";
    zoneEl.setAttribute("data-focus-group", "real-zone");
    const item = document.createElement("div");
    item.setAttribute("data-item-id", "item-1");
    zoneEl.appendChild(item);
    document.body.appendChild(zoneEl);

    os.setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        focus: { ...prev.os.focus, activeZoneId: "real-zone" },
      },
    }));

    os.dispatch(NAVIGATE({ direction: "right" }));
    // Should NOT redirect to docs scroll — NAVIGATE handles it (or returns early)
    expect(el.scrollBy).not.toHaveBeenCalled();
  });
});
