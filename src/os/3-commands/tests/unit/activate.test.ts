/**
 * ACTIVATE command — Unit Tests
 *
 * Tests: ACTIVATE → onAction callback pipeline via ZoneRegistry.
 */

import { ACTIVATE } from "@os/3-commands/interaction/activate";
import { kernel } from "@os/kernel";
import { describe, it } from "vitest";
import { registerZone, setupFocus, useKernelSnapshot } from "./helpers/os-command-helpers";

useKernelSnapshot();

describe("ACTIVATE → onAction pipeline", () => {
    it("dispatches onAction callback when Zone has it", () => {
        setupFocus("testZone", "item-1");
        registerZone("testZone", {
            onAction: (cursor) => ({ type: "mock/action", payload: { id: cursor.focusId } }),
        });

        kernel.dispatch(ACTIVATE());
    });
});
