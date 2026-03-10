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
import { createPage } from "@os-devtool/testing/page";
import { OS_OVERLAY_CLOSE, os } from "@os-sdk/os";
import { DocsApp, selectDoc } from "@/docs-viewer/app";
import { DocsViewer } from "@/docs-viewer/DocsViewer";

function isOverlayOpen(id: string): boolean {
  return os.getState().os.overlays.stack.some((e) => e.id === id);
}

describe("DocsSearch Overlay", () => {
  it("T4a: search button click opens overlay", () => {
    const { page, cleanup } = createPage(DocsApp, DocsViewer);
    page.goto("/");
    os.dispatch(selectDoc({ id: "STATUS" }));

    page.click("docs-btn-search");

    expect(isOverlayOpen("docs-search")).toBe(true);
    cleanup();
  });

  it("T4b: '/' keybinding opens overlay", () => {
    const { page, cleanup } = createPage(DocsApp, DocsViewer);
    page.goto("/");
    os.dispatch(selectDoc({ id: "STATUS" }));

    page.click("docs-btn-back");
    expect(os.getState().os.focus.activeZoneId).toBe("docs-navbar");

    page.keyboard.press("/");

    expect(isOverlayOpen("docs-search")).toBe(true);
    cleanup();
  });

  it("T4c: OS_OVERLAY_CLOSE closes the overlay", () => {
    const { page, cleanup } = createPage(DocsApp, DocsViewer);
    page.goto("/");
    os.dispatch(selectDoc({ id: "STATUS" }));

    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    os.dispatch(OS_OVERLAY_CLOSE({ id: "docs-search" }));
    expect(isOverlayOpen("docs-search")).toBe(false);
    cleanup();
  });

  it("T4d: overlay can be re-opened after close", () => {
    const { page, cleanup } = createPage(DocsApp, DocsViewer);
    page.goto("/");
    os.dispatch(selectDoc({ id: "STATUS" }));

    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    os.dispatch(OS_OVERLAY_CLOSE({ id: "docs-search" }));
    expect(isOverlayOpen("docs-search")).toBe(false);

    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);
    cleanup();
  });

  it("T6: Escape key closes overlay via OS pipeline", () => {
    const { page, cleanup } = createPage(DocsApp, DocsViewer);
    page.goto("/");
    os.dispatch(selectDoc({ id: "STATUS" }));

    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    page.keyboard.press("Escape");
    expect(isOverlayOpen("docs-search")).toBe(false);
    cleanup();
  });

  it("T7: ArrowDown inside overlay — OS gap: leaks to OS_NAVIGATE", () => {
    const { page, cleanup } = createPage(DocsApp, DocsViewer);
    page.goto("/");
    os.dispatch(selectDoc({ id: "STATUS" }));

    page.click("docs-btn-search");
    expect(isOverlayOpen("docs-search")).toBe(true);

    page.keyboard.press("ArrowDown");

    // Overlay stays open (ArrowDown doesn't dismiss)
    expect(isOverlayOpen("docs-search")).toBe(true);

    // GAP EVIDENCE: activeZoneId changed from overlay zone to navbar
    const activeZone = os.getState().os.focus.activeZoneId;
    expect(activeZone).toBe("docs-navbar"); // gap: should be "docs-search"
    cleanup();
  });
});
