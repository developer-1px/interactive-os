/**
 * CommandContext - React Hooks for Command Engine
 *
 * UI 컴포넌트가 커맨드 엔진에 접근하기 위한 Hook 모음.
 * Store에서 활성 앱 데이터를 조회하여 반환.
 */

import type { CommandRegistry } from "@os/core/command/model/createCommandStore";
import { useCommandEngineStore } from "@os/core/command/store/CommandEngineStore";
import { useAppEngineContext } from "./AppEngineContext";

// ═══════════════════════════════════════════════════════════════════
// Individual Hooks
// ═══════════════════════════════════════════════════════════════════

export function useDispatch() {
  const activeAppId = useCommandEngineStore((s) => s.activeAppId);
  const appRegistries = useCommandEngineStore((s) => s.appRegistries);
  const dispatch = activeAppId
    ? appRegistries.get(activeAppId)?.dispatch
    : null;
  return dispatch ?? (() => {});
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
 * Scoped context (OS.App 내부)를 우선 사용하고, 없으면 global store fallback.
 */
export function useEngine<S = any>(): CommandEngineValue<S> & {
  isInitialized: boolean;
} {
  // Always call all hooks unconditionally (Rules of Hooks)
  const ctx = useAppEngineContext<S>();
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);
  const globalDispatch = useDispatch();
  const globalRegistry = useRegistry<S>();
  const globalState = useAppState<S>();

  // Prefer scoped context when inside an OS.App
  return {
    dispatch: ctx?.dispatch ?? globalDispatch,
    registry: ctx?.registry ?? globalRegistry,
    state: ctx?.state ?? globalState,
    isInitialized,
  };
}

export const useCommandEngine = useEngine;
