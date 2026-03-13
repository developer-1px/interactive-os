/**
 * defineApp2 — Projection v2.2 SDK factory.
 *
 * Two-track Big Bang: parallel to defineApp, shares kernel infrastructure.
 * Key difference: createZone(name, ZoneConfig) directly produces ZoneHandle<E,C>
 * with Zone FC — no separate bind() call.
 */

import { defineScope } from "@kernel";
import type { CommandFactory } from "@kernel/core/tokens";
import { registerAppSlice } from "@os-core/engine/appState";
import type React from "react";
import type { FlatHandler, Selector } from "../defineApp/types";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

/** Role preset — OCP-compliant role definition */
interface RolePreset {
  readonly name: string;
}

/** Zone config for createZone */
// biome-ignore lint/suspicious/noExplicitAny: CommandFactory variance requires any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- CommandFactory contravariance
interface ZoneConfig<S, E, C extends Record<string, (...args: any[]) => any>> {
  role: RolePreset;
  entity: E;
  commands: C;
  data: (state: S) => E[];
}

/** Zone handle returned by createZone */
interface ZoneHandle<_E, _C> {
  Zone: React.FC;
}

/** Zone binding entry for defineApp2 — stored in __zoneBindings */
interface ZoneBinding2Entry {
  role: string;
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous command factories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous command factories
  commands: Record<string, (...args: any[]) => any>;
  data: (state: unknown) => unknown[];
}

/** AppHandle2 returned by defineApp2 */
interface AppHandle2<S> {
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
  ): CommandFactory<T, P>;

  // biome-ignore lint/suspicious/noExplicitAny: CommandFactory variance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CommandFactory contravariance
  createZone<E, C extends Record<string, (...args: any[]) => any>>(
    name: string,
    config: ZoneConfig<S, E, C>,
  ): ZoneHandle<E, C>;

  useComputed<T>(fn: (state: S) => T): T;
  useComputed<T>(selector: Selector<S, T>): T;

  readonly __appId: string;
  readonly __zoneBindings: Map<string, ZoneBinding2Entry>;
}

// ═══════════════════════════════════════════════════════════════════
// defineApp2
// ═══════════════════════════════════════════════════════════════════

export function defineApp2<S>(appId: string, initialState: S): AppHandle2<S> {
  const slice = registerAppSlice<S>(appId, { initialState });

  const zoneBindings = new Map<string, ZoneBinding2Entry>();

  // ── command ──

  function command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
  ): CommandFactory<T, P> {
    const kernelHandler = (ctx: { readonly state: S }) => (payload: P) =>
      handler(ctx, payload);

    const defineCmd = slice.group.defineCommand as (
      type: string,
      handler: unknown,
    ) => CommandFactory<string, unknown>;

    return defineCmd(type, kernelHandler) as unknown as CommandFactory<T, P>;
  }

  // ── createZone ──

  // biome-ignore lint/suspicious/noExplicitAny: CommandFactory variance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CommandFactory contravariance
  function createZone<E, C extends Record<string, (...args: any[]) => any>>(
    name: string,
    config: ZoneConfig<S, E, C>,
  ): ZoneHandle<E, C> {
    const scope = defineScope(`${appId}:${name}`);
    slice.group.group({ scope });

    // Register in __zoneBindings
    zoneBindings.set(name, {
      role: config.role.name,
      commands: config.commands,
      data: config.data as (state: unknown) => unknown[],
    });

    // Stub Zone FC — real implementation in T9 (Projection React)
    const Zone: React.FC = () => null;

    return { Zone };
  }

  // ── useComputed ──

  function useComputed<T>(selectorOrFn: Selector<S, T> | ((s: S) => T)): T {
    const fn =
      typeof selectorOrFn === "object" &&
      selectorOrFn !== null &&
      "select" in selectorOrFn
        ? (s: S) => (selectorOrFn as Selector<S, T>).select(s)
        : (selectorOrFn as (s: S) => T);
    return slice.useComputed(fn);
  }

  return {
    command,
    createZone,
    useComputed,
    __appId: appId,
    __zoneBindings: zoneBindings,
  };
}
