/**
 * ARIA Test Runner — Playwright E2E
 *
 * "Write once, run anywhere" — proven.
 *
 * This file imports the SAME test scripts from @os/testing/scripts.ts
 * and runs them with Playwright's native page + expect.
 *
 * Zero shim. Zero adapter. One shared codebase.
 */
import { expect, test } from "@playwright/test";
import {
    allAriaScripts,
} from "../../../../os/testing/scripts";

test.beforeEach(async ({ page }) => {
    await page.goto("/playground/testbot");
});

for (const script of allAriaScripts) {
    test(script.name, async ({ page }) => {
        // biome-ignore lint/suspicious/noExplicitAny: Playwright Page/expect are supersets of our Page/ExpectLocator
        await script.run(page as any, expect as any);
    });
}
