/**
 * resolveTab - Tab key behavior logic
 *
 * Phase 3: RESOLVE (Tab)
 * Handles trap/escape/flow behaviors.
 */

import type { TabConfig, TabDirection } from "../../types";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TabResult {
  action: "trap" | "escape" | "flow";
  targetId: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// Main Resolver
// ═══════════════════════════════════════════════════════════════════

export function resolveTab(
  currentId: string | null,
  direction: TabDirection,
  items: string[],
  config: TabConfig,
): TabResult {
  switch (config.behavior) {
    case "trap":
      return resolveTrap(currentId, direction, items);

    case "flow":
      return resolveFlow(currentId, direction, items);

    case "escape":
    default:
      return { action: "escape", targetId: null };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Trap Behavior (Loop within zone)
// ═══════════════════════════════════════════════════════════════════

function resolveTrap(
  currentId: string | null,
  direction: TabDirection,
  items: string[],
): TabResult {
  if (items.length === 0) {
    return { action: "trap", targetId: null };
  }

  if (!currentId) {
    return {
      action: "trap",
      targetId: direction === "forward" ? items[0] : items[items.length - 1],
    };
  }

  const currentIndex = items.indexOf(currentId);
  if (currentIndex === -1) {
    return { action: "trap", targetId: items[0] };
  }

  const delta = direction === "forward" ? 1 : -1;
  let nextIndex = currentIndex + delta;

  // Loop at boundaries
  if (nextIndex < 0) {
    nextIndex = items.length - 1;
  } else if (nextIndex >= items.length) {
    nextIndex = 0;
  }

  return {
    action: "trap",
    targetId: items[nextIndex],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Flow Behavior (Navigate within zone, exit at boundaries)
// ═══════════════════════════════════════════════════════════════════

function resolveFlow(
  currentId: string | null,
  direction: TabDirection,
  items: string[],
): TabResult {
  if (items.length === 0) {
    return { action: "flow", targetId: null };
  }

  if (!currentId) {
    // No current focus - enter at appropriate end
    return {
      action: "flow",
      targetId: direction === "forward" ? items[0] : items[items.length - 1],
    };
  }

  const currentIndex = items.indexOf(currentId);
  if (currentIndex === -1) {
    return { action: "flow", targetId: items[0] };
  }

  const delta = direction === "forward" ? 1 : -1;
  const nextIndex = currentIndex + delta;

  // Exit at boundaries (no loop)
  if (nextIndex < 0 || nextIndex >= items.length) {
    return { action: "flow", targetId: null };
  }

  return {
    action: "flow",
    targetId: items[nextIndex],
  };
}
