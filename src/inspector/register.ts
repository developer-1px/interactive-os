/**
 * Inspector Registration
 *
 * 1. TOGGLE_INSPECTOR command + Meta+I keybinding
 * 2. TestBot panel — ARIA test runner embedded in Inspector
 *
 * Side-effect import: `import "@inspector/register"`
 */

import React from "react";
import { os } from "@/os/core/engine/kernel";
import { Keybindings } from "@/os/2-resolve/keybindings";
import { TestBotPanel } from "./panels/TestBotPanel";
import { InspectorRegistry } from "./stores/InspectorRegistry";
import { InspectorStore } from "./stores/InspectorStore";

// ── Command ──────────────────────────────────────────────────────

export const TOGGLE_INSPECTOR = os.defineCommand(
  "TOGGLE_INSPECTOR",
  () => () => {
    InspectorStore.toggle();
    return undefined;
  },
);

// ── Keybinding ───────────────────────────────────────────────────

Keybindings.register({
  key: "Meta+I",
  command: TOGGLE_INSPECTOR(),
});

// ── TestBot Panel ────────────────────────────────────────────────
// Registers as a dynamic panel in the Inspector Activity Bar.
// Lifetime: session (never unregistered).

InspectorRegistry.register(
  "TESTBOT",
  "TestBot",
  React.createElement(TestBotPanel),
);
