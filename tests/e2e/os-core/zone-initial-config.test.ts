/**
 * Zone Initial Config — Red Tests
 *
 * Verifies that Zone initial state is applied via Config (bind declaration),
 * not via Command (OS_INIT_SELECTION timing-sensitive dispatch).
 *
 * Discussion conclusion: "초기 상태를 커맨드로 다루지 마라."
 * Config는 bind({ initial })로 ZoneState 생성 시 포함.
 */

import { createOsPage } from "@os-sdk/app/defineApp/page";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Test 1: initial.selection is applied at zone creation
// ═══════════════════════════════════════════════════════════════════

describe("Zone Initial Config: selection", () => {
  it("bind({ initial: { selection } }) → ZoneState has selection at init", () => {
    const page = createOsPage();
    page.goto("test-zone", {
      items: ["tab-a", "tab-b", "tab-c"],
      config: {
        navigate: {
          orientation: "horizontal" as const,
          loop: true,
          entry: "selected" as const,
          recovery: "next" as const,
        },
        select: {
          mode: "single" as const,
          followFocus: true,
          disallowEmpty: true,
        },
        tab: { behavior: "escape" as const },
      },
      role: "tablist",
      // NEW: initial config — this is the feature under test
      initial: { selection: ["tab-b"] },
    });

    // Selection should be applied at init time (no dispatch needed)
    expect(page.attrs("tab-b")["aria-selected"]).toBe(true);
    expect(page.attrs("tab-a")["aria-selected"]).toBe(false);
    expect(page.attrs("tab-c")["aria-selected"]).toBe(false);
  });

  it("initial.selection overrides disallowEmpty default (first item)", () => {
    const page = createOsPage();
    page.goto("test-zone", {
      items: ["radio-1", "radio-2", "radio-3"],
      role: "radiogroup",
      // Specify radio-2, not radio-1 (which disallowEmpty would pick)
      initial: { selection: ["radio-2"] },
    });

    // radio-2 should be checked, not radio-1
    expect(page.attrs("radio-2")["aria-checked"]).toBe(true);
    expect(page.attrs("radio-1")["aria-checked"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Test 2: disallowEmpty still works without explicit initial
// ═══════════════════════════════════════════════════════════════════

describe("Zone Initial Config: disallowEmpty fallback", () => {
  it("disallowEmpty without initial → first item selected (existing behavior)", () => {
    const page = createOsPage();
    page.goto("test-zone", {
      items: ["tab-a", "tab-b", "tab-c"],
      role: "tablist",
      // NO initial specified → disallowEmpty should auto-select first
    });

    expect(page.attrs("tab-a")["aria-selected"]).toBe(true);
  });
});
