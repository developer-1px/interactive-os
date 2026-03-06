/**
 * Link Pattern — OS Projection Tests (Tier 2)
 *
 * W3C APG Link spec:
 *   - Enter: activates the link
 *   - Native <a href> is strongly preferred
 *   - Custom elements: role="link" + tabindex="0" + Enter activates
 *   - Does NOT require arrow key navigation (not a composite widget)
 *
 * ZIFT classification: Trigger (action)
 *   - Same category as Alert — no Zone/Item, only command dispatch
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/link/
 */

import { createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import {
  LinkApp,
  LinkPattern,
  NAVIGATE_LINK,
} from "@/pages/apg-showcase/patterns/LinkPattern";

describe("LinkPattern (Projection)", () => {
  let page: ReturnType<typeof createPage>;

  beforeEach(() => {
    page = createPage(LinkApp, LinkPattern);
  });

  // ═══════════════════════════════════════════════════
  // Initial State
  // ═══════════════════════════════════════════════════

  it("initial state has no navigated URL", () => {
    expect(page.state.lastNavigatedUrl).toBeNull();
  });

  // ═══════════════════════════════════════════════════
  // Native <a> Links — DOM Projection
  // ═══════════════════════════════════════════════════

  describe("Native links (<a> elements)", () => {
    it("renders native <a> elements with href", () => {
      const html = page.html();
      expect(html).toContain('id="link-w3c"');
      expect(html).toContain('href="https://www.w3.org/WAI/ARIA/apg/"');
      expect(html).toContain('id="link-mdn"');
      expect(html).toContain('href="https://developer.mozilla.org/"');
    });

    it("native links have target=_blank for external navigation", () => {
      const html = page.html();
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });
  });

  // ═══════════════════════════════════════════════════
  // Custom Links (role="link") — DOM Projection
  // ═══════════════════════════════════════════════════

  describe('Custom links (role="link")', () => {
    it("renders span elements with role=link", () => {
      const html = page.html();
      expect(html).toContain('role="link"');
      expect(html).toContain('id="link-custom-settings"');
      expect(html).toContain('id="link-custom-profile"');
    });

    it("custom links have tabindex=0 for keyboard focusability", () => {
      const html = page.html();
      // The span role="link" elements should have tabindex="0"
      expect(html).toContain('tabindex="0"');
    });
  });

  // ═══════════════════════════════════════════════════
  // Command Dispatch — NAVIGATE_LINK
  // ═══════════════════════════════════════════════════

  describe("NAVIGATE_LINK command", () => {
    it("dispatches NAVIGATE_LINK with correct URL", () => {
      page.dispatch(NAVIGATE_LINK({ url: "/settings" }));
      expect(page.state.lastNavigatedUrl).toBe("/settings");
    });

    it("subsequent dispatches update the URL", () => {
      page.dispatch(NAVIGATE_LINK({ url: "/settings" }));
      expect(page.state.lastNavigatedUrl).toBe("/settings");

      page.dispatch(NAVIGATE_LINK({ url: "/profile" }));
      expect(page.state.lastNavigatedUrl).toBe("/profile");
    });
  });
});
