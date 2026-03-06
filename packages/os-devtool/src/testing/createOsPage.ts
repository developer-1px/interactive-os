/**
 * createOsPage — OS-only isolated Test Runner
 *
 * Provides a headless OS simulator for unit/integration testing
 * of OS-level interactions without app-level bindings.
 * Uses createPage internally with a dummy app for scoping.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { readActiveZoneId } from "@os-core/3-inject/compute";
import type { ElementAttrs, ItemAttrs } from "@os-core/3-inject/headless.types";
import { OS_CHECK as prodCHECK } from "@os-core/4-command";
import { OS_ACTIVATE as prodACTIVATE } from "@os-core/4-command/activate/activate";
import { OS_DELETE as prodDELETE } from "@os-core/4-command/crud/delete";
import { OS_ESCAPE as prodOS_ESCAPE } from "@os-core/4-command/dismiss/escape";
import { OS_EXPAND as prodEXPAND } from "@os-core/4-command/expand/index";
import { OS_FIELD_START_EDIT as prodFIELD_START_EDIT } from "@os-core/4-command/field/field";
import { OS_FOCUS as prodOS_FOCUS } from "@os-core/4-command/focus/focus";
import {
  OS_STACK_POP as prodSTACK_POP,
  OS_STACK_PUSH as prodSTACK_PUSH,
} from "@os-core/4-command/focus/stack";
import { OS_SYNC_FOCUS as prodSYNC_FOCUS } from "@os-core/4-command/focus/syncFocus";
import { OS_NAVIGATE as prodNAVIGATE } from "@os-core/4-command/navigate";
import { OS_SELECT as prodOS_SELECT } from "@os-core/4-command/selection/select";
import { OS_SELECTION_CLEAR as prodSELECTION_CLEAR } from "@os-core/4-command/selection/selection";
import { OS_TAB as prodOS_TAB } from "@os-core/4-command/tab/tab";
import { OS_VALUE_CHANGE as prodVALUE_CHANGE } from "@os-core/4-command/valueChange";
import { type AppState, initialAppState } from "@os-core/engine/kernel";
import type { ZoneRole } from "@os-core/engine/registries/roleRegistry";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import type { ZoneCallback } from "@os-core/engine/registries/zoneRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { ensureZone } from "@os-core/schema/state/utils";
import {
  DEFAULT_CONFIG,
  type DismissConfig,
  type FocusGroupConfig,
  type SelectConfig,
  type TabConfig,
} from "@os-core/schema/types/focus/config/FocusGroupConfig";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { produce } from "immer";
import { createPage } from "./page";

// ═══════════════════════════════════════════════════════════════════
// OsPage Interface (Headless OS Simulator)
// ═══════════════════════════════════════════════════════════════════

export interface GotoOptions {
  items?: string[];
  role?: ZoneRole;
  config?: Partial<FocusGroupConfig>;
  focusedItemId?: string | null;
  onAction?: ZoneCallback;
  onCheck?: ZoneCallback;
  onDelete?: ZoneCallback;
  /** Tree hierarchy levels — keys are item IDs, values are depth (1-based) */
  treeLevels?: Record<string, number>;
  /** Items that can be expanded (tree nodes with children) */
  expandableItems?: string[];
  /** Custom DOMRect positions for items (for spatial navigation tests) */
  rects?: Map<string, DOMRect>;
  /** Declarative initial state — applied at ZoneState creation, no command needed. */
  initial?: {
    selection?: string[];
    expanded?: string[];
    values?: Record<string, number>;
  };
}

export interface OsLocator {
  getAttribute(name: string): string | number | boolean | undefined;
  click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }): void;
  toHaveAttribute(name: string, value: string | boolean): boolean;
  toBeFocused(): boolean;
  toBeChecked(): boolean;
  toBeDisabled(): boolean;
  inputValue(): string;
  readonly attrs: ElementAttrs;
}

