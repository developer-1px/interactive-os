/**
 * zoneLogic — Pure functions for Zone lifecycle.
 *
 * All functions here are pure (no DOM, no React, no side effects).
 * They are the "brain" of Zone/FocusGroup, usable by:
 *   - Zone.tsx / FocusGroup.tsx (React adapter layer)
 *   - useZoneLifecycle.ts (entry building)
 *   - headless.ts (browser-free simulation)
 *   - Tests (direct unit testing)
 *
 * This module is the single source of truth for:
 *   - Zone ID generation
 *   - Config resolution (role + options → FocusGroupConfig)
 *   - ZoneEntry construction
 *   - Container ARIA props computation
 *   - ZoneContext value creation
 */

import type { BaseCommand } from "@kernel";
import { defineScope, type ScopeToken } from "@kernel";
import type { ZoneRole } from "@os-core/engine/registries/roleRegistry";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import type {
  ZoneCallback,
  ZoneEntry,
} from "@os-core/engine/registries/zoneRegistry";
import type {
  DismissConfig,
  ExpandConfig,
  FocusGroupConfig,
  NavigateConfig,
  ProjectConfig,
  SelectConfig,
  TabConfig,
} from "../schema/types";
import type { InputMap } from "../schema/types/focus/config/FocusGroupConfig";

// ═══════════════════════════════════════════════════════════════════
// Zone ID Generator
// ═══════════════════════════════════════════════════════════════════

let zoneIdCounter = 0;

/** Generate a unique zone ID. Pure counter — no DOM, no React. */
export function generateZoneId(): string {
  return `zone-${++zoneIdCounter}`;
}

/** Generate a unique focus-group ID (for standalone FocusGroup). */
export function generateGroupId(): string {
  return `focus-group-${++zoneIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════════
// Zone Options (config overrides)
// ═══════════════════════════════════════════════════════════════════

/** Advanced configuration overrides — use sparingly, prefer role presets */
export interface ZoneOptions {
  navigate?: Partial<NavigateConfig> | undefined;
  tab?: Partial<TabConfig> | undefined;
  select?: Partial<SelectConfig> | undefined;
  dismiss?: Partial<DismissConfig> | undefined;
  project?: Partial<ProjectConfig> | undefined;
  expand?: Partial<ExpandConfig> | undefined;
  value?:
    | Partial<
        import("@os-core/schema/types/focus/config/FocusGroupConfig").ValueConfig
      >
    | undefined;
  inputmap?: InputMap | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Config Resolution
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a FocusGroupConfig from role + options.
 *
 * Single source of truth — replaces duplicated useMemo logic
 * in Zone.tsx and FocusGroup.tsx.
 */
export function createZoneConfig(
  role?: ZoneRole | string,
  options?: ZoneOptions,
): FocusGroupConfig {
  return resolveRole(role, options ?? {});
}

// ═══════════════════════════════════════════════════════════════════
// Zone Callbacks — all entry-level callbacks collected as one bag
// OCP: add a field here → automatically flows to ZoneEntry.
// ═══════════════════════════════════════════════════════════════════

export interface ZoneCallbacks {
  onAction?: ZoneCallback | undefined;
  onSelect?: ZoneCallback | undefined;
  onCheck?: ZoneCallback | undefined;
  onDelete?: ZoneCallback | undefined;
  onMoveUp?: ZoneCallback | undefined;
  onMoveDown?: ZoneCallback | undefined;
  onCopy?: ZoneCallback | undefined;
  onCut?: ZoneCallback | undefined;
  onPaste?: ZoneCallback | undefined;
  onUndo?: BaseCommand | undefined;
  onRedo?: BaseCommand | undefined;
  onDismiss?: BaseCommand | undefined;
  itemFilter?: ((items: string[]) => string[]) | undefined;
  getItems?: (() => string[]) | undefined;
  getExpandableItems?: (() => Set<string>) | undefined;
  getTreeLevels?: (() => Map<string, number>) | undefined;
  onReorder?:
    | ((info: {
        itemId: string;
        overItemId: string;
        position: "before" | "after";
      }) => BaseCommand | BaseCommand[])
    | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Entry Builder — single source of truth for ZoneEntry construction.
// OCP-safe: new ZoneCallbacks fields flow through spread automatically.
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a ZoneEntry from config + callbacks.
 *
 * Pure function — no DOM, no React hooks.
 * Used by useZoneLifecycle (React) and headless zone registration.
 */
export function buildZoneEntry(
  config: FocusGroupConfig,
  role: ZoneRole | undefined,
  parentId: string | null,
  callbacks: ZoneCallbacks,
  existing?: ZoneEntry,
): ZoneEntry {
  // Strip undefined values — only defined callbacks flow into entry.
  // Cast is safe: the loop above guarantees no undefined values remain.
  const defined: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(callbacks)) {
    if (v !== undefined) defined[k] = v;
  }

  const entry: ZoneEntry = {
    config,
    element: null,
    parentId,
    ...(defined as Partial<ZoneEntry>),
    ...(role !== undefined ? { role } : {}),
  };

  // Preserve DOM bindings from bindElement (may have been set in previous lifecycle)
  if (existing?.element) entry.element = existing.element;
  if (!callbacks.getItems && existing?.getItems)
    entry.getItems = existing.getItems;
  if (!entry.getLabels && existing?.getLabels)
    entry.getLabels = existing.getLabels;

  return entry;
}

// ═══════════════════════════════════════════════════════════════════
// Container ARIA Props — pure computation from config + role.
// ═══════════════════════════════════════════════════════════════════

/** All props to spread onto a Zone/FocusGroup container div. */
export interface ContainerProps {
  id: string;
  role: string;
  tabIndex: -1;
  "data-zone": string;
  "data-orientation": string | undefined;
  "aria-current": "true" | undefined;
  "aria-orientation": "horizontal" | "vertical" | undefined;
  "aria-multiselectable": true | undefined;
}

/**
 * Compute ALL container div props for a Zone/FocusGroup element.
 *
 * Pure function — no React hooks, no DOM access.
 * Result is spread directly onto the container div: `<div {...computeContainerProps(...)} />`
 */
export function computeContainerProps(
  zoneId: string,
  config: FocusGroupConfig,
  isActive: boolean,
  fallbackRole?: ZoneRole | string,
): ContainerProps {
  const orientation = config.navigate.orientation;
  return {
    id: zoneId,
    role: (fallbackRole as string) || "group",
    tabIndex: -1 as const,
    "data-zone": zoneId,
    "data-orientation": orientation,
    "aria-current": isActive ? ("true" as const) : undefined,
    "aria-orientation":
      orientation === "horizontal"
        ? ("horizontal" as const)
        : orientation === "vertical"
          ? ("vertical" as const)
          : undefined,
    "aria-multiselectable": config.select.mode === "multiple" || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Zone Context Value — unified context (identity + focus config).
// ═══════════════════════════════════════════════════════════════════

export interface ZoneContextValue {
  zoneId: string;
  scope: ScopeToken;
  config: FocusGroupConfig;
  role?: ZoneRole | undefined;
}

/**
 * Create a unified ZoneContextValue.
 * Pure function — no React.
 */
export function createZoneContext(
  zoneId: string,
  config: FocusGroupConfig,
  role?: ZoneRole,
): ZoneContextValue {
  return {
    zoneId,
    scope: defineScope(zoneId),
    config,
    ...(role !== undefined ? { role } : {}),
  };
}
