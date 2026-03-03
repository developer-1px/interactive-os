/**
 * @spec docs/1-project/command-config-invariant/spec.md §1.2 (T2)
 *
 * T2: NAVIGATE chain 실행기 — input-based tests
 * keyboard.press triggers the full pipeline:
 *   key → resolveKeyboard → OS_NAVIGATE → chain executor
 */
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { describe, it, afterEach } from "vitest";

describe("T2: NAVIGATE chain (input-based)", () => {
    const page = createHeadlessPage();
    afterEach(() => page.cleanup());

    describe("tree: ArrowRight chain ['expand', 'enterChild']", () => {
        it("ArrowRight on collapsed → expands", async () => {
            page.goto("tree-zone", {
                role: "tree",
                items: ["node-1", "child-1", "leaf-1"],
                focusedItemId: "node-1",
            });

            await page.keyboard.press("ArrowRight");
            await page.locator("#node-1").toHaveAttribute("aria-expanded", "true");
        });

        it("ArrowRight on expanded → enters first child", async () => {
            page.goto("tree-zone", {
                role: "tree",
                items: ["node-1", "child-1", "leaf-1"],
                focusedItemId: "node-1",
                initial: { expanded: ["node-1"] },
            });
            // Tree hierarchy is domain data — app supplies levels
            page.os.setTreeLevels({ "node-1": 1, "child-1": 2, "leaf-1": 2 });

            await page.keyboard.press("ArrowRight");
            await page.locator("#child-1").toBeFocused();
        });
    });

    describe("tree: ArrowLeft chain ['collapse', 'goParent']", () => {
        it("ArrowLeft on expanded → collapses", async () => {
            page.goto("tree-zone", {
                role: "tree",
                items: ["node-1", "child-1", "leaf-1"],
                focusedItemId: "node-1",
                initial: { expanded: ["node-1"] },
            });

            await page.keyboard.press("ArrowLeft");
            await page.locator("#node-1").toHaveAttribute("aria-expanded", "false");
        });
    });

    describe("tree: ArrowDown/ArrowUp linear navigation", () => {
        it("ArrowDown moves to next item", async () => {
            page.goto("tree-zone", {
                role: "tree",
                items: ["node-1", "child-1", "leaf-1"],
                focusedItemId: "node-1",
            });

            await page.keyboard.press("ArrowDown");
            await page.locator("#child-1").toBeFocused();
        });

        it("ArrowUp moves to previous item", async () => {
            page.goto("tree-zone", {
                role: "tree",
                items: ["node-1", "child-1", "leaf-1"],
                focusedItemId: "child-1",
            });

            await page.keyboard.press("ArrowUp");
            await page.locator("#node-1").toBeFocused();
        });
    });
});
