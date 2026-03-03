/**
 * TestBot Manifest — dev-only zone→scripts mapping.
 *
 * Declares which TestScript[] to lazy-load when specific zones mount.
 * TestBotRegistry subscribes to ZoneRegistry and uses this manifest
 * to auto-activate/deactivate scripts without page-level boilerplate.
 *
 * Production-safe: this file is only imported by TestBotRegistry's
 * zone-reactive initializer, which itself lives in os-devtool.
 */

import type { TestScript } from "@os-devtool/testing";

export interface ManifestEntry {
  /** Zone IDs that trigger this entry's scripts when mounted */
  zones: string[];
  /** Human-readable group name for UI display */
  group: string;
  /** Lazy import — called once on first zone match, cached thereafter */
  load: () => Promise<TestScript[]>;
}

export const TESTBOT_MANIFEST: ManifestEntry[] = [
  {
    zones: ["canvas"],
    group: "Builder",
    load: () =>
      import("@/apps/builder/testbot-builder-arrow").then(
        (m) => m.builderArrowNavScripts,
      ),
  },
  {
    zones: ["apg-sidebar"],
    group: "APG Showcase",
    load: () => import("@os-devtool/testing").then((m) => m.apgShowcaseScripts),
  },
  {
    zones: ["nav-list", "sel-range", "tree-widget", "nav-grid"],
    group: "Focus Lab",
    load: () =>
      import("@/pages/focus-showcase/focusScripts").then(
        (m) => m.focusShowcaseScripts,
      ),
  },
];
