import { defineApp } from "@os-sdk/app/defineApp";
import { describe, expect, it } from "vitest";

/**
 * Overlay Trigger attribute tests (updated for OverlayHandle API).
 *
 * bind() trigger prop-getters are covered by zone-trigger-api.test.ts.
 * This file covers overlay-specific trigger() attrs (aria-haspopup, data-trigger-id).
 */

describe("overlay trigger attributes", () => {
  it("overlay trigger() returns data-trigger-id and aria-haspopup", () => {
    const TestApp = defineApp("test", {});
    const zone = TestApp.createZone("myZone");

    const handle = zone.overlay("my-menu", { role: "menu" });

    const result = handle.trigger();

    expect(result).toBeDefined();
    expect(result["data-trigger-id"]).toBe("my-menu-trigger");
    expect(result["aria-haspopup"]).toBe("true");

    // Must not inject React event handlers — pure data attributes only
    expect(
      (result as unknown as Record<string, unknown>)["onClick"],
    ).toBeUndefined();
  });

  it("overlay trigger() for dialog role returns aria-haspopup=dialog", () => {
    const TestApp = defineApp("test", {});
    const zone = TestApp.createZone("myZone");

    const handle = zone.overlay("my-dialog", { role: "dialog" });

    const result = handle.trigger();

    expect(result["data-trigger-id"]).toBe("my-dialog-trigger");
    expect(result["aria-haspopup"]).toBe("dialog");
    expect(result["aria-controls"]).toBe("my-dialog");
  });
});
