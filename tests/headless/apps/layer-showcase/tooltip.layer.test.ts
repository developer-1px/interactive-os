/**
 * Layer Playground: Tooltip — Overlay Lifecycle Test
 *
 * @spec docs/1-project/apg/layer-playground/blueprint-layer-playground.md #9
 *
 * OS GAP: Hover trigger is not supported in headless.
 * TriggerRole tooltip preset has onHover:true but headless page has no
 * hover simulation. Tests below document the expected behavior.
 *
 * Scenarios (all todo — pending hover headless support):
 *   1. Hover → tooltip appears
 *   2. Focus → tooltip appears
 *   3. Escape → tooltip dismisses
 *   4. Tooltip content is non-interactive (no Tab stop)
 */

import { describe, it } from "vitest";

describe("Layer Tooltip: Hover Trigger", () => {
  it.todo(
    "hover on trigger shows tooltip (OS gap: no headless hover simulation)",
  );
  it.todo("focus on trigger shows tooltip");
});

describe("Layer Tooltip: Escape Dismiss", () => {
  it.todo("Escape dismisses tooltip");
});

describe("Layer Tooltip: Non-interactive", () => {
  it.todo("tooltip content has no Tab stop (non-interactive)");
});
