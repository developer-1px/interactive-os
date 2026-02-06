import { create } from 'zustand';
import type { FocusGroupStore } from '../store/focusGroupStore';
import type { FocusGroupConfig } from '../types';
import type { BaseCommand } from '@os/entities/BaseCommand';

interface GroupEntry {
    store: FocusGroupStore;
    parentId: string | null;
    config?: FocusGroupConfig;
    /** Command dispatched on item activation (Enter key) */
    bindActivateCommand?: BaseCommand;
    /** Command dispatched on item selection (Space key) */
    bindSelectCommand?: BaseCommand;
}

interface GlobalRegistryState {
    groups: Map<string, GroupEntry>;
    activeGroupId: string | null;
}

interface GlobalRegistryActions {
    register: (
        id: string,
        store: FocusGroupStore,
        parentId?: string | null,
        config?: FocusGroupConfig,
        bindings?: {
            bindActivateCommand?: BaseCommand;
            bindSelectCommand?: BaseCommand;
        }
    ) => void;
    unregister: (id: string) => void;
    setActiveGroup: (id: string) => void;
    getGroup: (id: string) => FocusGroupStore | undefined;
    getGroupEntry: (id: string) => GroupEntry | undefined;
    getActiveGroup: () => FocusGroupStore | undefined;
    getFocusPath: () => string[];
    getSiblingGroup: (direction: 'forward' | 'backward') => string | null;
    getOrderedGroups: () => string[];
}

// Global singleton store for Group Registry
export const useFocusRegistry = create<GlobalRegistryState & GlobalRegistryActions>((set, get) => ({
    groups: new Map(),
    activeGroupId: null,

    register: (id, store, parentId = null, config, bindings) => {
        set((state) => {
            const newGroups = new Map(state.groups);
            newGroups.set(id, {
                store,
                parentId,
                config,
                bindActivateCommand: bindings?.bindActivateCommand,
                bindSelectCommand: bindings?.bindSelectCommand,
            });
            return { groups: newGroups };
        });
    },

    unregister: (id) => {
        const wasActive = get().activeGroupId === id;
        set((state) => {
            const newGroups = new Map(state.groups);
            newGroups.delete(id);
            // DON'T reset activeGroupId here - defer to allow for Strict Mode remount
            return { groups: newGroups };
        });

        // If this was the active group, defer the check to allow React Strict Mode remount
        if (wasActive) {
            queueMicrotask(() => {
                const currentState = get();
                // Only reset if group is still not registered after microtask
                if (!currentState.groups.has(id) && currentState.activeGroupId === id) {
                    set({ activeGroupId: null });
                }
            });
        }
    },

    setActiveGroup: (id) => {
        const group = get().groups.get(id);
        if (group) {
            set({ activeGroupId: id });
        }
    },

    getGroup: (id) => {
        return get().groups.get(id)?.store;
    },

    getGroupEntry: (id) => {
        return get().groups.get(id);
    },

    getActiveGroup: () => {
        const { activeGroupId, groups } = get();
        if (!activeGroupId) return undefined;
        return groups.get(activeGroupId)?.store;
    },

    getFocusPath: () => {
        const { activeGroupId, groups } = get();
        if (!activeGroupId) return [];

        const path: string[] = [];
        let currentId: string | null = activeGroupId;

        while (currentId) {
            path.unshift(currentId);
            const entry = groups.get(currentId);
            currentId = entry?.parentId || null;
            if (path.length > 100) break;
        }
        return path;
    },

    getSiblingGroup: (direction) => {
        const { activeGroupId, groups } = get();
        if (!activeGroupId) return null;

        const currentEntry = groups.get(activeGroupId);
        if (!currentEntry) return null;

        // Find sibling groups (same parent)
        const siblings: string[] = [];
        for (const [id, entry] of groups.entries()) {
            if (entry.parentId === currentEntry.parentId) {
                siblings.push(id);
            }
        }

        if (siblings.length === 0) return null;

        // Sort by DOM order using dynamic import to avoid circular deps
        const sortByDOMOrder = (ids: string[]): string[] => {
            const elements = ids
                .map(id => {
                    // Try DOMRegistry first, fallback to getElementById
                    const el = document.querySelector(`[data-focus-group="${id}"]`) as HTMLElement | null;
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
        const currentIndex = sortedSiblings.indexOf(activeGroupId);
        if (currentIndex === -1) return null;

        const delta = direction === 'forward' ? 1 : -1;
        let nextIndex = currentIndex + delta;

        // Wrap around
        if (nextIndex < 0) nextIndex = sortedSiblings.length - 1;
        if (nextIndex >= sortedSiblings.length) nextIndex = 0;

        return sortedSiblings[nextIndex] ?? null;
    },

    getOrderedGroups: () => {
        const { groups } = get();
        const ids = Array.from(groups.keys());

        // Dynamic import to avoid circular deps
        // DOM sort logic duplicated from getSiblingGroup for now - could be extracted
        const elements = ids
            .map(id => {
                const el = document.querySelector(`[data-focus-group="${id}"]`) as HTMLElement | null;
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
    }
}));

// Non-hook access for Event Handlers / Commands
export const FocusRegistry = {
    get: () => useFocusRegistry.getState(),
    register: (
        id: string,
        store: FocusGroupStore,
        parentId?: string | null,
        config?: FocusGroupConfig,
        bindings?: {
            bindActivateCommand?: BaseCommand;
            bindSelectCommand?: BaseCommand;
        }
    ) => useFocusRegistry.getState().register(id, store, parentId, config, bindings),
    unregister: (id: string) => useFocusRegistry.getState().unregister(id),
    setActiveGroup: (id: string) => useFocusRegistry.getState().setActiveGroup(id),
    getGroup: (id: string) => useFocusRegistry.getState().getGroup(id),
    getGroupEntry: (id: string) => useFocusRegistry.getState().getGroupEntry(id),
    getActiveGroup: () => useFocusRegistry.getState().getActiveGroup(),
    getActiveGroupEntry: () => {
        const state = useFocusRegistry.getState();
        if (!state.activeGroupId) return undefined;
        return state.groups.get(state.activeGroupId);
    },
    getFocusPath: () => useFocusRegistry.getState().getFocusPath(),
    getSiblingGroup: (direction: 'forward' | 'backward') => useFocusRegistry.getState().getSiblingGroup(direction),

    getOrderedGroups: () => useFocusRegistry.getState().getOrderedGroups(),
};

