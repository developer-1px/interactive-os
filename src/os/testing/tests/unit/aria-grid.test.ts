/**
 * ARIA Grid Pattern — Playwright-compatible test
 *
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * 3×3 spatial grid with 4-directional navigation.
 * Uses the 6-method Playwright subset — runs headless, browser, and E2E.
 */
import { afterEach, describe, it } from "vitest";
import { createHeadlessPage, expect } from "@os/testing";

// ─── 3×3 Grid Setup ───

const CELL_W = 100;
const CELL_H = 40;

function cellId(row: number, col: number) {
    return `r${row}c${col}`;
}

function allCellIds(): string[] {
    const ids: string[] = [];
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) ids.push(cellId(r, c));
    return ids;
}

function gridRects(): Map<string, DOMRect> {
    const rects = new Map<string, DOMRect>();
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
            rects.set(
                cellId(r, c),
                new DOMRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H),
            );
    return rects;
}

describe("ARIA Grid", () => {
    const page = createHeadlessPage();

    afterEach(() => {
        page.cleanup();
    });

    function setupGrid(focusedCell = "r0c0") {
        page.os.setItems(allCellIds());
        page.os.setRects(gridRects());
        page.os.setConfig({
            navigate: {
                orientation: "both" as const,
                loop: false,
                seamless: false,
                typeahead: false,
                entry: "first" as const,
                recovery: "next" as const,
                arrowExpand: false,
            },
            select: {
                mode: "single" as const,
                followFocus: true,
                disallowEmpty: false,
                range: false,
                toggle: false,
            },
        });
        page.os.setActiveZone("grid", focusedCell);
    }

    // ═══════════════════════════════════════════════════
    // §1 4-Directional Navigation
    // ═══════════════════════════════════════════════════

    describe("4-Directional Navigation", () => {
        it("ArrowRight moves one cell right", async () => {
            setupGrid("r1c1");

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("r1c2")).toBeFocused();
        });

        it("ArrowLeft moves one cell left", async () => {
            setupGrid("r1c1");

            await page.keyboard.press("ArrowLeft");
            await expect(page.locator("r1c0")).toBeFocused();
        });

        it("ArrowDown moves one cell down", async () => {
            setupGrid("r1c1");

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("r2c1")).toBeFocused();
        });

        it("ArrowUp moves one cell up", async () => {
            setupGrid("r1c1");

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("r0c1")).toBeFocused();
        });

        it("corner-to-corner traversal", async () => {
            setupGrid("r0c0");

            await page.keyboard.press("ArrowRight");
            await page.keyboard.press("ArrowRight");
            await page.keyboard.press("ArrowDown");
            await page.keyboard.press("ArrowDown");
            await expect(page.locator("r2c2")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §2 2D Boundary Clamping
    // ═══════════════════════════════════════════════════

    describe("2D Boundary Clamping", () => {
        it("Right at right edge: stays", async () => {
            setupGrid("r1c2");

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("r1c2")).toBeFocused();
        });

        it("Left at left edge: stays", async () => {
            setupGrid("r1c0");

            await page.keyboard.press("ArrowLeft");
            await expect(page.locator("r1c0")).toBeFocused();
        });

        it("Down at bottom: stays", async () => {
            setupGrid("r2c1");

            await page.keyboard.press("ArrowDown");
            await expect(page.locator("r2c1")).toBeFocused();
        });

        it("Up at top: stays", async () => {
            setupGrid("r0c1");

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("r0c1")).toBeFocused();
        });

        it("top-left corner: both up and left stay", async () => {
            setupGrid("r0c0");

            await page.keyboard.press("ArrowUp");
            await expect(page.locator("r0c0")).toBeFocused();

            await page.keyboard.press("ArrowLeft");
            await expect(page.locator("r0c0")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §3 Home / End
    // ═══════════════════════════════════════════════════

    describe("Home / End", () => {
        it("Home moves to first cell", async () => {
            setupGrid("r1c2");

            await page.keyboard.press("Home");
            await expect(page.locator("r0c0")).toBeFocused();
        });

        it("End moves to last cell", async () => {
            setupGrid("r0c0");

            await page.keyboard.press("End");
            await expect(page.locator("r2c2")).toBeFocused();
        });
    });

    // ═══════════════════════════════════════════════════
    // §4 Selection (followFocus)
    // ═══════════════════════════════════════════════════

    describe("Selection follows focus", () => {
        it("navigation selects (followFocus=true)", async () => {
            setupGrid("r0c0");
            await page.locator("r0c0").click();

            await page.keyboard.press("ArrowRight");
            await expect(page.locator("r0c1")).toBeFocused();
            await expect(page.locator("r0c1")).toHaveAttribute(
                "aria-selected",
                "true",
            );
        });
    });
});
