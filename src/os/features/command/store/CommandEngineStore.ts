/**
 * CommandEngineStore - 앱 라우터
 *
 * 책임:
 * 1. 앱 등록/조회 — 어떤 앱이 있고, 지금 어떤 앱이 활성인지 관리
 * 2. 커맨드 라우팅 — 들어온 커맨드를 활성 앱의 dispatch로 전달
 */

import type { BaseCommand } from "@/os-new/schema/command/BaseCommand";
import type { CommandRegistry } from "@os/features/command/model/createCommandStore";

import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface AppEntry<S = any> {
  registry: CommandRegistry<S, any>;
  dispatch: (cmd: BaseCommand) => void;
  state: S;
  getState: () => S;
  setState: (state: S) => void;
  contextMap?: (state: S, focus: any) => any;
}

export interface CommandEngineState<S = any> {
  osRegistry: CommandRegistry<S, any> | null;
  appRegistries: Map<string, AppEntry<S>>;
  activeAppId: string | null;
  isInitialized: boolean;

  // Actions
  initializeOS: (registry: CommandRegistry<S, any>) => void;
  registerApp: (params: AppEntry<S> & { appId: string }) => void;
  unregisterApp: (appId: string) => void;
  updateAppState: (appId: string, state: S) => void;

  // Getters
  getActiveDispatch: () => ((cmd: BaseCommand) => void) | null;
  getActiveState: () => S | null;
  getActiveContextMap: () => ((state: S, focus: any) => any) | null;
  getAllKeybindings: () => any[];
}

// ═══════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════

export const useCommandEngineStore = create<CommandEngineState>((set, get) => ({
  osRegistry: null,
  appRegistries: new Map(),
  activeAppId: null,
  isInitialized: false,

  initializeOS: (registry) => {
    set({ osRegistry: registry, isInitialized: true });
  },

  registerApp: ({
    appId,
    registry,
    dispatch,
    state,
    getState,
    setState,
    contextMap,
  }) => {
    const newMap = new Map(get().appRegistries);
    newMap.set(appId, {
      registry,
      dispatch,
      state,
      getState,
      setState,
      contextMap,
    });
    set({ appRegistries: newMap, activeAppId: appId });
  },

  unregisterApp: (appId) => {
    const newMap = new Map(get().appRegistries);
    newMap.delete(appId);
    const newActiveId = get().activeAppId === appId ? null : get().activeAppId;
    set({ appRegistries: newMap, activeAppId: newActiveId });
  },

  updateAppState: (appId, state) => {
    const entry = get().appRegistries.get(appId);
    if (entry) {
      // App state changes are captured by Transaction snapshot diff

      const newMap = new Map(get().appRegistries);
      newMap.set(appId, { ...entry, state });
      set({ appRegistries: newMap });
    }
  },

  getActiveDispatch: () => {
    const { activeAppId, appRegistries } = get();
    return activeAppId
      ? appRegistries.get(activeAppId)?.dispatch || null
      : null;
  },

  getActiveState: () => {
    const { activeAppId, appRegistries } = get();
    return activeAppId ? appRegistries.get(activeAppId)?.state || null : null;
  },

  getActiveContextMap: () => {
    const { activeAppId, appRegistries } = get();
    return activeAppId
      ? appRegistries.get(activeAppId)?.contextMap || null
      : null;
  },

  getAllKeybindings: () => {
    const { activeAppId, appRegistries, osRegistry } = get();
    const appRegistry = activeAppId
      ? appRegistries.get(activeAppId)?.registry
      : null;

    return [
      ...(appRegistry?.getKeybindings() || []),
      ...(osRegistry?.getKeybindings() || []),
    ];
  },
}));

// ═══════════════════════════════════════════════════════════════════
// Static API — 비-React 컨텍스트에서 커맨드 실행
// ═══════════════════════════════════════════════════════════════════

export const CommandEngineStore = {
  /** 커맨드 실행 — 활성 앱의 dispatch로 라우팅 (유일한 진입점) */
  dispatch: (cmd: BaseCommand) => {
    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    if (dispatch) {
      dispatch(cmd);
    } else {
      console.warn(
        `[CommandEngine] Command dropped (no active app): ${cmd.type}`,
      );
    }
  },

  /** 앱 상태 스냅샷 (TestBot용) */
  getAppState: <S>(appId: string): S | null => {
    const entry = useCommandEngineStore.getState().appRegistries.get(appId);
    return entry ? entry.getState() : null;
  },

  /** 앱 상태 복원 (TestBot용) */
  setAppState: <S>(appId: string, state: S): void => {
    const entry = useCommandEngineStore.getState().appRegistries.get(appId);
    if (entry) {
      entry.setState(state);
    }
  },
};
