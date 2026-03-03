/**
 * TestBotRegistry — Zone-reactive TestBot script registration
 *
 * Two modes (both can coexist):
 *   1. Manual:  register(scripts) — legacy, still works for custom scripts
 *   2. Auto:    initZoneReactive(manifest) — subscribes to ZoneRegistry,
 *              lazy-loads scripts when matching zones mount, deactivates on unmount
 *
 * TestBotPanel reads getScripts() via useSyncExternalStore — both modes
 * feed into the same snapshot, so the panel works transparently.
 */

import type { TestScript } from "./scripts";

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
  load: () => Promise<TestScript[]>;
}

/** Cache: once loaded, entries don't reload */
const loadedCache = new Map<ManifestEntry, TestScript[]>();
let activeManifest: ManifestEntry[] = [];
let zoneUnsubscribe: (() => void) | null = null;

function onZoneChange(mountedZoneIds: readonly string[]) {
  const mounted = new Set(mountedZoneIds);
  const nextScripts: TestScript[] = [];
  let pendingLoads = 0;

  for (const entry of activeManifest) {
    const matched = entry.zones.some((z) => mounted.has(z));
    if (!matched) continue;

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
   * Initialize zone-reactive mode.
   * Subscribes to ZoneRegistry and auto-activates scripts from the manifest.
   * Call once at app init (e.g., Inspector mount).
   * Returns an unsubscribe function.
   */
  initZoneReactive(manifest: ManifestEntry[]): () => void {
    // Cleanup previous subscription if any
    zoneUnsubscribe?.();
    activeManifest = manifest;

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
