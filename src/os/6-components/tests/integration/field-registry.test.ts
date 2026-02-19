/**
 * Field ↔ FieldRegistry Seam Test
 *
 * Verifies the lifecycle contract between Field.tsx (React component)
 * and FieldRegistry (vanilla store). This seam was the root cause of
 * the "English Enter not working" bug (2026-02-19).
 *
 * Bug: defineApp.bind creates new onSubmit/onChange function references
 * on each render → useEffect deps change → unregister → register →
 * localValue reset to "" → FIELD_COMMIT reads empty string.
 *
 * These tests verify:
 *   1. localValue survives re-registration (config-only update)
 *   2. updateValue persists across renders
 *   3. unregister→register cycle resets localValue (by design)
 */

import { describe, expect, it, beforeEach } from "vitest";
import { FieldRegistry } from "@os/6-components/field/FieldRegistry";

describe("FieldRegistry seam: register/unregister lifecycle", () => {
    const FIELD_ID = "TEST_FIELD";

    beforeEach(() => {
        // Clean slate — unregister if exists
        FieldRegistry.unregister(FIELD_ID);
    });

    it("register initializes localValue to empty string", () => {
        FieldRegistry.register(FIELD_ID, { name: FIELD_ID });
        const entry = FieldRegistry.getField(FIELD_ID);
        expect(entry).toBeDefined();
        expect(entry!.state.value).toBe("");
    });

    it("updateValue persists text", () => {
        FieldRegistry.register(FIELD_ID, { name: FIELD_ID });
        FieldRegistry.updateValue(FIELD_ID, "Hello world");

        const entry = FieldRegistry.getField(FIELD_ID);
        expect(entry!.state.value).toBe("Hello world");
    });

    it("re-register with new config preserves localValue", () => {
        // Initial register
        FieldRegistry.register(FIELD_ID, { name: FIELD_ID });
        FieldRegistry.updateValue(FIELD_ID, "typed text");

        // Re-register with updated config (simulates useEffect re-run)
        const newOnSubmit = (p: { text: string }) => ({
            type: "TEST",
            payload: p,
        });
        FieldRegistry.register(FIELD_ID, {
            name: FIELD_ID,
            onSubmit: newOnSubmit,
        });

        // localValue must survive
        const entry = FieldRegistry.getField(FIELD_ID);
        expect(entry!.state.value).toBe("typed text");
        expect(entry!.config.onSubmit).toBe(newOnSubmit);
    });

    it("unregister → register resets localValue (by design)", () => {
        FieldRegistry.register(FIELD_ID, { name: FIELD_ID });
        FieldRegistry.updateValue(FIELD_ID, "typed text");

        // Full cycle: cleanup then re-register
        FieldRegistry.unregister(FIELD_ID);
        FieldRegistry.register(FIELD_ID, { name: FIELD_ID });

        // localValue is reset — this is the bug scenario
        const entry = FieldRegistry.getField(FIELD_ID);
        expect(entry!.state.value).toBe("");
    });

    it("updateValue on non-existent field is no-op", () => {
        FieldRegistry.updateValue("NONEXISTENT", "ghost");
        expect(FieldRegistry.getField("NONEXISTENT")).toBeUndefined();
    });

    it("rapid register→updateValue→register preserves localValue", () => {
        // Simulates: mount → type → re-render (new config, same name)
        FieldRegistry.register(FIELD_ID, {
            name: FIELD_ID,
            onChange: () => ({ type: "A", payload: {} }),
        });
        FieldRegistry.updateValue(FIELD_ID, "fast typing");

        // Re-register with new onChange reference (what defineApp.bind does)
        FieldRegistry.register(FIELD_ID, {
            name: FIELD_ID,
            onChange: () => ({ type: "B", payload: {} }),
        });

        expect(FieldRegistry.getField(FIELD_ID)!.state.value).toBe(
            "fast typing",
        );
    });
});

describe("FieldRegistry seam: FIELD_COMMIT reads localValue", () => {
    const FIELD_ID = "DRAFT";

    beforeEach(() => {
        FieldRegistry.unregister(FIELD_ID);
    });

    it("onSubmit factory receives correct text from localValue", () => {
        let capturedText = "";
        const onSubmit = (p: { text: string }) => {
            capturedText = p.text;
            return { type: "ADD_TODO", payload: p };
        };

        FieldRegistry.register(FIELD_ID, { name: FIELD_ID, onSubmit });
        FieldRegistry.updateValue(FIELD_ID, "Buy milk");

        // Simulate what FIELD_COMMIT does
        const entry = FieldRegistry.getField(FIELD_ID)!;
        const text = entry.state.value;
        entry.config.onSubmit!({ text });

        expect(capturedText).toBe("Buy milk");
    });

    it("stable wrapper pattern: ref delegation preserves latest callback", () => {
        // Simulates the fix pattern: stable wrapper → ref → latest callback
        let version = 0;
        const ref = { current: (_p: { text: string }) => ({ type: `V${version}`, payload: {} }) };

        // Stable wrapper (created once, never changes identity)
        const stableOnSubmit = (p: { text: string }) => ref.current(p);

        FieldRegistry.register(FIELD_ID, {
            name: FIELD_ID,
            onSubmit: stableOnSubmit,
        });
        FieldRegistry.updateValue(FIELD_ID, "test");

        // Simulate re-render: ref.current updates, but registry is NOT re-registered
        version = 1;
        ref.current = (p) => ({ type: `V${version}`, payload: p });

        // FIELD_COMMIT calls the registered onSubmit
        const entry = FieldRegistry.getField(FIELD_ID)!;
        const result = entry.config.onSubmit!({ text: entry.state.value });

        // Should use the latest version via ref delegation
        expect(result.type).toBe("V1");
        // localValue preserved (no re-registration occurred)
        expect(entry.state.value).toBe("test");
    });
});
