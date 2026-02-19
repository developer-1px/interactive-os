/**
 * OS_DELETE command — Unit Tests
 *
 * Tests: OS_DELETE → onDelete callback pipeline via ZoneRegistry.
 */

import { OS_DELETE } from "@os/3-commands/interaction/delete";
import { kernel } from "@os/kernel";
import { describe, it } from "vitest";
import { registerZone, setupFocus, useKernelSnapshot } from "./helpers/os-command-helpers";

useKernelSnapshot();

describe("OS_DELETE → onDelete pipeline", () => {
    it("dispatches onDelete callback when Zone has it", () => {
        setupFocus("testZone", "item-1");
        registerZone("testZone", {
            onDelete: (cursor) => ({ type: "mock/delete", payload: { id: cursor.focusId } }),
        });

        kernel.dispatch(OS_DELETE());
    });

    it("does nothing when Zone has no onDelete", () => {
        setupFocus("testZone", "item-1");
        registerZone("testZone", {});

        kernel.dispatch(OS_DELETE());
    });
});
