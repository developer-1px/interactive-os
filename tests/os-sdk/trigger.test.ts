import { describe, expect, it } from "vitest";
import { defineApp } from "@os-sdk/app/defineApp";

/**
 * Overlay Trigger attribute tests.
 *
 * bind() trigger prop-getters are covered by zone-trigger-api.test.ts.
 * This file covers overlay-specific Trigger() attrs (aria-haspopup, data-trigger-id).
 */

describe("overlay trigger attributes", () => {
  it("overlay Trigger() returns data-trigger-id and aria-haspopup", () => {
    const TestApp = defineApp("test", {});
    const zone = TestApp.createZone("myZone");

    const overlay = zone.overlay("my-menu", { role: "menu" });

    const result = overlay.Trigger();

    expect(result).toBeDefined();
    expect(result["data-trigger-id"]).toBe("my-menu-trigger");
    expect(result["aria-haspopup"]).toBe("true");

    // Must not inject React event handlers — pure data attributes only
    expect((result as Record<string, unknown>).onClick).toBeUndefined();
  });

  it("overlay Trigger() for dialog role returns aria-haspopup=dialog", () => {
    const TestApp = defineApp("test", {});
    const zone = TestApp.createZone("myZone");

    const overlay = zone.overlay("my-dialog", { role: "dialog" });

    const result = overlay.Trigger();

    expect(result["data-trigger-id"]).toBe("my-dialog-trigger");
    expect(result["aria-haspopup"]).toBe("dialog");
    expect(result["aria-controls"]).toBe("my-dialog");
  });
});
