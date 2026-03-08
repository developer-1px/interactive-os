/**
 * TestBot ZIFT Zones — accordion(suites) + toolbar(actions).
 *
 * Bootstrapping: OS's own devtool built with OS ZIFT primitives.
 */

import { getTestBotState, TestBotApp } from "./app";

/** Convert suite name to a stable CSS-safe item ID */
export function suiteItemId(name: string): string {
  return `tb-${name.replace(/\s+/g, "-").toLowerCase()}`;
}

// ── Suites Accordion Zone ────────────────────────────────────────

const suitesZone = TestBotApp.createZone("testbot-suites");

export const SuitesUI = suitesZone.bind({
  role: "accordion",
  getItems: () => getTestBotState().suites.map((s) => suiteItemId(s.name)),
});

// ── Action Toolbar Zone ──────────────────────────────────────────

const toolbarZone = TestBotApp.createZone("testbot-toolbar");

export const ToolbarUI = toolbarZone.bind({
  role: "toolbar",
  getItems: () => ["tb-run-all", "tb-quick"],
});
