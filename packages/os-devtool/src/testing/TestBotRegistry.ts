/**
 * TestBotRegistry — Zone & Route-reactive TestBot script registration
 *
 * Three modes (can coexist, priority: manual > route > zone):
 *   1. Manual:  register(scripts) — legacy, still works for custom scripts
 *   2. Auto:    initZoneReactive(manifest, getCurrentRoute?) — subscribes to
 *              ZoneRegistry + route changes, lazy-loads matching scripts
 *
 * Filtering logic:
 *   - If entry has `route` and `getCurrentRoute` is provided:
 *     match by `currentRoute.startsWith(entry.route)` (route-first)
 *   - Otherwise: match by zone overlap (zone-fallback)
 *
 * TestBotPanel reads getScripts() via useSyncExternalStore — all modes
 * feed into the same snapshot, so the panel works transparently.
 */

import type { TestScript } from "@os-testing/scripts";

// ─── State ───────────────────────────────────────────────────────

let manualScripts: TestScript[] = [];
let zoneScripts: TestScript[] = [];
let snapshot: TestScript[] = [];
const listeners = new Set<() => void>();

function rebuildSnapshot() {
  // Manual scripts take priority (backward compat: if a page explicitly
  // registers, those override zone-reactive scripts)
  snapshot = manualScripts.length > 0 ? [...manualScripts] : [...zoneScripts];
}

function notify() {
  rebuildSnapshot();
  for (const fn of listeners) fn();
}

// ─── Zone-reactive internals ─────────────────────────────────────

interface ManifestEntry {
  zones: string[];
  group: string;
  route?: string | undefined;
  load: () => Promise<TestScript[]>;
}

/** Cache: once loaded, entries don't reload */
const loadedCache = new Map<ManifestEntry, TestScript[]>();
let activeManifest: ManifestEntry[] = [];
let routeGetter: (() => string) | null = null;
let zoneUnsubscribe: (() => void) | null = null;

/**
 * Check if a manifest entry matches the current context.
 * Route matching takes priority when both route and getCurrentRoute exist.
 * Falls back to zone matching otherwise.
 */
function isEntryMatched(
  entry: ManifestEntry,
  mountedZones: Set<string>,
): boolean {
  // Route-first: if entry declares a route and we have a route getter
  if (entry.route != null && routeGetter != null) {
    const currentRoute = routeGetter();
    return currentRoute.startsWith(entry.route);
  }
  // Zone-fallback: match if any of entry's zones are mounted
  return entry.zones.some((z) => mountedZones.has(z));
}

function onZoneChange(mountedZoneIds: readonly string[]) {
  const mounted = new Set(mountedZoneIds);
  const nextScripts: TestScript[] = [];
  let pendingLoads = 0;

  for (const entry of activeManifest) {
    if (!isEntryMatched(entry, mounted)) continue;

    const cached = loadedCache.get(entry);
    if (cached) {
      nextScripts.push(...cached.map((s) => ({ ...s, group: entry.group })));
    } else {
      pendingLoads++;
      entry
        .load()
        .then((scripts) => {
          loadedCache.set(entry, scripts);
          // Re-trigger after lazy load completes
          // Import ZoneRegistry lazily to avoid circular deps at module init
          import("@os-core/engine/registries/zoneRegistry").then(
            ({ ZoneRegistry }) => {
              onZoneChange(ZoneRegistry.getSnapshot());
            },
          );
        })
        .catch((err) => {
          console.warn("[TestBotRegistry] Failed to load manifest entry:", err);
        });
    }
  }

  // Only update if we've resolved all entries (no pending loads)
  if (pendingLoads === 0) {
    zoneScripts = nextScripts;
    notify();
  }
}

// ─── API ─────────────────────────────────────────────────────────

export const TestBotRegistry = {
  /**
   * Manual registration — page-specific TestBot scripts.
   * Returns an `unregister` function — call it on component unmount.
   * Takes priority over zone-reactive scripts when active.
   */
  register(pageScripts: TestScript[]): () => void {
    manualScripts = pageScripts;
    notify();
    return () => {
      manualScripts = [];
      notify();
    };
  },

  /**
   * Initialize zone & route-reactive mode.
   * Subscribes to ZoneRegistry and auto-activates scripts from the manifest.
   * Optionally accepts a route getter for route-based primary filtering.
   * Call once at app init (e.g., Inspector mount).
   * Returns an unsubscribe function.
   */
  initZoneReactive(
    manifest: ManifestEntry[],
    getCurrentRoute?: () => string,
  ): () => void {
    // Cleanup previous subscription if any
    zoneUnsubscribe?.();
    activeManifest = manifest;
    routeGetter = getCurrentRoute ?? null;

    // Import ZoneRegistry lazily to avoid circular deps at module init
    import("@os-core/engine/registries/zoneRegistry").then(
      ({ ZoneRegistry }) => {
        // Process current state immediately
        onZoneChange(ZoneRegistry.getSnapshot());

        // Subscribe to future changes
        zoneUnsubscribe = ZoneRegistry.subscribe(() => {
          onZoneChange(ZoneRegistry.getSnapshot());
        });
      },
    );

    return () => {
      zoneUnsubscribe?.();
      zoneUnsubscribe = null;
      activeManifest = [];
      routeGetter = null;
      zoneScripts = [];
      notify();
    };
  },

  /** Snapshot-safe — same reference until scripts change */
  getScripts(): TestScript[] {
    return snapshot;
  },

  /** Returns true if any scripts (manual or zone-reactive) are registered */
  hasScripts(): boolean {
    return snapshot.length > 0;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
