import { clearContextProviders } from "./core/context.ts";
import { createStore, type Store, unbindStore } from "./core/createStore.ts";
import { createGroup } from "./core/group.ts";
import { clearAllRegistries } from "./core/registries.ts";
import {
  type EffectToken,
  GLOBAL,
  type ScopeToken,
  type StateMarker,
} from "./core/tokens.ts";
import { clearTransactions } from "./core/transaction.ts";

// HMR-safe: globalThis에 저장하여 모듈 재실행에도 유지
const GROUP_KEY = "__kernel_group__";

/**
 * Create a Kernel instance — returns the root Group.
 *
 * HMR-safe: 이미 생성된 Group이 있으면 캐시된 인스턴스를 반환.
 *
 * @example
 *   const kernel = createKernel({ state: state<AppState>(), effects: { NOTIFY } });
 */
export function createKernel<
  E extends Record<string, EffectToken> = Record<string, never>,
  S = unknown,
>(_config: { state?: StateMarker<S>; effects?: E }) {
  const cached = (globalThis as Record<string, unknown>)[GROUP_KEY];
  if (cached) return cached as ReturnType<typeof createGroup<S, E, []>>;
  const group = createGroup<S, E, []>(GLOBAL as string, []);
  (globalThis as Record<string, unknown>)[GROUP_KEY] = group;
  return group;
}

/**
 * Create a ScopeToken. No tree management — Kernel doesn't know about DOM.
 *
 * @example
 *   const CARD_LIST = defineScope("CARD_LIST");
 */
export function defineScope<Id extends string>(id: Id): ScopeToken<Id> {
  return id as ScopeToken<Id>;
}

/** Create a phantom state type marker. No runtime cost. */
export function state<S>(): StateMarker<S> {
  return {} as StateMarker<S>;
}

/**
 * Convenience: create store + bind in one call.
 *
 * HMR-safe: Store가 이미 존재하면 기존 Store를 반환 (상태 보존).
 * State shape이 변경된 경우 (다른 앱으로 전환) initialState로 리셋.
 */
export function initKernel<S>(initialState: S): Store<S> {
  const store = createStore(initialState);

  // Shape validation: schema 변경 감지 시 리셋
  const current = store.getState() as Record<string, unknown>;
  const initial = initialState as Record<string, unknown>;
  if (
    current !== null &&
    initial !== null &&
    typeof current === "object" &&
    typeof initial === "object"
  ) {
    const currentKeys = Object.keys(current).sort().join(",");
    const initialKeys = Object.keys(initial).sort().join(",");
    if (currentKeys !== initialKeys) {
      store.setState(() => initialState as unknown as S);
    }
  }

  return store;
}

/**
 * resetKernel — Clear all registries, contexts, transactions, cache, and unbind store.
 * Used for testing.
 */
export function resetKernel(): void {
  clearAllRegistries();
  clearContextProviders();
  clearTransactions();
  unbindStore();
  (globalThis as Record<string, unknown>)[GROUP_KEY] = null;
}