export interface OsPage {
  keyboard: { press(key: string): void };
  click(
    itemId: string,
    opts?: { shift?: boolean; meta?: boolean; ctrl?: boolean; zoneId?: string },
  ): void;
  attrs(itemId: string, zoneId?: string): ItemAttrs;
  goto(zoneId: string, opts?: GotoOptions): void;
  focusedItemId(zoneId?: string): string | null;
  selection(zoneId?: string): string[];
  activeZoneId(): string | null;
  dispatch(
    cmd: BaseCommand,
    opts?: {
      scope?: import("@kernel").ScopeToken[];
      meta?: Record<string, unknown>;
    },
  ): void;
  locator(selector: string): OsLocator;
  cleanup(): void;
  dumpDiagnostics(): void;

  setItems(items: string[]): void;
  setRects(rects: Map<string, DOMRect>): void;
  setConfig(config: Partial<FocusGroupConfig>): void;
  setRole(
    zoneId: string,
    role: ZoneRole,
    opts?: {
      onAction?: ZoneCallback;
      onCheck?: ZoneCallback;
      onDelete?: ZoneCallback;
    },
  ): void;
  setExpandableItems(items: string[] | Set<string>): void;
  setTreeLevels(levels: Record<string, number> | Map<string, number>): void;
  setValueNow(itemId: string, value: number): void;
  setActiveZone(zoneId: string, focusedItemId: string | null): void;
  initZone(
    zoneId: string,
    opts?: Partial<{
      focusedItemId: string;
      lastFocusedId: string;
      selection: string[];
      parentId: string | null;
    }>,
  ): void;
  zone(
    zoneId?: string,
  ): import("@os-core/schema/state/OSState").ZoneState | undefined;
  state(): AppState;
  setZoneOrder(
    zones: {
      zoneId: string;
      firstItemId: string | null;
      lastItemId: string | null;
      entry: import("@os-core/schema/types/focus/config/FocusGroupConfig").NavigateEntry;
      selectedItemId: string | null;
      lastFocusedId: string | null;
    }[],
  ): void;

  readonly kernel: ReturnType<typeof import("@kernel").createKernel<AppState>>;

  OS_FOCUS: typeof import("@os-core/4-command/focus/focus").OS_FOCUS;
  OS_SYNC_FOCUS: typeof import("@os-core/4-command/focus/syncFocus").OS_SYNC_FOCUS;
  OS_SELECT: typeof import("@os-core/4-command/selection/select").OS_SELECT;
  OS_NAVIGATE: typeof import("@os-core/4-command/navigate").OS_NAVIGATE;
  OS_TAB: typeof import("@os-core/4-command/tab/tab").OS_TAB;
  OS_ESCAPE: typeof import("@os-core/4-command/dismiss/escape").OS_ESCAPE;
  OS_SELECTION_CLEAR: typeof import("@os-core/4-command/selection/selection").OS_SELECTION_CLEAR;
  OS_STACK_PUSH: typeof import("@os-core/4-command/focus/stack").OS_STACK_PUSH;
  OS_STACK_POP: typeof import("@os-core/4-command/focus/stack").OS_STACK_POP;
  OS_EXPAND: typeof import("@os-core/4-command/expand/index").OS_EXPAND;
  OS_FIELD_START_EDIT: typeof import("@os-core/4-command/field/field").OS_FIELD_START_EDIT;
  OS_ACTIVATE: typeof import("@os-core/4-command/activate/activate").OS_ACTIVATE;
  OS_CHECK: typeof import("@os-core/4-command").OS_CHECK;
  OS_DELETE: typeof import("@os-core/4-command/crud/delete").OS_DELETE;
  OS_VALUE_CHANGE: typeof import("@os-core/4-command/valueChange").OS_VALUE_CHANGE;
}

/** Zone order entry — describes a zone's position and key items for tab navigation */
export interface ZoneOrderEntry {
  zoneId: string;
  firstItemId: string | null;
  lastItemId: string | null;
  entry:
    | import("@os-core/schema/types/focus/config/FocusGroupConfig").NavigateEntry
    | string;
  selectedItemId: string | null;
  lastFocusedId: string | null;
}

/**
 * OS-only isolated Test Runner (Drop-in replacement for createOsPage.ts)
 */
