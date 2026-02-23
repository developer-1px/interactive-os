/**
 * resolveClick — Unit Tests
 *
 * Tests the pure click event resolution logic (activate.onClick).
 * Separate from resolveMouse (mousedown) — click is a distinct event.
 */

import { resolveClick } from "@os/1-listeners/mouse/resolveClick";
import { describe, expect, test } from "vitest";

describe("resolveClick", () => {
    test("activateOnClick + focused item → OS_ACTIVATE dispatched", () => {
        const result = resolveClick({ activateOnClick: true, focusedItemId: "item-1" });
        expect(result.commands).toHaveLength(1);
        expect(result.commands[0]!.type).toBe("OS_ACTIVATE");
    });

    test("activateOnClick + no focused item → no commands", () => {
        const result = resolveClick({ activateOnClick: true, focusedItemId: null });
        expect(result.commands).toHaveLength(0);
    });

    test("no activateOnClick → no commands", () => {
        const result = resolveClick({ activateOnClick: false, focusedItemId: "item-1" });
        expect(result.commands).toHaveLength(0);
    });
});
