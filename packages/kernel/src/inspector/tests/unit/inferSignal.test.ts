import { describe, expect, it } from "vitest";
import type { Transaction } from "../../../core/transaction";
import { inferSignal } from "../../inferSignal";

describe("inferSignal", () => {
    it("should classify FOCUS events without state mutation as NO_OP when OS filter is ON", () => {
        const tx = {
            id: 1,
            timestamp: Date.now(),
            bubblePath: ["item-1", "GLOBAL"],
            command: { type: "COM_ACTIVATE_ITEM", payload: { id: "item-1" } },
            meta: { input: { type: "FOCUS", key: "Focus" } },
            changes: [], // No state mutations
            effects: {},
        };

        const signal = inferSignal(tx as unknown as Transaction);
        expect(signal.type).toBe("OS");
        expect(signal.trigger.kind).toBe("FOCUS");
        expect(signal.diff).toHaveLength(0);
    });

    it("should classify standard mutations as STATE_MUTATION", () => {
        const tx = {
            id: 2,
            timestamp: Date.now(),
            bubblePath: ["item-1", "GLOBAL"],
            command: { type: "COM_UPDATE_TITLE", payload: { title: "new title" } },
            meta: { input: { type: "KEYBOARD", key: "a", elementId: "input-1" } },
            changes: [{ path: "items.item-1.title", from: "old", to: "new title" }],
            effects: {},
        };

        const signal = inferSignal(tx as unknown as Transaction);
        expect(signal.type).toBe("STATE_MUTATION");
        expect(signal.trigger.kind).toBe("KEYBOARD");
        expect(signal.trigger.raw).toBe("a");
        expect(signal.trigger.elementId).toBe("input-1");
        expect(signal.diff).toHaveLength(1);
        expect(signal.diff[0]?.path).toBe("items.item-1.title");
    });

    it("should classify commands with only effects (and no state changes) as STATE_MUTATION", () => {
        const tx = {
            id: 3,
            timestamp: Date.now(),
            bubblePath: ["GLOBAL"],
            command: { type: "COM_COPY_CLIPBOARD", payload: {} },
            meta: { input: { type: "KEYBOARD", key: "Meta+C" } },
            changes: [],
            effects: { FX_WRITE_CLIPBOARD: { payload: "text" } },
        };

        const signal = inferSignal(tx as unknown as Transaction);
        // If it has effects, it's meaningful, even if state didn't change directly.
        expect(signal.type).toBe("STATE_MUTATION");
        expect(signal.effects).toContain("FX_WRITE_CLIPBOARD");
    });

    it("should classify empty keyboard/mouse events with no mutations as NO_OP", () => {
        const tx = {
            id: 4,
            timestamp: Date.now(),
            bubblePath: ["GLOBAL"],
            command: { type: "COM_NO_OP", payload: {} },
            meta: { input: { type: "KEYBOARD", key: "Shift" } },
            changes: [],
            effects: {},
        };

        const signal = inferSignal(tx as unknown as Transaction);
        expect(signal.type).toBe("NO_OP");
    });
});
