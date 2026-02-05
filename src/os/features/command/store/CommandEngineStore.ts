/**
 * CommandEngineStore - Global Zustand Store for Command Engine
 * 
 * Simple lookup-based architecture:
 * - OS.Root registers osRegistry
 * - Each App registers its own registry to appRegistries Map
 * - InputEngine looks up: activeApp registry → osRegistry fallback
 */

import { create } from 'zustand';
import type { BaseCommand } from "@os/entities/BaseCommand";
import type { CommandRegistry } from "@os/features/command/model/createCommandStore";

// ═══════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════

interface AppEntry<S = any> {
    registry: CommandRegistry<S, any>;
    dispatch: (cmd: BaseCommand) => void;
    state: S;
    contextMap?: (state: S, focus: any) => any;
}

export interface CommandEngineState<S = any> {
    // OS-level registry (always available)
    osRegistry: CommandRegistry<S, any> | null;

    // Per-app registries (keyed by appId)
    appRegistries: Map<string, AppEntry<S>>;

    // Currently active app
    activeAppId: string | null;

    // Initialization flag
    isInitialized: boolean;

    // Actions
    initializeOS: (registry: CommandRegistry<S, any>) => void;
    registerApp: (params: AppEntry<S> & { appId: string }) => void;
    unregisterApp: (appId: string) => void;
    setActiveApp: (appId: string) => void;
    updateAppState: (appId: string, state: S) => void;

    // Getters for InputEngine
    getActiveRegistry: () => CommandRegistry<S, any> | null;
    getOSRegistry: () => CommandRegistry<S, any> | null;
    getActiveDispatch: () => ((cmd: BaseCommand) => void) | null;
    getActiveState: () => S | null;
    getActiveContextMap: () => ((state: S, focus: any) => any) | null;
}

// ═══════════════════════════════════════════════════════════════════
// Store Instance
// ═══════════════════════════════════════════════════════════════════

export const useCommandEngineStore = create<CommandEngineState>((set, get) => ({
    osRegistry: null,
    appRegistries: new Map(),
    activeAppId: null,
    isInitialized: false,

    initializeOS: (registry) => {
        console.log('[CommandEngineStore] OS initialized');
        set({ osRegistry: registry, isInitialized: true });
    },

    registerApp: ({ appId, registry, dispatch, state, contextMap }) => {
        console.log('[CommandEngineStore] App registered:', appId);
        const newMap = new Map(get().appRegistries);
        newMap.set(appId, { registry, dispatch, state, contextMap });
        set({ appRegistries: newMap, activeAppId: appId });
    },

    unregisterApp: (appId) => {
        const newMap = new Map(get().appRegistries);
        newMap.delete(appId);
        const newActiveId = get().activeAppId === appId ? null : get().activeAppId;
        set({ appRegistries: newMap, activeAppId: newActiveId });
    },

    setActiveApp: (appId) => {
        set({ activeAppId: appId });
    },

    updateAppState: (appId, state) => {
        const entry = get().appRegistries.get(appId);
        if (entry) {
            const newMap = new Map(get().appRegistries);
            newMap.set(appId, { ...entry, state });
            set({ appRegistries: newMap });
        }
    },

    getActiveRegistry: () => {
        const { activeAppId, appRegistries } = get();
        return activeAppId ? appRegistries.get(activeAppId)?.registry || null : null;
    },

    getOSRegistry: () => get().osRegistry,

    getActiveDispatch: () => {
        const { activeAppId, appRegistries } = get();
        return activeAppId ? appRegistries.get(activeAppId)?.dispatch || null : null;
    },

    getActiveState: () => {
        const { activeAppId, appRegistries } = get();
        return activeAppId ? appRegistries.get(activeAppId)?.state || null : null;
    },

    getActiveContextMap: () => {
        const { activeAppId, appRegistries } = get();
        return activeAppId ? appRegistries.get(activeAppId)?.contextMap || null : null;
    },
}));

// ═══════════════════════════════════════════════════════════════════
// Convenience Hooks
// ═══════════════════════════════════════════════════════════════════

export function useDispatch() {
    const activeAppId = useCommandEngineStore(s => s.activeAppId);
    const appRegistries = useCommandEngineStore(s => s.appRegistries);
    const dispatch = activeAppId ? appRegistries.get(activeAppId)?.dispatch : null;
    return dispatch ?? (() => { });
}

export function useAppState<S>() {
    const activeAppId = useCommandEngineStore(s => s.activeAppId);
    const appRegistries = useCommandEngineStore(s => s.appRegistries);
    return (activeAppId ? appRegistries.get(activeAppId)?.state : null) as S;
}

export function useRegistry<S = any>() {
    const activeAppId = useCommandEngineStore(s => s.activeAppId);
    const appRegistries = useCommandEngineStore(s => s.appRegistries);
    return (activeAppId ? appRegistries.get(activeAppId)?.registry : null) as CommandRegistry<S, any>;
}

export function useContextMap() {
    const activeAppId = useCommandEngineStore(s => s.activeAppId);
    const appRegistries = useCommandEngineStore(s => s.appRegistries);
    return activeAppId ? appRegistries.get(activeAppId)?.contextMap : null;
}

// ═══════════════════════════════════════════════════════════════════
// Static Accessors
// ═══════════════════════════════════════════════════════════════════

export const CommandEngineStore = {
    get: () => useCommandEngineStore.getState(),
    dispatch: (cmd: BaseCommand) => {
        const dispatch = useCommandEngineStore.getState().getActiveDispatch();
        if (dispatch) dispatch(cmd);
    },
};
