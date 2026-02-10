/**
 * InspectorRegistry — Register / unregister inspector panels
 *
 * Uses a cached snapshot array for useSyncExternalStore compatibility.
 * The snapshot only changes its reference when panels actually change.
 */

import type { ReactNode } from "react";

export interface PanelEntry {
    id: string;
    label: string;
    content: ReactNode;
}

const panels = new Map<string, PanelEntry>();
const listeners = new Set<() => void>();

/** Cached snapshot — stable reference between mutations */
let snapshot: PanelEntry[] = [];

function rebuildSnapshot() {
    snapshot = Array.from(panels.values());
}

function notify() {
    rebuildSnapshot();
    for (const fn of listeners) fn();
}

export const InspectorRegistry = {
    register(id: string, label: string, content: ReactNode): () => void {
        panels.set(id, { id, label, content });
        notify();
        return () => {
            panels.delete(id);
            notify();
        };
    },

    getAll(): PanelEntry[] {
        return snapshot;
    },

    /** Snapshot-safe — returns SAME reference until panels change */
    getPanels(): PanelEntry[] {
        return snapshot;
    },

    get(id: string): PanelEntry | undefined {
        return panels.get(id);
    },

    /** Alias used by CommandInspector */
    getPanel(id: string): PanelEntry | undefined {
        return panels.get(id);
    },

    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};
