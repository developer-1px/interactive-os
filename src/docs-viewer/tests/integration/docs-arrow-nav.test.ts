/**
 * T2: Arrow → DOCS_NEXT/PREV_SECTION redirect via middleware
 *
 * Tests that OS_NAVIGATE (ArrowRight/Left) triggers
 * DOCS_NEXT/PREV_SECTION when the docs scroll container is present
 * and no zone has focusable items.
 *
 * Architecture: middleware intercepts OS_NAVIGATE, dispatches
 * DOCS_NEXT/PREV_SECTION as a secondary command, and absorbs
 * the original by returning effects=null (bubble).
 */

import { defineScope } from "@kernel";
import { createOsPage, type OsPage } from "@os/createOsPage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NEXT_SECTION, PREV_SECTION } from "@/docs-viewer/app";

const ZONE_ID = "docs-reader";

describe("T2: Arrow navigation triggers DOCS_NEXT/PREV_SECTION", () => {
    let page: OsPage;
    let scrollSectionSpy: ReturnType<typeof vi.fn>;
    let container: HTMLDivElement;

    beforeEach(() => {
        // Create mock docs scroll container
        container = document.createElement("div");
        container.setAttribute("data-docs-scroll", "");
        document.body.appendChild(container);

        page = createOsPage();
        page.goto(ZONE_ID, {
            role: "feed",
            focusedItemId: null,
        });

        // Scope hierarchy matching production defineApp
        const appScope = defineScope("docs-viewer");
        const appGroup = page.kernel.group({ scope: appScope });
        const zoneScope = defineScope("docs-viewer:docs-reader");
        const zoneGroup = appGroup.group({ scope: zoneScope });

        zoneGroup.defineCommand(
            "DOCS_NEXT_SECTION",
            () => () => ({ scrollSection: "next" as const }),
        );
        zoneGroup.defineCommand(
            "DOCS_PREV_SECTION",
            () => () => ({ scrollSection: "prev" as const }),
        );

        scrollSectionSpy = vi.fn();
        zoneGroup.defineEffect("scrollSection", scrollSectionSpy);

        // Middleware: intercept OS_NAVIGATE → dispatch DOCS command
        // Uses `dispatch` effect to dispatch a new command with correct scope,
        // and returns effects=null to absorb the original OS_NAVIGATE.
        page.kernel.use({
            id: "docs-navigate-redirect",
            before: (ctx: any) => {
                if (ctx.command.type !== "OS_NAVIGATE") return ctx;
                const el = document.querySelector("[data-docs-scroll]");
                if (!el) return ctx;

                const direction = ctx.command.payload?.direction;
                if (direction === "right" || direction === "left") {
                    const cmd =
                        direction === "right" ? NEXT_SECTION() : PREV_SECTION();
                    // Dispatch the docs command — kernel will resolve it in
                    // the correct scope (docs-viewer:docs-reader).
                    page.kernel.dispatch(cmd);
                    // Absorb the original OS_NAVIGATE (return null effects)
                    return { ...ctx, effects: {} };
                }
                return ctx;
            },
        });
    });

    afterEach(() => {
        container.remove();
        page.cleanup();
    });

    // ── #1: ArrowRight → DOCS_NEXT_SECTION ──────────────────────
    it("#1 ArrowRight → DOCS_NEXT_SECTION dispatched", () => {
        page.keyboard.press("ArrowRight");

        const txs = page.kernel.inspector.getTransactions();
        const docsTx = txs.find(
            (t: any) => t.command.type === "DOCS_NEXT_SECTION",
        );
        expect(docsTx).toBeDefined();
    });

    // ── #2: ArrowLeft → DOCS_PREV_SECTION ───────────────────────
    it("#2 ArrowLeft → DOCS_PREV_SECTION dispatched", () => {
        page.keyboard.press("ArrowLeft");

        const txs = page.kernel.inspector.getTransactions();
        const docsTx = txs.find(
            (t: any) => t.command.type === "DOCS_PREV_SECTION",
        );
        expect(docsTx).toBeDefined();
    });

    // ── #3: ArrowRight → scrollSection("next") effect ────────────
    it("#3 ArrowRight → scrollSection effect called with 'next'", () => {
        page.keyboard.press("ArrowRight");

        expect(scrollSectionSpy).toHaveBeenCalledTimes(1);
        expect(scrollSectionSpy).toHaveBeenCalledWith("next");
    });

    // ── #4: ArrowLeft → scrollSection("prev") effect ─────────────
    it("#4 ArrowLeft → scrollSection effect called with 'prev'", () => {
        page.keyboard.press("ArrowLeft");

        expect(scrollSectionSpy).toHaveBeenCalledTimes(1);
        expect(scrollSectionSpy).toHaveBeenCalledWith("prev");
    });
});
