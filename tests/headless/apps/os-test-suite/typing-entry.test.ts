/**
 * OS Test Suite: typingEntry Zone Option
 *
 * DT1-DT8 from spec.md.
 * Tests that typingEntry: true makes printable chars trigger onAction.
 */

import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { TypingEntryApp } from "@/pages/os-test-suite/patterns/TypingEntryPattern";

function setup() {
  const { page } = createPage(TypingEntryApp);
  page.goto("/");
  return page;
}

function getActionCount(): number {
  const appState = os.getState().apps["os-test-typing-entry"] as
    | { actionCount: number }
    | undefined;
  return appState?.actionCount ?? 0;
}

describe("OS Pipeline: typingEntry", () => {
  // DT1: typingEntry true + printable char → onAction
  it("printable char 'a' triggers onAction (DT1)", () => {
    const page = setup();

    page.click("box-a");
    const before = getActionCount();
    page.keyboard.press("a");

    expect(getActionCount()).toBe(before + 1);
  });

  // DT2: typingEntry true + digit → onAction
  it("digit '5' triggers onAction (DT2)", () => {
    const page = setup();

    page.click("box-a");
    const before = getActionCount();
    page.keyboard.press("5");

    expect(getActionCount()).toBe(before + 1);
  });

  // DT3: typingEntry true + non-printable → no onAction
  it("ArrowDown does NOT trigger onAction (DT3)", () => {
    const page = setup();

    page.click("box-a");
    const before = getActionCount();
    page.keyboard.press("ArrowDown");

    expect(getActionCount()).toBe(before);
  });

  // DT4: typingEntry true + Enter → onAction (existing OS_ACTIVATE)
  it("Enter still triggers onAction via OS_ACTIVATE (DT4)", () => {
    const page = setup();

    page.click("box-a");
    const before = getActionCount();
    page.keyboard.press("Enter");

    expect(getActionCount()).toBe(before + 1);
  });

  // DT5: typingEntry true + Ctrl+a → no onAction
  it("Ctrl+a does NOT trigger onAction (DT5)", () => {
    const page = setup();

    page.click("box-a");
    const before = getActionCount();
    page.keyboard.press("Control+a");

    expect(getActionCount()).toBe(before);
  });

  // DT6: typingEntry true + Shift+a → onAction (still printable)
  it("Shift+a triggers onAction (DT6)", () => {
    const page = setup();

    page.click("box-a");
    const before = getActionCount();
    page.keyboard.press("Shift+a");

    expect(getActionCount()).toBe(before + 1);
  });

  // DT7: no typingEntry + printable → no onAction
  it("zone without typingEntry ignores printable chars (DT7)", () => {
    const page = setup();

    page.click("item-x"); // normal zone (no typingEntry)
    const before = getActionCount();
    page.keyboard.press("a");

    expect(getActionCount()).toBe(before);
  });

  // DT8: Space does not trigger typingEntry (handled by existing OS commands)
  it("Space does NOT trigger typingEntry (DT8)", () => {
    const page = setup();

    page.click("box-a");
    const before = getActionCount();
    page.keyboard.press("Space");

    // Space may trigger OS_ACTIVATE → onAction (existing behavior)
    // but should NOT double-trigger via typingEntry
    expect(getActionCount()).toBeLessThanOrEqual(before + 1);
  });
});
