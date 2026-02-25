/**
 * T2: createOsPage auto-dumps diagnostics on test failure
 *
 * When a test using createOsPage fails, the transaction log should
 * be automatically printed — "Always Record, Print on Failure"
 * (Go t.Log() pattern).
 *
 * 🔴 RED: createOsPage currently has no auto-diagnostics on failure.
 */

import { createOsPage, type OsPage } from "@os/createOsPage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("T2: Auto-diagnostics on test failure", () => {
    let page: OsPage;
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });

    beforeEach(() => {
        consoleSpy.mockClear();
        page = createOsPage();
        page.goto("test-zone", { role: "list", focusedItemId: null });
    });

    afterEach(() => {
        page.cleanup();
    });

    it("#1 page.dumpDiagnostics() outputs transaction log", () => {
        // Dispatch a command to create a transaction
        page.keyboard.press("ArrowDown");

        // Manual call — this is what onTestFailed would call
        page.dumpDiagnostics();

        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
        expect(output).toContain("OS_NAVIGATE");
    });

    it("#2 dumpDiagnostics includes scope chain", () => {
        page.keyboard.press("ArrowDown");
        page.dumpDiagnostics();

        const output = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
        expect(output).toMatch(/scope/i);
    });
});