export function createOsPage(overrides?: Partial<AppState>): OsPage {
  // Use defineApp to create a generic blank app for scoping
  const dummyApp = defineApp("__os_test_simulation__", {});

  const basePage = createPage(dummyApp);
  const os = basePage.kernel;

  os.defineEffect("focus", () => {});
  os.defineEffect("scroll", () => {});
  const mockItems = { current: [] as string[] };
  const mockRects = { current: new Map<string, DOMRect>() };
  const mockConfig = { current: { ...DEFAULT_CONFIG } as FocusGroupConfig };
  const mockExpandableItems = { current: new Set<string>() };
  const mockTreeLevels = { current: new Map<string, number>() };
  const mockZoneOrder = { current: [] as ZoneOrderEntry[] };

  // ── Override Accessors (Mock priority) ──
  os.defineContext("dom-items", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    if (entry?.getItems) {
      const items = entry.getItems();
      return entry.itemFilter ? entry.itemFilter(items) : items;
    }
    const items = mockItems.current;
    return entry?.itemFilter ? entry.itemFilter(items) : items;
  });

  os.defineContext("dom-rects", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    const items =
      entry?.getItems?.() ??
      (entry?.itemFilter
        ? entry.itemFilter(mockItems.current)
        : mockItems.current);
    const rects = mockRects.current;
    if (rects.size > 0) return rects;
    const auto = new Map<string, DOMRect>();
    items.forEach((id, i) => {
      auto.set(id, new DOMRect(0, i * 40, 200, 40));
    });
    return auto;
  });

  os.defineContext("zone-config", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    // Prefer ZoneRegistry config if it has select (fully resolved).
    // Partial configs (e.g., { activate, dismiss } only) fall back to mockConfig.
    if (entry?.config?.select) return entry.config;
    return mockConfig.current;
  });

  os.defineContext("dom-expandable-items", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    const expandMode = entry?.config?.expand?.mode ?? "none";
    if (expandMode === "none") return new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AllItems sentinel: expand mode "all" means every item is expandable
    if (expandMode === "all")
      return { has: () => true, size: Infinity } as unknown as Set<string>;
    return entry?.getExpandableItems?.() ?? mockExpandableItems.current;
  });

  os.defineContext("dom-tree-levels", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    return entry?.getTreeLevels?.() ?? mockTreeLevels.current;
  });

  os.defineContext("dom-zone-order", () => {
    const registeredKeys = ZoneRegistry.orderedKeys();
    if (registeredKeys.length > 0 && mockZoneOrder.current.length === 0) {
      const state = os.getState();
      return registeredKeys
        .filter((zId) => ZoneRegistry.has(zId))
        .map((zId) => {
          const ze = ZoneRegistry.get(zId)!;
          const items = ze.getItems?.() ?? mockItems.current;
          const filtered = ze.itemFilter ? ze.itemFilter(items) : items;
          const zoneState = state.os.focus.zones[zId];
          return {
            zoneId: zId,
            firstItemId: filtered[0] ?? null,
            lastItemId: filtered[filtered.length - 1] ?? null,
            entry: (ze.config?.navigate?.entry ??
              "first") as import("@os-core/schema/types/focus/config/FocusGroupConfig").NavigateEntry,
            selectedItemId:
              Object.entries(zoneState?.items ?? {}).find(
                ([, s]) => s?.["aria-selected"],
              )?.[0] ?? null,
            lastFocusedId: zoneState?.lastFocusedId ?? null,
          };
        });
    }
    return mockZoneOrder.current;
  });

  // ── Preview invariant: all test state lives in preview layer ──
  // enterPreview is idempotent — base kernel state never gets dirty.
  // cleanup() re-enters with fresh state to reset.
  os.enterPreview(initialAppState);

  if (overrides) {
    os.setState((s: AppState) => ({ ...s, ...overrides }));
  }

  const result: OsPage = {
    ...basePage,

    // Override state accessor
    state() {
      return os.getState();
    },

    // ── Mock Setters ──
    setItems(items: string[]) {
      mockItems.current = items;
    },
    setRects(rects: Map<string, DOMRect>) {
      mockRects.current = rects;
    },
    setConfig(config: Partial<FocusGroupConfig>) {
      const base = mockConfig.current;
      mockConfig.current = {
        ...base,
        ...config,
        navigate: { ...base.navigate, ...config.navigate },
        tab: { ...base.tab, ...config.tab },
        select: { ...base.select, ...config.select },
        dismiss: { ...base.dismiss, ...config.dismiss },
        project: { ...base.project, ...config.project },
        expand: { ...base.expand, ...config.expand },
        value: { ...base.value, ...config.value },
        inputmap: { ...base.inputmap, ...config.inputmap },
      } as FocusGroupConfig;
      // Sync to ZoneRegistry so context providers reading entry.config see the update
      const zoneId = os.getState().os.focus.activeZoneId;
      if (zoneId) {
        const entry = ZoneRegistry.get(zoneId);
        if (entry) {
          ZoneRegistry.register(zoneId, {
            ...entry,
            config: mockConfig.current,
          });
        }
      }
    },
    setRole(zoneId, role, opts) {
      const resolved = resolveRole(role);
      mockConfig.current = resolved;
      ZoneRegistry.register(zoneId, {
        role,
        config: resolved,
        element: null,
        parentId: null,
        ...(opts?.onAction ? { onAction: opts.onAction } : {}),
        ...(opts?.onCheck ? { onCheck: opts.onCheck } : {}),
        ...(opts?.onDelete ? { onDelete: opts.onDelete } : {}),
      });
    },
    setExpandableItems(items) {
      const set = items instanceof Set ? items : new Set(items);
      mockExpandableItems.current = set;
      const zoneId = os.getState().os.focus.activeZoneId;
      if (zoneId) {
        const entry = ZoneRegistry.get(zoneId);
        if (entry) {
          ZoneRegistry.register(zoneId, {
            ...entry,
            getExpandableItems: () => set,
          });
        }
      }
    },
    setTreeLevels(levels) {
      mockTreeLevels.current =
        levels instanceof Map ? levels : new Map(Object.entries(levels));
    },
    setValueNow(itemId, value) {
      os.setState((s: AppState) =>
        produce(s, (draft) => {
          const zoneId = draft.os.focus.activeZoneId;
          if (!zoneId) return;
          const z = ensureZone(draft.os, zoneId);
          z.valueNow[itemId] = value;
        }),
      );
    },
    setActiveZone(zoneId, focusedItemId) {
      const existingEntry = ZoneRegistry.get(zoneId);
      // Capture items snapshot so each zone keeps its own item list
      // even after mockItems.current changes for a later zone.
      // Always use captured snapshot — setActiveZone means "this zone
      // owns these items now", regardless of prior registrations.
      const capturedItems = [...mockItems.current];
      ZoneRegistry.register(zoneId, {
        ...(existingEntry?.role ? { role: existingEntry.role } : {}),
        config: mockConfig.current,
        element: null,
        parentId: null,
        getItems: () => capturedItems,
        ...(mockExpandableItems.current.size > 0
          ? { getExpandableItems: () => mockExpandableItems.current }
          : {}),
        ...(existingEntry?.onAction
          ? { onAction: existingEntry.onAction }
          : {}),
        ...(existingEntry?.onCheck ? { onCheck: existingEntry.onCheck } : {}),
        ...(existingEntry?.onDelete
          ? { onDelete: existingEntry.onDelete }
          : {}),
      });

      os.setState((s: AppState) =>
        produce(s, (draft) => {
          draft.os.focus.activeZoneId = zoneId;

          const z = ensureZone(draft.os, zoneId);
          z.focusedItemId = focusedItemId;
          if (focusedItemId) z.lastFocusedId = focusedItemId;
        }),
      );
    },
    initZone(zoneId, opts) {
      os.setState((s: AppState) =>
        produce(s, (draft) => {
          const z = ensureZone(draft.os, zoneId);
          if (opts?.focusedItemId) z.focusedItemId = opts.focusedItemId;
          if (opts?.lastFocusedId) z.lastFocusedId = opts.lastFocusedId;
          if (opts?.selection) {
            for (const id of opts.selection) {
              if (!z.items[id]) z.items[id] = {};
              z.items[id] = { ...z.items[id], "aria-selected": true };
            }
          }
        }),
      );
      if (opts?.parentId !== undefined) {
        const existing = ZoneRegistry.get(zoneId);
        if (existing) {
          ZoneRegistry.register(zoneId, {
            ...existing,
            parentId: opts.parentId,
          });
        }
      }
    },
    setZoneOrder(zones) {
      mockZoneOrder.current = zones;
    },
    zone(zoneId) {
      const id = zoneId ?? readActiveZoneId(os);
      const z = id ? os.getState().os.focus.zones[id] : undefined;
      if (!z) return undefined;
      // Computed compatibility getters derived from items map
      return Object.create(z, {
        expandedItems: {
          get() {
            return Object.entries(z.items ?? {})
              .filter(
                ([, s]) => (s as Record<string, unknown>)?.["aria-expanded"],
              )
              .map(([itemId]) => itemId);
          },
          enumerable: true,
        },
        selection: {
          get() {
            const selected = Object.entries(z.items ?? {})
              .filter(
                ([, s]) =>
                  (s as Record<string, unknown>)?.["aria-selected"] ||
                  (s as Record<string, unknown>)?.["aria-checked"],
              )
              .map(([itemId]) => itemId);
            // Sort by zone item list order (not map insertion order)
            const entry = id ? ZoneRegistry.get(id) : undefined;
            const itemList = entry?.getItems?.() ?? [];
            if (itemList.length > 0) {
              const orderMap = new Map(itemList.map((id, i) => [id, i]));
              selected.sort(
                (a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0),
              );
            }
            return selected;
          },
          enumerable: true,
        },
      });
    },
    goto(zoneId: string, opts?: GotoOptions) {
      if (opts?.items) mockItems.current = opts.items;

      const role = opts?.role ?? ZoneRegistry.get(zoneId)?.role;
      if (role) {
        mockConfig.current = resolveRole(role);
      }
      if (opts?.config) {
        const base = mockConfig.current;
        mockConfig.current = {
          ...base,
          ...opts.config,
          ...(opts.config.navigate
            ? {
                navigate: {
                  ...base.navigate,
                  ...opts.config.navigate,
                } as import("@os-core/schema/types/focus/config/FocusGroupConfig").NavigateConfig,
              }
            : {}),
          ...(opts.config.tab
            ? { tab: { ...base.tab, ...opts.config.tab } as Partial<TabConfig> }
            : {}),
          ...(opts.config.select
            ? {
                select: {
                  ...base.select,
                  ...opts.config.select,
                } as Partial<SelectConfig>,
              }
            : {}),
          ...(opts.config.dismiss
            ? {
                dismiss: {
                  ...base.dismiss,
                  ...opts.config.dismiss,
                } as Partial<DismissConfig>,
              }
            : {}),

          ...(opts.config.expand
            ? {
                expand: {
                  ...base.expand,
                  ...opts.config.expand,
                },
              }
            : {}),
          ...(opts.config.value
            ? {
                value: {
                  ...base.value,
                  ...opts.config.value,
                },
              }
            : {}),
          ...(opts.config.inputmap
            ? {
                inputmap: {
                  ...base.inputmap,
                  ...opts.config.inputmap,
                },
              }
            : {}),
        } as FocusGroupConfig;
      }
      const entry = ZoneRegistry.get(zoneId);
      ZoneRegistry.register(zoneId, {
        ...(entry || {}),
        ...(role ? { role } : {}),
        config: mockConfig.current,
        element: null,
        parentId: null,
        getItems: () => mockItems.current,
        // Auto-provide getExpandableItems based on expand.mode
        ...(mockConfig.current.expand?.mode === "explicit"
          ? {
              getExpandableItems: () =>
                mockExpandableItems.current.size > 0
                  ? mockExpandableItems.current
                  : new Set(mockItems.current),
            }
          : {}),
        ...(opts?.onAction ? { onAction: opts.onAction } : {}),
        ...(opts?.onCheck ? { onCheck: opts.onCheck } : {}),
        ...(opts?.onDelete ? { onDelete: opts.onDelete } : {}),
        ...(opts?.treeLevels
          ? {
              getTreeLevels: () =>
                new Map(
                  Object.entries(opts.treeLevels!).map(([k, v]) => [k, v]),
                ),
            }
          : {}),
        ...(opts?.expandableItems
          ? { getExpandableItems: () => new Set(opts.expandableItems!) }
          : {}),
      }); // Closing brace for ZoneRegistry.register

      // Apply custom rects if provided
      if (opts?.rects) {
        mockRects.current = opts.rects;
      }

      const focusedId =
        opts?.focusedItemId !== undefined
          ? opts.focusedItemId
          : (opts?.items?.[0] ?? null);

      let initialSelection: string[] | undefined;

      // Priority: (1) explicit initial.selection, (2) followFocus, (3) disallowEmpty fallback
      if (opts?.initial?.selection) {
        initialSelection = opts.initial.selection;
      } else if (focusedId && mockConfig.current.select?.followFocus) {
        initialSelection = [focusedId];
      } else if (
        mockConfig.current.select?.disallowEmpty &&
        opts?.items?.length
      ) {
        // disallowEmpty fallback: auto-select first item (replaces OS_INIT_SELECTION)
        initialSelection = [opts.items[0]];
      }

      basePage.goto(zoneId, {
        focusedItemId: focusedId ?? undefined,
        config: mockConfig.current,
      } as Parameters<typeof basePage.goto>[1]);

      // Apply initial selection and expanded values (no seed needed —
      // computeItem derives key existence from config directly)
      if (
        initialSelection ||
        opts?.initial?.expanded ||
        opts?.initial?.values
      ) {
        const inputmapValues = mockConfig.current.inputmap
          ? Object.values(mockConfig.current.inputmap)
          : [];
        const hasCheckCmd = inputmapValues.some((cmds) =>
          cmds.some((c) => c.type === "OS_CHECK"),
        );
        const selectMode = mockConfig.current.select?.mode ?? "none";

        os.setState((s: AppState) =>
          produce(s, (draft) => {
            const z = ensureZone(draft.os, zoneId);

            // Apply initial selection (override default false → true)
            if (initialSelection) {
              for (const id of initialSelection!) {
                if (!z.items[id]) z.items[id] = {};
                if (hasCheckCmd) {
                  z.items[id] = { ...z.items[id], "aria-checked": true };
                }
                if (selectMode !== "none") {
                  z.items[id] = { ...z.items[id], "aria-selected": true };
                }
              }
              z.selectionAnchor = initialSelection![0] ?? null;
            }

            // Apply initial expanded state (override default false → true)
            if (opts?.initial?.expanded) {
              for (const id of opts.initial!.expanded!) {
                if (!z.items[id]) z.items[id] = {};
                z.items[id] = { ...z.items[id], "aria-expanded": true };
              }
            }

            // Apply initial values (Zero Drift: same as Zone mount)
            if (opts?.initial?.values) {
              for (const [itemId, value] of Object.entries(
                opts.initial!.values!,
              )) {
                z.valueNow[itemId] = value;
              }
            }
          }),
        );
      }
    },

    // Command Exports
    kernel: os,
    OS_FOCUS: os.register(prodOS_FOCUS),
    OS_SYNC_FOCUS: os.register(prodSYNC_FOCUS),
    OS_SELECT: os.register(prodOS_SELECT),
    OS_NAVIGATE: os.register(prodNAVIGATE),
    OS_TAB: os.register(prodOS_TAB),
    OS_ESCAPE: os.register(prodOS_ESCAPE),
    OS_SELECTION_CLEAR: os.register(prodSELECTION_CLEAR),
    OS_STACK_PUSH: os.register(prodSTACK_PUSH),
    OS_STACK_POP: os.register(prodSTACK_POP),
    OS_EXPAND: os.register(prodEXPAND),
    OS_FIELD_START_EDIT: os.register(prodFIELD_START_EDIT),
    OS_ACTIVATE: os.register(prodACTIVATE),
    OS_CHECK: os.register(prodCHECK),
    OS_DELETE: os.register(prodDELETE),
    OS_VALUE_CHANGE: os.register(prodVALUE_CHANGE),
  };
  return result;
}
