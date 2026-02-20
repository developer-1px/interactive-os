/**
 * History Noise Filtering Test
 *
 * Verifies that rapid consecutive field updates (same command type + same target)
 * are coalesced into a single undo entry, not one entry per keystroke.
 *
 * Related issue: 2025-02-21_field-history-explosion
 */

import { BuilderApp, updateFieldByDomId } from "@apps/builder/app";
import { undoCommand } from "@apps/builder/app";
import { describe, expect, it } from "vitest";

describe("History: Noise Filtering for rapid field updates", () => {
    function createApp() {
        return BuilderApp.create({ history: true, withOS: true });
    }

    it("rapid field updates should NOT create one history entry per keystroke", () => {
        const app = createApp();
        const initialPast = app.state.history.past.length;

        // Simulate typing "hello" — 5 rapid updateFieldByDomId commands
        for (const char of ["h", "he", "hel", "hell", "hello"]) {
            app.dispatch(updateFieldByDomId({ domId: "ncp-hero-title", value: char }));
        }

        // Should NOT have 5 separate entries — should be coalesced
        const entriesCreated = app.state.history.past.length - initialPast;

        // Expectation: at most 1 entry for the whole typing burst
        expect(entriesCreated).toBeLessThanOrEqual(1);
    });

    it("undo after coalesced typing should restore to pre-typing state", () => {
        const app = createApp();
        const originalTitle = app.state.data.blocks[0]!.fields["title"];

        // Type several characters
        for (const char of ["X", "XY", "XYZ"]) {
            app.dispatch(updateFieldByDomId({ domId: "ncp-hero-title", value: char }));
        }

        // Field should be "XYZ" now
        expect(app.state.data.blocks[0]!.fields["title"]).toBe("XYZ");

        // Single undo should restore original
        app.dispatch(undoCommand());

        expect(app.state.data.blocks[0]!.fields["title"]).toBe(originalTitle);
    });
});
