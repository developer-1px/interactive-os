/**
 * TestBotRegistry — Eager manifest loading + manual script registration
 *
 * Two modes (can coexist, priority: manual > manifest):
 *   1. Manual:  register(scripts) — page-specific overrides
 *   2. Auto:    initZoneReactive(manifest) — eagerly loads ALL manifest
 *              entries to display the complete test list immediately
 *
 * TestBotPanel reads getScripts() via useSyncExternalStore — both modes
 * feed into the same snapshot, so the panel works transparently.
 */

import type { TestScript } from "@os-testing/scripts";

// ─── State ───────────────────────────────────────────────────────

let manualScripts: TestScript[] = [];
let manifestScripts: TestScript[] = [];
let snapshot: TestScript[] = [];
const listeners = new Set<() => void>();

function rebuildSnapshot() {
  // Manual scripts take priority (backward compat: if a page explicitly
  // registers, those override manifest-loaded scripts)
  snapshot =
    manualScripts.length > 0 ? [...manualScripts] : [...manifestScripts];
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

/**
 * Eagerly load ALL manifest entries to populate the complete test list.
 * Cached entries resolve synchronously; uncached entries trigger async load
 * and re-invoke loadAllEntries on completion.
 */
function loadAllEntries() {
  const nextScripts: TestScript[] = [];
  let pendingLoads = 0;

  for (const entry of activeManifest) {
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
          loadAllEntries();
        })
        .catch((err) => {
          console.warn("[TestBotRegistry] Failed to load manifest entry:", err);
        });
    }
  }

  // Only update if we've resolved all entries (no pending loads)
  if (pendingLoads === 0) {
    manifestScripts = nextScripts;
    notify();
  }
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
   * Initialize manifest-based mode.
   * Eagerly loads ALL manifest entries to display the complete test list
   * immediately on panel mount (no zone matching required for display).
   * Call once at app init (e.g., Inspector mount).
   * Returns a cleanup function.
   */
  initZoneReactive(manifest: ManifestEntry[]): () => void {
    activeManifest = manifest;

    // Eagerly load ALL entries for immediate display
    loadAllEntries();

    return () => {
      activeManifest = [];
      manifestScripts = [];
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
