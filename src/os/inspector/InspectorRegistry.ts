import { ReactNode } from "react";

type PanelId = string;
type Listener = () => void;

interface PanelEntry {
    id: PanelId;
    label: string; // e.g. "OS Kernel", "Finder App"
    component: ReactNode;
    order?: number;
}

class InspectorRegistryImpl {
    private panels = new Map<PanelId, PanelEntry>();
    private listeners = new Set<Listener>();
    private cache: PanelEntry[] = [];

    /**
     * Register a new inspector panel.
     * If ID exists, it updates the existing entry.
     */
    register(id: PanelId, label: string, component: ReactNode, order = 100) {
        this.panels.set(id, { id, label, component, order });
        this.updateCache();
        this.notify();
        return () => this.unregister(id);
    }

    unregister(id: PanelId) {
        if (this.panels.delete(id)) {
            this.updateCache();
            this.notify();
        }
    }

    private updateCache() {
        this.cache = Array.from(this.panels.values()).sort(
            (a, b) => (a.order ?? 100) - (b.order ?? 100),
        );
    }

    getPanels() {
        return this.cache;
    }

    getPanel(id: PanelId) {
        return this.panels.get(id);
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        for (const listener of this.listeners) {
            listener();
        }
    }
}

export const InspectorRegistry = new InspectorRegistryImpl();
