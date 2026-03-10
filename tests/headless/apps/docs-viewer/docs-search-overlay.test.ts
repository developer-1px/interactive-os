/**
 * DocsSearch Overlay Test — OS overlay lifecycle verification.
 *
 * Phase 1 (T4a–T4d): Overlay open/close via OS commands.
 * Phase 2 (T6–T7): ModalPortal — Escape via OS pipeline, ArrowDown gap check.
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

  it("T6: Escape key closes overlay via OS pipeline", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Open overlay
    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    // Escape → OS_ESCAPE → OS_OVERLAY_CLOSE (no React handler needed)
    page.keyboard.press("Escape");
    expect(isOverlayOpen("docs-search")).toBe(false);
  });

  it("T7: ArrowDown inside overlay — OS gap: leaks to OS_NAVIGATE", () => {
    const page = createHeadlessPage(DocsApp, DocsViewer);
    page.goto("/");
    page.dispatch(selectDoc({ id: "STATUS" }));

    // Open overlay — dialog zone becomes active
    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    // GAP: ArrowDown leaks to OS_NAVIGATE(down) because dialog role has no
    // inputmap to claim Arrow keys. OS global keybinding intercepts them.
    // In browser, React onKeyDown with e.preventDefault() handles this.
    // In headless, there's no React — OS pipeline runs unimpeded.
    page.keyboard.press("ArrowDown");

    // Overlay stays open (ArrowDown doesn't dismiss)
    expect(isOverlayOpen("docs-search")).toBe(true);

    // GAP EVIDENCE: activeZoneId changed from overlay zone to navbar
    // This proves OS_NAVIGATE leaks through dialog zones without inputmap.
    // Future fix: either add Arrow keys to dialog inputmap (block/noop),
    // or convert search results to a listbox zone inside the dialog.
    const activeZone = os.getState().os.focus.activeZoneId;
    expect(activeZone).toBe("docs-navbar"); // gap: should be "docs-search"
  });
});
