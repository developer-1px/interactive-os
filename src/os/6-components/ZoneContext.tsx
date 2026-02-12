/**
 * ZoneContext — Lean React context shared between Zone and Item.
 *
 * Provides only the zone ID and config. All state lives in the kernel.
 */

import type { Command, ScopeToken } from "@kernel";
import { GLOBAL } from "@kernel";
import { createContext, useCallback, useContext } from "react";
import { kernel } from "../kernel";
import type { ZoneRole } from "../registry/roleRegistry";
import type { FocusGroupConfig } from "../schema/focus/config/FocusGroupConfig";

export interface ZoneContextValue {
  zoneId: string;
  config: FocusGroupConfig;
  role?: ZoneRole;
  scope: ScopeToken;
}

export const ZoneContext = createContext<ZoneContextValue | null>(null);

export function useZoneContext(): ZoneContextValue {
  const ctx = useContext(ZoneContext);
  if (!ctx) {
    throw new Error("useZoneContext must be used within a <Zone>");
  }
  return ctx;
}

/**
 * useZoneDispatch — dispatch a command within the current zone's scope.
 *
 * Automatically attaches the zone's ScopeToken + GLOBAL as the bubblePath,
 * so the kernel checks for scoped handlers at this zone first,
 * then falls back to the global handler.
 */
export function useZoneDispatch() {
  const ctx = useZoneContext();
  const { scope } = ctx;

  return useCallback(
    (cmd: Command<string, any>) => {
      kernel.dispatch(cmd, { scope: [scope, GLOBAL as ScopeToken] });
    },
    [scope],
  );
}
