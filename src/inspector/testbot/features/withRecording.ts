/**
 * withRecording — Decorator that wraps a test kernel with step recording.
 *
 * Usage:
 *   const t = withRecording(createTestOsKernel(), "my-test.test.ts");
 *   t.pressKey("ArrowDown");  // recorded as PressKeyStep
 *   t.click("item-1");        // recorded as ClickStep
 *   t.attrs("item-1");        // recorded as AttrsStep
 *   const steps = t.getRecording();  // retrieve recorded steps
 *
 * Design principles:
 *   - Zero impact on test logic (decorator is transparent)
 *   - Synchronous recording (no async overhead)
 *   - Same return types as original kernel methods
 */

import type { ItemAttrs } from "@os/3-commands/tests/integration/helpers/createTestOsKernel";
import type { TestRecording, TestStep } from "../entities/TestStep";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

/** Minimal interface for what we decorate — only the methods we record */
interface RecordableKernel {
    pressKey: (key: string) => void;
    click: (itemId: string, opts?: any) => void;
    attrs: (itemId: string, zoneId?: string) => ItemAttrs;
    focusedItemId: (zoneId?: string) => string | null;
    state?: () => Record<string, unknown>;
}

type RecordedKernel<T extends RecordableKernel> = T & {
    /** Get all recorded steps */
    getSteps: () => TestStep[];
    /** Get the full recording with metadata */
    getRecording: () => TestRecording;
    /** Clear recorded steps */
    clearSteps: () => void;
    /** Record a suite/test lifecycle event */
    recordLifecycle: (step: TestStep) => void;
};

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function withRecording<T extends RecordableKernel>(
    kernel: T,
    file: string,
): RecordedKernel<T> {
    const steps: TestStep[] = [];
    const startedAt = Date.now();

    function captureSnapshot(): Record<string, unknown> | undefined {
        if (!kernel.state) return undefined;
        try {
            return JSON.parse(JSON.stringify(kernel.state()));
        } catch {
            return undefined;
        }
    }

    // ─── Wrap pressKey ───

    const originalPressKey = kernel.pressKey.bind(kernel);

    function pressKey(key: string) {
        const focusedBefore = kernel.focusedItemId();
        originalPressKey(key);
        const focusedAfter = kernel.focusedItemId();

        steps.push({
            type: "pressKey",
            key,
            focusedBefore,
            focusedAfter,
            timestamp: Date.now() - startedAt,
            snapshot: captureSnapshot(),
        });
    }

    // ─── Wrap click ───

    const originalClick = kernel.click.bind(kernel);

    function click(itemId: string, opts?: any) {
        originalClick(itemId, opts);
        const focusedAfter = kernel.focusedItemId();

        steps.push({
            type: "click",
            itemId,
            focusedAfter,
            timestamp: Date.now() - startedAt,
            snapshot: captureSnapshot(),
        });
    }

    // ─── Wrap attrs ───

    const originalAttrs = kernel.attrs.bind(kernel);

    function attrs(itemId: string, zoneId?: string): ItemAttrs {
        const result = originalAttrs(itemId, zoneId);

        steps.push({
            type: "attrs",
            itemId,
            result: result as unknown as Record<string, unknown>,
            timestamp: Date.now() - startedAt,
            snapshot: captureSnapshot(),
        });

        return result;
    }

    // ─── Recording access ───

    function getSteps(): TestStep[] {
        return [...steps];
    }

    function getRecording(): TestRecording {
        const now = Date.now();
        let passed = 0;
        let failed = 0;

        for (const s of steps) {
            if (s.type === "test:end") {
                if (s.status === "pass") passed++;
                else failed++;
            }
        }

        return {
            file,
            startedAt,
            duration: now - startedAt,
            steps: [...steps],
            summary: { total: passed + failed, passed, failed },
        };
    }

    function clearSteps() {
        steps.length = 0;
    }

    function recordLifecycle(step: TestStep) {
        steps.push(step);
    }

    // ─── Return decorated kernel ───

    return {
        ...kernel,
        pressKey,
        click,
        attrs,
        getSteps,
        getRecording,
        clearSteps,
        recordLifecycle,
    };
}
