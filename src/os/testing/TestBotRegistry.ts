/**
 * TestBotRegistry — Page-scoped TestBot script registration
 *
 * A playground page registers its TestScript[] on mount,
 * and unregisters on unmount. TestBotPanel reads this to
 * decide whether to run page-specific scripts or the default
 * ARIA suite against its own embedded widgets.
 *
 * Pattern: identical to InspectorRegistry (useSyncExternalStore compatible).
 */

import type { TestScript } from "./scripts";

// ─── State ───────────────────────────────────────────────────────

let scripts: TestScript[] = [];
let snapshot: TestScript[] = [];
const listeners = new Set<() => void>();

function rebuildSnapshot() {
    snapshot = [...scripts];
}

function notify() {
    rebuildSnapshot();
    for (const fn of listeners) fn();
}

// ─── API ─────────────────────────────────────────────────────────

export const TestBotRegistry = {
    /**
     * Register page-specific TestBot scripts.
     * Returns an `unregister` function — call it on component unmount.
     */
    register(pageScripts: TestScript[]): () => void {
        scripts = pageScripts;
        notify();
        return () => {
            scripts = [];
            notify();
        };
    },

    /** Snapshot-safe — same reference until scripts change */
    getScripts(): TestScript[] {
        return snapshot;
    },

    /** Returns true if page scripts are currently registered */
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
