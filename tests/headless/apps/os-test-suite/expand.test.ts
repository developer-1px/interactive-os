/**
 * OS Test Suite: Expand / Collapse
 *
 * Exercises disclosure expand/collapse and initial state.
 */

import { describe, it } from "vitest";

// OS gap: headless expand — initial state not seeded + click double-dispatches OS_EXPAND
describe("OS Pipeline: Expand — Initial State", () => {
  it.todo("section-a starts expanded (initial config)");
  it.todo("section-b starts collapsed");
  it.todo("section-c starts collapsed");
});

describe("OS Pipeline: Expand — Toggle", () => {
  it.todo("Enter toggles expanded state");
  it.todo("Space toggles expanded state");
  it.todo("click toggles expanded state (via inputmap)");
  it.todo("multiple items expand independently");
});
