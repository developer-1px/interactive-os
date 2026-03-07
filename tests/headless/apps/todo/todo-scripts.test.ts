/**
 * Todo App — Unified TestScript Runner (Headless)
 *
 * "Write once, run anywhere":
 *   - Headless (vitest): this file — page = createHeadlessPage(TodoApp, TodoPage)
 *   - Browser (TestBot):  run(browserPage, ourExpect)
 *   - Playwright E2E:     run(playwrightPage, playwrightExpect)
 *
 * Each TestScript from scripts/todo.ts is executed with the exact same
 * page interface and assertions. No setupZone("zoneName") seeding.
 */

import { TodoApp } from "@apps/todo/app";
import { expect as osExpect } from "@os-devtool/testing/expect";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { todoScripts } from "@os-devtool/testing/scripts/todo";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { _resetClipboardStore } from "@os-sdk/library/collection/createCollectionZone";
import { afterEach, beforeEach, describe, it } from "vitest";
import TodoPage from "../../../../src/pages/TodoPage";

type P = AppPageInternal<any>;
let page: P;

beforeEach(() => {
    _resetClipboardStore();
    page = createHeadlessPage(TodoApp, TodoPage);
    page.goto("/"); // Playwright-compatible: registers all zones + renders component
});

afterEach(() => {
    page.cleanup();
});

// ─── Run each TestScript ───
describe("Todo Unified Scripts (Headless)", () => {
    for (const script of todoScripts) {
        it(script.name, async () => {
            await script.run(page, osExpect);
        });
    }
});
