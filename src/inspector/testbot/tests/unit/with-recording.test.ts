/**
 * withRecording — Unit tests
 *
 * Verifies that the recording decorator correctly captures
 * pressKey, click, and attrs calls without affecting test behavior.
 */

import { createTestOsKernel } from "@os/3-commands/tests/integration/helpers/createTestOsKernel";
import { describe, expect, it } from "vitest";
import { withRecording } from "../../features/withRecording";

describe("withRecording", () => {
    function setup() {
        const kernel = createTestOsKernel();
        kernel.setItems(["a", "b", "c"]);
        kernel.setRole("list", "listbox");
        kernel.setActiveZone("list", "a");
        return withRecording(kernel, "test-file.test.ts");
    }

    it("records pressKey with before/after focus", () => {
        const t = setup();

        t.pressKey("ArrowDown");

        const steps = t.getSteps();
        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            type: "pressKey",
            key: "ArrowDown",
            focusedBefore: "a",
            focusedAfter: "b",
        });
    });

    it("records click with focusedAfter", () => {
        const t = setup();

        t.click("c");

        const steps = t.getSteps();
        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            type: "click",
            itemId: "c",
        });
    });

    it("records attrs with result", () => {
        const t = setup();

        const result = t.attrs("a");

        const steps = t.getSteps();
        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            type: "attrs",
            itemId: "a",
            result: expect.objectContaining({ tabIndex: 0 }),
        });
        // attrs still returns the correct value
        expect(result.tabIndex).toBe(0);
    });

    it("does not affect kernel behavior", () => {
        const t = setup();

        // Same behavior as non-recorded kernel
        t.pressKey("ArrowDown");
        expect(t.focusedItemId()).toBe("b");

        t.pressKey("ArrowDown");
        expect(t.focusedItemId()).toBe("c");
    });

    it("records multiple steps in order", () => {
        const t = setup();

        t.pressKey("ArrowDown");
        t.pressKey("ArrowDown");
        t.click("a");
        t.attrs("a");

        const steps = t.getSteps();
        expect(steps).toHaveLength(4);
        expect(steps.map((s) => s.type)).toEqual([
            "pressKey",
            "pressKey",
            "click",
            "attrs",
        ]);
    });

    it("clearSteps resets recording", () => {
        const t = setup();

        t.pressKey("ArrowDown");
        expect(t.getSteps()).toHaveLength(1);

        t.clearSteps();
        expect(t.getSteps()).toHaveLength(0);
    });

    it("getRecording returns full metadata", () => {
        const t = setup();

        t.recordLifecycle({
            type: "test:start",
            name: "test1",
            timestamp: 0,
        });
        t.pressKey("ArrowDown");
        t.recordLifecycle({
            type: "test:end",
            name: "test1",
            status: "pass",
            duration: 1,
            timestamp: 1,
        });

        const recording = t.getRecording();
        expect(recording.file).toBe("test-file.test.ts");
        expect(recording.summary.passed).toBe(1);
        expect(recording.summary.failed).toBe(0);
        expect(recording.steps).toHaveLength(3);
    });

    it("timestamps are relative to recording start", () => {
        const t = setup();

        t.pressKey("ArrowDown");

        const steps = t.getSteps();
        expect(steps[0].timestamp).toBeGreaterThanOrEqual(0);
        expect(steps[0].timestamp).toBeLessThan(1000); // should be near-instant
    });
});
