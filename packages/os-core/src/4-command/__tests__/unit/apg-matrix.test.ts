/**
 * APG Matrix Headless Tests — Proactive coverage from APG_MATRIX.md
 *
 * Input-based tests: keyboard press → verify ARIA attribute projection
 * through the full OS pipeline.
 *
 * ⚠️ Single page instance per file (kernel singleton constraint).
 * ⚠️ Unique zone IDs per test (cleanup stale state).
 *
 * Ref: docs/official/os/APG_MATRIX.md
 */
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { afterEach, describe, it } from "vitest";

const page = createHeadlessPage();
afterEach(() => page.cleanup());

// ═══════════════════════════════════════════════════════════════════
// Listbox
// ═══════════════════════════════════════════════════════════════════

describe("APG Listbox", () => {
    it("ArrowDown → focus moves to next option", async () => {
        page.goto("lb-1", {
            role: "listbox",
            items: ["opt-1", "opt-2", "opt-3"],
            focusedItemId: "opt-1",
        });
        await page.keyboard.press("ArrowDown");
        await page.locator("#opt-2").toBeFocused();
    });

    it("ArrowUp → focus moves to previous option", async () => {
        page.goto("lb-2", {
            role: "listbox",
            items: ["opt-1", "opt-2", "opt-3"],
            focusedItemId: "opt-2",
        });
        await page.keyboard.press("ArrowUp");
        await page.locator("#opt-1").toBeFocused();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Tree View
// ═══════════════════════════════════════════════════════════════════

describe("APG Tree View", () => {
    it("ArrowDown → next visible treeitem", async () => {
        page.goto("tv-1", {
            role: "tree",
            items: ["node-1", "node-2", "node-3"],
            focusedItemId: "node-1",
        });
        await page.keyboard.press("ArrowDown");
        await page.locator("#node-2").toBeFocused();
    });

    it("ArrowUp → previous visible treeitem", async () => {
        page.goto("tv-2", {
            role: "tree",
            items: ["node-1", "node-2", "node-3"],
            focusedItemId: "node-2",
        });
        await page.keyboard.press("ArrowUp");
        await page.locator("#node-1").toBeFocused();
    });

    it("ArrowRight on collapsed → expands", async () => {
        page.goto("tv-3", {
            role: "tree",
            items: ["node-1", "child-1", "leaf-1"],
            focusedItemId: "node-1",
        });
        await page.keyboard.press("ArrowRight");
        await page.locator("#node-1").toHaveAttribute("aria-expanded", "true");
    });

    it("ArrowLeft on expanded → collapses", async () => {
        page.goto("tv-4", {
            role: "tree",
            items: ["node-1", "child-1", "leaf-1"],
            focusedItemId: "node-1",
            initial: { expanded: ["node-1"] },
        });
        await page.keyboard.press("ArrowLeft");
        await page.locator("#node-1").toHaveAttribute("aria-expanded", "false");
    });

    it("ArrowRight on expanded → enters first child", async () => {
        page.goto("tv-5", {
            role: "tree",
            items: ["node-1", "child-1", "leaf-1"],
            focusedItemId: "node-1",
            initial: { expanded: ["node-1"] },
        });
        page.os.setTreeLevels({ "node-1": 1, "child-1": 2, "leaf-1": 2 });
        await page.keyboard.press("ArrowRight");
        await page.locator("#child-1").toBeFocused();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Tabs
// ═══════════════════════════════════════════════════════════════════

describe("APG Tabs", () => {
    it("ArrowRight → next tab", async () => {
        page.goto("tab-1", {
            role: "tablist",
            items: ["tab-a", "tab-b", "tab-c"],
            focusedItemId: "tab-a",
        });
        await page.keyboard.press("ArrowRight");
        await page.locator("#tab-b").toBeFocused();
    });

    it("ArrowLeft from first → wraps to last tab (loop)", async () => {
        page.goto("tab-2", {
            role: "tablist",
            items: ["tab-a", "tab-b", "tab-c"],
            focusedItemId: "tab-a",
        });
        await page.keyboard.press("ArrowLeft");
        await page.locator("#tab-c").toBeFocused();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Radio Group
// ═══════════════════════════════════════════════════════════════════

describe("APG Radio Group", () => {
    it("ArrowDown → next radio", async () => {
        page.goto("rg-1", {
            role: "radiogroup",
            items: ["r-1", "r-2", "r-3"],
            focusedItemId: "r-1",
        });
        await page.keyboard.press("ArrowDown");
        await page.locator("#r-2").toBeFocused();
    });

    it("ArrowUp from first → wraps to last radio (loop)", async () => {
        page.goto("rg-2", {
            role: "radiogroup",
            items: ["r-1", "r-2", "r-3"],
            focusedItemId: "r-1",
        });
        await page.keyboard.press("ArrowUp");
        await page.locator("#r-3").toBeFocused();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Accordion
// ═══════════════════════════════════════════════════════════════════

describe("APG Accordion", () => {
    it("Enter → expands, Enter again → collapses", async () => {
        page.goto("acc-1", {
            role: "accordion",
            items: ["h-1", "h-2", "h-3"],
            focusedItemId: "h-1",
        });
        await page.keyboard.press("Enter");
        await page.locator("#h-1").toHaveAttribute("aria-expanded", "true");

        await page.keyboard.press("Enter");
        await page.locator("#h-1").toHaveAttribute("aria-expanded", "false");
    });

    it("Space → toggles aria-expanded", async () => {
        page.goto("acc-2", {
            role: "accordion",
            items: ["h-1"],
            focusedItemId: "h-1",
        });
        await page.keyboard.press("Space");
        await page.locator("#h-1").toHaveAttribute("aria-expanded", "true");
    });

    it("ArrowDown/Up → navigate between headers", async () => {
        page.goto("acc-3", {
            role: "accordion",
            items: ["h-1", "h-2", "h-3"],
            focusedItemId: "h-1",
        });
        await page.keyboard.press("ArrowDown");
        await page.locator("#h-2").toBeFocused();
        await page.keyboard.press("ArrowUp");
        await page.locator("#h-1").toBeFocused();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Checkbox
// ═══════════════════════════════════════════════════════════════════

describe("APG Checkbox", () => {
    it("Space → toggles aria-checked (on/off)", async () => {
        page.goto("cb-1", {
            role: "checkbox",
            items: ["cb-a"],
            focusedItemId: "cb-a",
        });
        await page.keyboard.press("Space");
        await page.locator("#cb-a").toHaveAttribute("aria-checked", "true");

        await page.keyboard.press("Space");
        await page.locator("#cb-a").toHaveAttribute("aria-checked", "false");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Switch
// ═══════════════════════════════════════════════════════════════════

describe("APG Switch", () => {
    it("Space → toggles aria-checked (on/off)", async () => {
        page.goto("sw-1", {
            role: "switch",
            items: ["sw-a"],
            focusedItemId: "sw-a",
        });
        await page.keyboard.press("Space");
        await page.locator("#sw-a").toHaveAttribute("aria-checked", "true");

        await page.keyboard.press("Space");
        await page.locator("#sw-a").toHaveAttribute("aria-checked", "false");
    });

    it("Enter → toggles aria-checked (optional per APG)", async () => {
        page.goto("sw-2", {
            role: "switch",
            items: ["sw-a"],
            focusedItemId: "sw-a",
        });
        await page.keyboard.press("Enter");
        await page.locator("#sw-a").toHaveAttribute("aria-checked", "true");
    });
});
