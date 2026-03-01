/**
 * Alert Pattern — OS Headless Tests
 *
 * W3C APG Alert spec:
 * - role="alert" (implicit aria-live="assertive" + aria-atomic="true")
 * - No keyboard interaction
 * - Does NOT move focus
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert/
 */

import { expect, it, describe, beforeEach } from "vitest";
import { AlertPattern, AlertApp, SHOW_ALERT, RESET_ALERTS } from "../../patterns/AlertPattern";
import { createPage } from "@os/defineApp.page";

describe("AlertPattern (Headless & Projection)", () => {
    let page: ReturnType<typeof createPage>;

    beforeEach(() => {
        page = createPage(AlertApp, AlertPattern);
        page.dispatch(RESET_ALERTS());
    });

    // ═══════════════════════════════════════════════════
    // State & Command Simulation
    // ═══════════════════════════════════════════════════

    it("initial state has no alerts", () => {
        expect(page.state.alerts.length).toBe(0);
        expect(page.html()).not.toContain('role="alert"');
    });

    it("SHOW_ALERT command adds an alert to the state without moving focus", () => {
        // Ensure no focus is currently moved
        const initialFocus = page.focusedItemId();

        // Dispatch the command to simulate system trigger
        page.dispatch(SHOW_ALERT());

        // Verify OS state updated correctly
        expect(page.state.alerts.length).toBe(1);

        // Verify APG rule: Does NOT move focus
        expect(page.focusedItemId()).toBe(initialFocus);
    });

    // ═══════════════════════════════════════════════════
    // UI Projection Verification
    // ═══════════════════════════════════════════════════

    it("renders role='alert' when state is updated", () => {
        // Simulate two click triggers
        page.dispatch(SHOW_ALERT());
        page.dispatch(SHOW_ALERT());

        const html = page.html();
        // The trigger button should exist
        expect(html).toContain('id="alert-trigger"');
        // Both alerts should be projected into the DOM string
        const alertMatches = html.match(/role="alert"/g);
        expect(alertMatches?.length).toBe(2);
    });
});
