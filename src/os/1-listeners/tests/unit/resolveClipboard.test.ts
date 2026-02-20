/**
 * resolveClipboard — Unit Tests
 *
 * Tests the pure clipboard event resolution logic.
 * No DOM, no JSDOM — just input → output.
 */

import { resolveClipboard } from "@os/1-listeners/clipboard/resolveClipboard";
import { describe, expect, test } from "vitest";

describe("resolveClipboard", () => {
  test("inputActive → passthrough", () => {
    expect(
      resolveClipboard({
        event: "copy",
        isInputActive: true,
        zoneHasCallback: true,
      }),
    ).toEqual({ action: "passthrough" });
  });

  test("no zone callback → passthrough", () => {
    expect(
      resolveClipboard({
        event: "copy",
        isInputActive: false,
        zoneHasCallback: false,
      }),
    ).toEqual({ action: "passthrough" });
  });

  test("copy with zone callback → dispatch", () => {
    expect(
      resolveClipboard({
        event: "copy",
        isInputActive: false,
        zoneHasCallback: true,
      }),
    ).toEqual({ action: "dispatch", event: "copy" });
  });

  test("cut with zone callback → dispatch", () => {
    expect(
      resolveClipboard({
        event: "cut",
        isInputActive: false,
        zoneHasCallback: true,
      }),
    ).toEqual({ action: "dispatch", event: "cut" });
  });

  test("paste with zone callback → dispatch", () => {
    expect(
      resolveClipboard({
        event: "paste",
        isInputActive: false,
        zoneHasCallback: true,
      }),
    ).toEqual({ action: "dispatch", event: "paste" });
  });

  test("inputActive overrides zone callback", () => {
    expect(
      resolveClipboard({
        event: "paste",
        isInputActive: true,
        zoneHasCallback: true,
      }),
    ).toEqual({ action: "passthrough" });
  });
});
