/**
 * DocsViewer Headless Test — real DocsViewer with Vite module mocks.
 *
 * Mocks:
 *   - virtual:docs-meta → alias to __mocks__/docs-meta.ts (vitest.config.ts)
 *   - @/docs-viewer/docsUtils → partial mock (docsModules + loadDocContent)
 *
 * Verifies:
 *   - DocsViewer can be imported and rendered in vitest (T1)
 *   - Tab cycle visits expected zones via projection (T2)
 *   - docs-reader items match the projected output (T2)
 */

import { describe, expect, it, vi } from "vitest";

// ── Mock docsUtils before any app imports ──
vi.mock("@/docs-viewer/docsUtils", () => import("./__mocks__/docsUtils"));

// ── Now safe to import app modules ──

import { createHeadlessPage } from "@os-devtool/testing/page";
import { DocsApp, selectDoc } from "@/docs-viewer/app";
import { DocsViewer } from "@/docs-viewer/DocsViewer";

describe("DocsViewer Headless", () => {
  it("T1: DocsViewer can be imported and page created", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");

    // Basic sanity: page was created and HTML can be rendered
    const html = page.html();
    expect(html).toContain("data-zone");
  });

  it("T2: Tab cycle visits docs zones in order", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");

    // Select a doc so docs-reader has items
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Click on navbar button to bootstrap into a zone
    page.click("docs-btn-back");
    expect(page.activeZoneId()).toBe("docs-navbar");

    // Tab through zones — collect zone IDs we visit
    const visited: string[] = [page.activeZoneId()!];
    for (let i = 0; i < 15; i++) {
      page.keyboard.press("Tab");
      const zone = page.activeZoneId();
      if (zone && !visited.includes(zone)) {
        visited.push(zone);
      }
    }

    // DocsViewer should have these zones reachable via Tab
    expect(visited).toContain("docs-navbar");
    expect(visited).toContain("docs-reader");
    expect(visited.length).toBeGreaterThanOrEqual(2);
  });

  it("T2: docs-reader items reflect active document", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");

    // Select STATUS doc
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Navigate to docs-reader zone via Tab
    page.click("docs-btn-back");
    for (let i = 0; i < 15; i++) {
      if (page.activeZoneId() === "docs-reader") break;
      page.keyboard.press("Tab");
    }

    // docs-reader should be reachable and have a focused item
    expect(page.activeZoneId()).toBe("docs-reader");
    expect(page.focusedItemId()).toBeTruthy();
  });
});
