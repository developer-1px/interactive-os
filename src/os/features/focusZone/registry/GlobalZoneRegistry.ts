import { create } from 'zustand';
import type { FocusZoneStore } from '../store/focusZoneStore';
import type { FocusZoneConfig } from '../types';

interface ZoneEntry {
    store: FocusZoneStore;
    parentId: string | null;
    config?: FocusZoneConfig;
    onActivate?: (itemId: string) => void;
}

interface GlobalRegistryState {
    zones: Map<string, ZoneEntry>;
    activeZoneId: string | null;
}

interface GlobalRegistryActions {
    register: (id: string, store: FocusZoneStore, parentId?: string | null, config?: FocusZoneConfig, onActivate?: (itemId: string) => void) => void;
    unregister: (id: string) => void;
    setActiveZone: (id: string) => void;
    getZone: (id: string) => FocusZoneStore | undefined;
    getZoneEntry: (id: string) => ZoneEntry | undefined;
    getActiveZone: () => FocusZoneStore | undefined;
    getFocusPath: () => string[];
    getSiblingZone: (direction: 'forward' | 'backward') => string | null;
}

// Global singleton store for Zone Registry
export const useGlobalZoneRegistry = create<GlobalRegistryState & GlobalRegistryActions>((set, get) => ({
    zones: new Map(),
    activeZoneId: null,

    register: (id, store, parentId = null, config, onActivate) => {
        set((state) => {
            const newZones = new Map(state.zones);
            newZones.set(id, { store, parentId, config, onActivate });
            return { zones: newZones };
        });
    },

    unregister: (id) => {
        set((state) => {
            const newZones = new Map(state.zones);
            newZones.delete(id);
            const newActiveId = state.activeZoneId === id ? null : state.activeZoneId;
            return { zones: newZones, activeZoneId: newActiveId };
        });
    },

    setActiveZone: (id) => {
        const zone = get().zones.get(id);
        if (zone) {
            set({ activeZoneId: id });
        }
    },

    getZone: (id) => {
        return get().zones.get(id)?.store;
    },

    getZoneEntry: (id) => {
        return get().zones.get(id);
    },

    getActiveZone: () => {
        const { activeZoneId, zones } = get();
        if (!activeZoneId) return undefined;
        return zones.get(activeZoneId)?.store;
    },

    getFocusPath: () => {
        const { activeZoneId, zones } = get();
        if (!activeZoneId) return [];

        const path: string[] = [];
        let currentId: string | null = activeZoneId;

        while (currentId) {
            path.unshift(currentId);
            const entry = zones.get(currentId);
            currentId = entry?.parentId || null;
            if (path.length > 100) break;
        }
        return path;
    },

    getSiblingZone: (direction) => {
        const { activeZoneId, zones } = get();
        if (!activeZoneId) return null;

        const currentEntry = zones.get(activeZoneId);
        if (!currentEntry) return null;

        // Find sibling zones (same parent)
        const siblings: string[] = [];
        for (const [id, entry] of zones.entries()) {
            if (entry.parentId === currentEntry.parentId) {
                siblings.push(id);
            }
        }

        if (siblings.length < 2) return null;

        // Sort by DOM order using dynamic import to avoid circular deps
        const sortByDOMOrder = (ids: string[]): string[] => {
            const elements = ids
                .map(id => {
                    // Try DOMInterface first, fallback to getElementById
                    const el = document.querySelector(`[data-focus-zone="${id}"]`) as HTMLElement | null;
                    return el ? { id, el } : null;
                })
                .filter((x): x is { id: string; el: HTMLElement } => x !== null)
                .sort((a, b) => {
                    const pos = a.el.compareDocumentPosition(b.el);
                    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                    return 0;
                });
            return elements.map(x => x.id);
        };

        const sortedSiblings = sortByDOMOrder(siblings);
        const currentIndex = sortedSiblings.indexOf(activeZoneId);
        if (currentIndex === -1) return null;

        const delta = direction === 'forward' ? 1 : -1;
        let nextIndex = currentIndex + delta;

        // Wrap around
        if (nextIndex < 0) nextIndex = sortedSiblings.length - 1;
        if (nextIndex >= sortedSiblings.length) nextIndex = 0;

        return sortedSiblings[nextIndex] ?? null;
    }
}));

// Non-hook access for Event Handlers / Commands
export const GlobalZoneRegistry = {
    get: () => useGlobalZoneRegistry.getState(),
    register: (id: string, store: FocusZoneStore, parentId?: string | null, config?: FocusZoneConfig, onActivate?: (itemId: string) => void) =>
        useGlobalZoneRegistry.getState().register(id, store, parentId, config, onActivate),
    unregister: (id: string) => useGlobalZoneRegistry.getState().unregister(id),
    setActiveZone: (id: string) => useGlobalZoneRegistry.getState().setActiveZone(id),
    getZone: (id: string) => useGlobalZoneRegistry.getState().getZone(id),
    getZoneEntry: (id: string) => useGlobalZoneRegistry.getState().getZoneEntry(id),
    getActiveZone: () => useGlobalZoneRegistry.getState().getActiveZone(),
    getActiveZoneEntry: () => {
        const state = useGlobalZoneRegistry.getState();
        if (!state.activeZoneId) return undefined;
        return state.zones.get(state.activeZoneId);
    },
    getFocusPath: () => useGlobalZoneRegistry.getState().getFocusPath(),
    getSiblingZone: (direction: 'forward' | 'backward') => useGlobalZoneRegistry.getState().getSiblingZone(direction),
};
