/**
 * TestBot Manifest — Auto-discovery via import.meta.glob.
 *
 * Convention: any `testbot-*.ts` file under `src/` that exports:
 *   - `zones: string[]` — zone IDs that trigger loading
 *   - `group: string` — human-readable group name for UI display
 *   - a named export of `TestScript[]` (any name — auto-detected)
 *
 * New testbot files are automatically discovered — no manual registration.
 * Just create the file, export zones/group/scripts, done.
 *
 * Production-safe: this file is only imported by TestBotRegistry's
 * zone-reactive initializer, which itself lives in os-devtool.
 */

import type { TestScript } from "@os-testing/scripts";

export interface ManifestEntry {
  /** Zone IDs that trigger this entry's scripts when mounted */
  zones: string[];
  /** Human-readable group name for UI display */
  group: string;
  /** Route path prefix — primary filter key. Zone matching is fallback. */
  route?: string | undefined;
  /** Lazy import — called once on first zone match, cached thereafter */
  load: () => Promise<TestScript[]>;
}

// ═══════════════════════════════════════════════════════════════════
// Metadata (eager) — read zones/group synchronously at import time
// Scripts (lazy) — loaded only when matching zones mount
// ═══════════════════════════════════════════════════════════════════

type MetadataModule = {
  zones?: string[];
  group?: string;
  route?: string;
};

/** Eager: synchronously import zone/group metadata from all testbot files */
const metadata = import.meta.glob<MetadataModule>(
  [
    "../apps/**/testbot-*.ts",
    "../docs-viewer/testbot-*.ts",
    "../pages/**/testbot-*.ts",
  ],
  { eager: true },
);

/** Lazy: load full modules (with TestScript[]) only on demand */
const loaders = import.meta.glob<Record<string, unknown>>(
  [
    "../apps/**/testbot-*.ts",
    "../docs-viewer/testbot-*.ts",
    "../pages/**/testbot-*.ts",
  ],
  { eager: false },
);

/**
 * Extract TestScript[] from a loaded module.
 * Finds the first exported array containing objects with a `run` method.
 */
function extractScripts(mod: Record<string, unknown>): TestScript[] {
  for (const [key, value] of Object.entries(mod)) {
    if (key === "zones" || key === "group") continue;
    const first = Array.isArray(value) && value.length > 0 ? value[0] : null;
    if (
      first != null &&
      typeof (first as { run?: unknown }).run === "function"
    ) {
      return value as TestScript[];
    }
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════
// Static entries — os-devtool internal scripts (not file-discoverable)
// ═══════════════════════════════════════════════════════════════════

const STATIC_ENTRIES: ManifestEntry[] = [
  {
    zones: ["apg-sidebar"],
    group: "APG Showcase",
    load: () => import("@os-testing/scripts").then((m) => m.apgShowcaseScripts),
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

// ═══════════════════════════════════════════════════════════════════
// Build manifest: static + auto-discovered
// ═══════════════════════════════════════════════════════════════════

function buildAutoEntries(): ManifestEntry[] {
  const entries: ManifestEntry[] = [];

  for (const [path, meta] of Object.entries(metadata)) {
    const zones = meta.zones;
    const group = meta.group;

    if (!zones || !Array.isArray(zones) || zones.length === 0) {
      console.warn(
        `[testbot-manifest] Skipping ${path}: missing 'zones' export`,
      );
      continue;
    }

    const loader = loaders[path];
    if (!loader) continue;

    entries.push({
      zones,
      group: group ?? path.split("/").slice(-2, -1)[0] ?? "Unknown",
      route: meta.route,
      load: () =>
        loader().then((mod) => extractScripts(mod as Record<string, unknown>)),
    });
  }

  return entries;
}

export const TESTBOT_MANIFEST: ManifestEntry[] = [
  ...STATIC_ENTRIES,
  ...buildAutoEntries(),
];
