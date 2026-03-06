/**
 * Inspector Registration
 *
 * 1. TOGGLE_INSPECTOR command + Meta+I keybinding
 * 2. TestBot panel — ARIA test runner embedded in Inspector
 *
 * Side-effect import: `import "@inspector/register"`
 */

import { defineApp } from "@os-sdk/app/defineApp";
import React from "react";
import { TestBotPanel } from "./panels/TestBotPanel";
import { InspectorRegistry } from "./stores/InspectorRegistry";
import { InspectorStore } from "./stores/InspectorStore";

// ── App ──────────────────────────────────────────────────────────

const InspectorApp = defineApp("inspector", {});

// ── Command ──────────────────────────────────────────────────────

export const TOGGLE_INSPECTOR = InspectorApp.command(
  "TOGGLE_INSPECTOR",
  () => {
    InspectorStore.toggle();
    return undefined;
  },
  { key: "Meta+I" },
);

// ── TestBot Panel ────────────────────────────────────────────────
// Registers as a dynamic panel in the Inspector Activity Bar.
// Lifetime: session (never unregistered).

InspectorRegistry.register(
  "TESTBOT",
  "TestBot",
  React.createElement(TestBotPanel),
);
