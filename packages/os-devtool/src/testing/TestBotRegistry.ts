/**
 * TestBotRegistry — Eager-load + route/zone-filtered TestBot scripts
 *
 * Two modes (can coexist, priority: manual > manifest):
 *   1. Manual:  register(scripts) — page-specific overrides
 *   2. Auto:    initZoneReactive(manifest, getCurrentRoute?) — eagerly loads
 *              ALL manifest entries, then filters display by route/zone match
 *
 * Key design: entries are loaded eagerly (so script names are available
 * immediately), but only route/zone-matched scripts appear in getScripts().
 *
 * TestBotPanel reads getScripts() via useSyncExternalStore — both modes
 * feed into the same snapshot, so the panel works transparently.
 */

import type { TestScript } from "@os-testing/scripts";

// ─── State ───────────────────────────────────────────────────────

let manualScripts: TestScript[] = [];
let matchedScripts: TestScript[] = [];
let snapshot: TestScript[] = [];
const listeners = new Set<() => void>();

function rebuildSnapshot() {
  // Manual scripts take priority (backward compat: if a page explicitly
  // registers, those override zone-reactive scripts)
  snapshot =
    manualScripts.length > 0 ? [...manualScripts] : [...matchedScripts];
}

function notify() {
  rebuildSnapshot();
  for (const fn of listeners) fn();
}

// ─── Manifest loading internals ──────────────────────────────────

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
 * Eagerly load ALL manifest entries into cache.
 * Once all loads complete, triggers filterAndNotify to show matched scripts.
 */
function eagerLoadAll() {
  let pendingLoads = 0;

  for (const entry of activeManifest) {
    if (!loadedCache.has(entry)) {
      pendingLoads++;
      entry
        .load()
        .then((scripts) => {
          loadedCache.set(entry, scripts);
          pendingLoads--;
          if (pendingLoads === 0) filterAndNotify();
        })
        .catch((err) => {
          console.warn("[TestBotRegistry] Failed to load manifest entry:", err);
          pendingLoads--;
          if (pendingLoads === 0) filterAndNotify();
        });
    }
  }

  // All already cached — filter immediately
  if (pendingLoads === 0) filterAndNotify();
}

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

/**
 * Filter cached entries by route/zone match and update displayed scripts.
 * Called after eager load completes AND on every zone change.
 */
function filterAndNotify() {
  // Import ZoneRegistry lazily to avoid circular deps at module init
  import("@os-core/engine/registries/zoneRegistry").then(
    ({ ZoneRegistry }) => {
      const mounted = new Set(ZoneRegistry.getSnapshot());
      const nextScripts: TestScript[] = [];

      for (const entry of activeManifest) {
        if (!isEntryMatched(entry, mounted)) continue;
        const cached = loadedCache.get(entry);
        if (cached) {
          nextScripts.push(
            ...cached.map((s) => ({ ...s, group: entry.group })),
          );
        }
      }

      matchedScripts = nextScripts;
      notify();
    },
  );
}

// ─── API ─────────────────────────────────────────────────────────

export const TestBotRegistry = {
  /**
   * Manual registration — page-specific TestBot scripts.
   * Returns an `unregister` function — call it on component unmount.
   * Takes priority over manifest-loaded scripts when active.
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
   * Eagerly loads ALL manifest entries (so script names are available),
   * then filters display by route/zone match.
   * Subscribes to ZoneRegistry for live updates on zone mount/unmount.
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

    // Eagerly load ALL entries into cache, then filter+display matched
    eagerLoadAll();

    // Subscribe to zone changes for live filtering updates
    import("@os-core/engine/registries/zoneRegistry").then(
      ({ ZoneRegistry }) => {
        zoneUnsubscribe = ZoneRegistry.subscribe(() => {
          filterAndNotify();
        });
      },
    );

    return () => {
      zoneUnsubscribe?.();
      zoneUnsubscribe = null;
      activeManifest = [];
      routeGetter = null;
      matchedScripts = [];
      notify();
    };
  },

  /** Snapshot-safe — same reference until scripts change */
  getScripts(): TestScript[] {
    return snapshot;
  },

  /** Returns true if any scripts (manual or manifest) are registered */
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
