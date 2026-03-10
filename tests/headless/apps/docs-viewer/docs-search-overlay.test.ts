/**
 * DocsSearch Overlay Test — OS overlay lifecycle verification.
 *
 * Verifies that DocsSearch overlay open/close is managed by the OS overlay system:
 *   - T4a: Click search button → overlay opens (OS_OVERLAY_OPEN)
 *   - T4b: "/" keybinding → overlay opens
 *   - T4c: OS_OVERLAY_CLOSE → overlay closes
 *   - T4d: Re-open after close → works
 *
 * Known gap: Escape key closes overlay via React handler (not OS pipeline).
 * ModalPortal migration (Phase 2) will move Escape handling to OS.
 */

import { describe, expect, it, vi } from "vitest";

// ── Mock docsUtils before any app imports ──
vi.mock("@/docs-viewer/docsUtils", () => import("./__mocks__/docsUtils"));

// ── Now safe to import app modules ──
import { createHeadlessPage } from "@os-devtool/testing/page";
import { OS_OVERLAY_CLOSE, os } from "@os-sdk/os";
import { DocsApp, selectDoc } from "@/docs-viewer/app";
import { DocsViewer } from "@/docs-viewer/DocsViewer";

function isOverlayOpen(id: string): boolean {
  return os.getState().os.overlays.stack.some((e) => e.id === id);
}

describe("DocsSearch Overlay", () => {
  it("T4a: search button click opens overlay", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Click the search button in navbar
    page.click("docs-btn-search");

    expect(isOverlayOpen("docs-search")).toBe(true);
  });

  it("T4b: '/' keybinding opens overlay", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Activate navbar zone first (keybinding needs navigating state)
    page.click("docs-btn-back");
    expect(page.activeZoneId()).toBe("docs-navbar");

    // Press "/" to open search
    page.keyboard.press("/");

    expect(isOverlayOpen("docs-search")).toBe(true);
  });

  it("T4c: OS_OVERLAY_CLOSE closes the overlay", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Open overlay
    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    // Close via OS command
    page.dispatch(OS_OVERLAY_CLOSE({ id: "docs-search" }));
    expect(isOverlayOpen("docs-search")).toBe(false);
  });

  it("T4d: overlay can be re-opened after close", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Open → close → re-open
    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    page.dispatch(OS_OVERLAY_CLOSE({ id: "docs-search" }));
    expect(isOverlayOpen("docs-search")).toBe(false);

    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);
  });
});
