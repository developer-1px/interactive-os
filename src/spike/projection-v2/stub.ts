/**
 * Projection Next API v2 — Stub Implementation
 *
 * All functions satisfy the interface types but throw at runtime.
 * Purpose: tsc 통과 = 타입 레벨 계약 확인. 로직은 /green의 몫.
 */

import type {
  AppHandle,
  AsChildProps,
  CommandCallable,
  EntityBase,
  ItemContext,
  ZoneConfig,
  ZoneContext,
  ZoneHandle,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function stub(name: string): never {
  throw new Error(`[STUB] ${name} not implemented`);
}

/** Create a stub FC that throws on render */
function stubFC<P>(name: string): React.FC<P> {
  const Stub = (_props: P): React.ReactNode => stub(name);
  Stub.displayName = `Stub(${name})`;
  return Stub;
}

// ═══════════════════════════════════════════════════════════════
// Item stub
// ═══════════════════════════════════════════════════════════════

function createStubItemContext<E extends EntityBase>(
  _entityShape: E | undefined,
): ItemContext<E> {
  // Use Proxy to provide stub values for any entity key access
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "Field") {
        return new Proxy(
          {},
          {
            get(_t, fieldName) {
              return stubFC<AsChildProps>(`item.Field.${String(fieldName)}`);
            },
          },
        );
      }
      if (prop === "Children") {
        return stubFC(`item.Children`);
      }
      if (prop === "id") {
        return "stub-id";
      }
      // Entity data fields — return stub value
      return `[STUB:${String(prop)}]`;
    },
  };

  return new Proxy({}, handler) as ItemContext<E>;
}

// ═══════════════════════════════════════════════════════════════
// Zone stub
// ═══════════════════════════════════════════════════════════════

function createStubZoneContext<
  E extends EntityBase,
  C extends Record<string, CommandCallable>,
>(config: ZoneConfig<E, C>): ZoneContext<E, C> {
  return {
    Items: stubFC(`zone.Items[${config.role}]`),
    Trigger: stubFC(`zone.Trigger[${config.role}]`),
  };
}

function createStubZoneHandle<
  E extends EntityBase,
  C extends Record<string, CommandCallable>,
>(config: ZoneConfig<E, C>): ZoneHandle<E, C> {
  return {
    Zone: stubFC(`Zone[${config.role}]`),
  };
}

// ═══════════════════════════════════════════════════════════════
// App stub
// ═══════════════════════════════════════════════════════════════

export function createStubApp<S>(_id: string, _initialState: S): AppHandle<S> {
  return {
    createZone<E extends EntityBase, C extends Record<string, CommandCallable>>(
      _name: string,
      config: ZoneConfig<E, C>,
    ): ZoneHandle<E, C> {
      return createStubZoneHandle(config);
    },

    command(
      _name: string,
      _handler: (state: S, payload: string) => S | undefined,
    ): CommandCallable {
      return (_payload: string) => stub("command dispatch");
    },
  };
}

// Re-export for convenience
export { createStubItemContext, createStubZoneContext };
