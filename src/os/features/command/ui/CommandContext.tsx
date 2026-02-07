/**
 * CommandContext - React Hooks for Command Engine
 *
 * UI 컴포넌트가 커맨드 엔진에 접근하기 위한 Hook 모음.
 * Store에서 활성 앱 데이터를 조회하여 반환.
 */

import type { CommandRegistry } from "@os/features/command/model/createCommandStore";
import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";

// ═══════════════════════════════════════════════════════════════════
// Individual Hooks
// ═══════════════════════════════════════════════════════════════════

export function useDispatch() {
  const activeAppId = useCommandEngineStore((s) => s.activeAppId);
  const appRegistries = useCommandEngineStore((s) => s.appRegistries);
  const dispatch = activeAppId
    ? appRegistries.get(activeAppId)?.dispatch
    : null;
  return dispatch ?? (() => { });
}

export function useAppState<S>() {
  const activeAppId = useCommandEngineStore((s) => s.activeAppId);
  const appRegistries = useCommandEngineStore((s) => s.appRegistries);
  return (activeAppId ? appRegistries.get(activeAppId)?.state : null) as S;
}

export function useRegistry<S = any>() {
  const activeAppId = useCommandEngineStore((s) => s.activeAppId);
  const appRegistries = useCommandEngineStore((s) => s.appRegistries);
  return (
    activeAppId ? appRegistries.get(activeAppId)?.registry : null
  ) as CommandRegistry<S, any>;
}

// ═══════════════════════════════════════════════════════════════════
// Composite Hook
// ═══════════════════════════════════════════════════════════════════

interface CommandEngineValue<S = any> {
  dispatch: (cmd: any) => void;
  registry: CommandRegistry<S, any> | null;
  state: S;
}

/**
 * 앱 컴포넌트에서 커맨드 엔진에 접근하기 위한 통합 Hook.
 * { state, dispatch, registry }를 반환.
 */
export function useEngine<S = any>(): CommandEngineValue<S> & {
  isInitialized: boolean;
} {
  const dispatch = useDispatch();
  const registry = useRegistry<S>();
  const state = useAppState<S>();
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);

  return {
    dispatch,
    registry,
    state,
    isInitialized,
  };
}

export const useCommandEngine = useEngine;
