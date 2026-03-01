/**
 * defineApp — AppPage factory
 *
 * Creates a Playwright Page-isomorphic headless integration test interface.
 * Uses the production kernel with preview mode for state isolation.
 * No OS duplication — wraps shared headless interaction functions.
 *
 * "Same test code, different runtime."
 */

import { ZoneRegistry } from "@os/registries/zoneRegistry";
import { type AppState, initialAppState, os } from "@os/kernel";
import { Keybindings } from "@os/keymaps/keybindings";
import {
  DEFAULT_CONFIG,
  type FocusGroupConfig,
  type NavigateConfig,
  type TabConfig,
  type SelectConfig,
  type ActivateConfig,
  type DismissConfig,
} from "@os/schemas/focus/config/FocusGroupConfig";
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";
import { createElement, type FC } from "react";
import { renderToString } from "react-dom/server";

import {
  computeAttrs,
  type ElementAttrs,
  type ItemAttrs,
  readActiveZoneId,
  readFocusedItemId,
  readSelection,
  resolveElement,
  simulateClick,
  simulateKeyPress,
} from "./headless";

// Ensure OS defaults are registered
import "@os/keymaps/osDefaults";

import type { BaseCommand } from "@kernel/core/tokens";
import { FieldRegistry } from "@os/registries/fieldRegistry";
import type {
  AppPage,
  FieldBindings,
  KeybindingEntry,
  ZoneBindings,
} from "./defineApp.types";
import type { ZoneRole } from "@os/registries/roleRegistry";
import { resolveRole } from "@os/registries/roleRegistry";
import type { ZoneCallback } from "@os/registries/zoneRegistry";

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
}

export interface OsLocator {
  getAttribute(name: string): string | number | boolean | undefined;
  click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }): void;
  toHaveAttribute(name: string, value: string | boolean): boolean;
  toBeFocused(): boolean;
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
    opts?: { scope?: import("@kernel").ScopeToken[]; meta?: Record<string, unknown> },
  ): void;
  locator(elementId: string): OsLocator;
  cleanup(): void;
  dumpDiagnostics(): void;

  setItems(items: string[]): void;
  setRects(rects: Map<string, DOMRect>): void;
  setGrid(opts: {
    cols: number;
    itemWidth?: number;
    itemHeight?: number;
    gap?: number;
  }): void;
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
  zone(zoneId?: string): import("@os/state/OSState").ZoneState | undefined;
  state(): AppState;
  setZoneOrder(zones: {
    zoneId: string;
    firstItemId: string | null;
    lastItemId: string | null;
    entry: import("@os/schemas/focus/config/FocusGroupConfig").NavigateEntry;
    selectedItemId: string | null;
    lastFocusedId: string | null;
  }[]): void;

  readonly kernel: ReturnType<typeof import("@kernel").createKernel<AppState>>;

  OS_FOCUS: typeof import("@os/3-commands/focus/focus").OS_FOCUS;
  OS_SYNC_FOCUS: typeof import("@os/3-commands/focus/syncFocus").OS_SYNC_FOCUS;
  OS_SELECT: typeof import("@os/3-commands/selection/select").OS_SELECT;
  OS_NAVIGATE: typeof import("@os/3-commands/navigate").OS_NAVIGATE;
  OS_TAB: typeof import("@os/3-commands/tab/tab").OS_TAB;
  OS_ESCAPE: typeof import("@os/3-commands/dismiss/escape").OS_ESCAPE;
  OS_SELECTION_CLEAR: typeof import("@os/3-commands/selection/selection").OS_SELECTION_CLEAR;
  OS_STACK_PUSH: typeof import("@os/3-commands/focus/stack").OS_STACK_PUSH;
  OS_STACK_POP: typeof import("@os/3-commands/focus/stack").OS_STACK_POP;
  OS_EXPAND: typeof import("@os/3-commands/expand/index").OS_EXPAND;
  OS_FIELD_START_EDIT: typeof import("@os/3-commands/field/field").OS_FIELD_START_EDIT;
  OS_ACTIVATE: typeof import("@os/3-commands/interaction/activate").OS_ACTIVATE;
  OS_CHECK: typeof import("@os/3-commands/interaction").OS_CHECK;
  OS_DELETE: typeof import("@os/3-commands/interaction/delete").OS_DELETE;
  OS_VALUE_CHANGE: typeof import("@os/3-commands/value").OS_VALUE_CHANGE;
}

// ═══════════════════════════════════════════════════════════════════
// Zone Binding Entry — collected by defineApp.ts at zone.bind() time
// ═══════════════════════════════════════════════════════════════════

export interface ZoneBindingEntry {
  role: ZoneRole;
  bindings: ZoneBindings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic keybinding entries
  keybindings?: KeybindingEntry<any>[];
  field?: FieldBindings;
  triggers?: import("./defineApp.types").TriggerBinding[];
}

// ═══════════════════════════════════════════════════════════════════
// createAppPage — Preview-based, ~50 lines of logic
// ═══════════════════════════════════════════════════════════════════

export function createAppPage<S>(
  appId: string,
  zoneBindingEntries: Map<string, ZoneBindingEntry>,
  Component?: FC,
): AppPage<S> {
  /** Track keybinding unregister so cleanup() works correctly */
  let unregisterKeybindings: (() => void) | null = null;

  // Override DOM contexts for headless (no DOM, no React)
  os.defineContext("dom-items", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;

    // Headless: getItems() is the single path (state-derived).
    // Zones must register getItems via bind({ getItems }).
    if (entry?.getItems) {
      const items = entry.getItems();
      return entry.itemFilter ? entry.itemFilter(items) : items;
    }
    return [];
  });
  os.defineContext("dom-rects", () => new Map<string, DOMRect>());
  os.defineContext("dom-expandable-items", () => new Set<string>());
  os.defineContext("dom-tree-levels", () => new Map<string, number>());
  os.defineContext("zone-config", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    return entry?.config ?? DEFAULT_CONFIG;
  });
  os.defineContext("dom-zone-order", () => {
    const state = os.getState();
    const entries: Array<ZoneOrderEntry> = [];
    for (const zoneId of ZoneRegistry.keys()) {
      const zoneEntry = ZoneRegistry.get(zoneId);
      if (!zoneEntry) continue;
      const zoneState = state.os.focus.zones[zoneId];
      const entry = zoneEntry.config?.navigate?.entry ?? "first";
      // Items from getItems accessor (single path)
      const items = zoneEntry.getItems?.() ?? [];
      const filtered = zoneEntry.itemFilter
        ? zoneEntry.itemFilter(items)
        : items;
      entries.push({
        zoneId,
        firstItemId: filtered[0] ?? zoneState?.lastFocusedId ?? null,
        lastItemId:
          filtered[filtered.length - 1] ?? zoneState?.lastFocusedId ?? null,
        entry,
        selectedItemId: zoneState?.selection?.[0] ?? null,
        lastFocusedId: zoneState?.lastFocusedId ?? null,
      });
    }
    return entries;
  });

  // Override browser-only effects for headless (no navigator.clipboard)
  os.defineEffect("clipboardWrite", () => { });

  // ── Enter preview sandbox ──
  os.enterPreview({
    ...os.getState(),
    os: { ...initialAppState.os },
  });

  // ── goto ──
  function goto(
    zoneName: string,
    opts?: {
      focusedItemId?: string | null;
      config?: Partial<FocusGroupConfig>;
    },
  ) {
    // Use zoneName directly — matches FocusGroup's id in React.
    // Preview sandbox is isolated per-app, so prefix is unnecessary.

    // Register zone in ZoneRegistry with app callbacks
    const bindingEntry = zoneBindingEntries.get(zoneName);
    if (bindingEntry) {
      const { bindings } = bindingEntry;
      const overrides = { ...bindings.options, ...opts?.config };
      const config = resolveRole(bindingEntry.role, overrides);
      ZoneRegistry.register(zoneName, {
        role: bindingEntry.role,
        config,
        element: null,
        parentId: null,
        ...(bindings.onAction ? { onAction: bindings.onAction } : {}),
        ...(bindings.onCheck ? { onCheck: bindings.onCheck } : {}),
        ...(bindings.onDelete ? { onDelete: bindings.onDelete } : {}),
        ...(bindings.onCopy ? { onCopy: bindings.onCopy } : {}),
        ...(bindings.onCut ? { onCut: bindings.onCut } : {}),
        ...(bindings.onPaste ? { onPaste: bindings.onPaste } : {}),
        ...(bindings.onMoveUp ? { onMoveUp: bindings.onMoveUp } : {}),
        ...(bindings.onMoveDown ? { onMoveDown: bindings.onMoveDown } : {}),
        ...(bindings.onUndo ? { onUndo: bindings.onUndo } : {}),
        ...(bindings.onRedo ? { onRedo: bindings.onRedo } : {}),
        ...(bindings.onSelect ? { onSelect: bindings.onSelect } : {}),
        ...(bindings.itemFilter ? { itemFilter: bindings.itemFilter } : {}),
        ...(bindings.getItems ? { getItems: bindings.getItems } : {}),
        ...(bindings.getExpandableItems
          ? { getExpandableItems: bindings.getExpandableItems }
          : {}),
        ...(bindings.getTreeLevels
          ? { getTreeLevels: bindings.getTreeLevels }
          : {}),
      });

      // Push model: auto-register item-level callbacks from triggers
      // (replaces FocusItem useLayoutEffect pull model for headless)
      if (bindingEntry.triggers) {
        for (const trigger of bindingEntry.triggers) {
          ZoneRegistry.setItemCallback(zoneName, trigger.id, {
            onActivate: trigger.onActivate,
          });
        }
      }
    }

    // Register zone keybindings in the global Keybindings registry
    // (mirrors what FocusGroup.tsx does at mount time in the browser)
    if (unregisterKeybindings) unregisterKeybindings();
    const keybindings = bindingEntry?.keybindings ?? [];
    if (keybindings.length > 0) {
      unregisterKeybindings = Keybindings.registerAll(
        keybindings.map((kb) => ({
          key: kb.key,
          command: kb.command,
          when: "navigating" as const,
        })),
      );
    }

    // Register field in FieldRegistry (mirrors what Field.tsx does at mount time)
    const field = bindingEntry?.field;
    if (field?.fieldName) {
      FieldRegistry.register(field.fieldName, {
        name: field.fieldName,
        ...(field.onCommit !== undefined ? { onCommit: field.onCommit } : {}),
        ...(field.trigger !== undefined ? { trigger: field.trigger } : {}),
        ...(field.schema !== undefined ? { schema: field.schema } : {}),
        ...(field.resetOnSubmit !== undefined
          ? { resetOnSubmit: field.resetOnSubmit }
          : {}),
        mode: "immediate",
        fieldType: "inline",
      });
      // Store fieldId on ZoneEntry for headless field detection
      const zoneEntry = ZoneRegistry.get(zoneName);
      if (zoneEntry) {
        zoneEntry.fieldId = field.fieldName;
      }
    }

    // Set active zone + focused item via setState on preview layer
    const focusedId = opts?.focusedItemId ?? null;
    os.setState((s: AppState) =>
      produce(s, (draft) => {
        draft.os.focus.activeZoneId = zoneName;
        const z = ensureZone(draft.os, zoneName);
        z.focusedItemId = focusedId;
        if (focusedId) z.lastFocusedId = focusedId;
      }),
    );
  }

  // ── Return AppPage ──
  return {
    keyboard: {
      press(key: string) {
        simulateKeyPress(os, key);
      },
      type(text: string) {
        const activeZone = readActiveZoneId(os);
        if (!activeZone) return;
        const zoneEntry = ZoneRegistry.get(activeZone);
        if (zoneEntry?.fieldId) {
          FieldRegistry.updateValue(zoneEntry.fieldId, text);
        }
      },
    },

    click(itemId: string, opts?) {
      simulateClick(os, itemId, opts);
    },

    attrs(itemId: string, zoneId?: string): ItemAttrs {
      return computeAttrs(os, itemId, zoneId);
    },

    goto,

    focusedItemId(zoneId?: string) {
      return readFocusedItemId(os, zoneId);
    },
    selection(zoneId?: string) {
      return readSelection(os, zoneId);
    },
    activeZoneId() {
      return readActiveZoneId(os);
    },

    get state() {
      return os.getState().apps[appId] as S;
    },

    kernel: os,

    dispatch(command: BaseCommand): boolean {
      os.dispatch(command);
      return true;
    },

    reset() {
      // Clear and re-enter preview with fresh state
      os.exitPreview();
      os.enterPreview({
        ...os.getState(),
        os: { ...initialAppState.os },
      });
    },

    cleanup() {
      if (unregisterKeybindings) {
        unregisterKeybindings();
        unregisterKeybindings = null;
      }
      const zId = readActiveZoneId(os);
      if (zId) ZoneRegistry.unregister(zId);
      os.exitPreview();
    },

    // ── Projection Checkpoint ──────────────────────────────────

    query(search: string): boolean {
      if (!Component) {
        throw new Error(
          "query() requires a Component. Use createPage(MyComponent) to enable projection checkpoint.",
        );
      }
      const html = renderToString(createElement(Component));
      return html.includes(search);
    },

    html(): string {
      if (!Component) {
        throw new Error(
          "html() requires a Component. Use createPage(MyComponent) to enable projection checkpoint.",
        );
      }
      return renderToString(createElement(Component));
    },

    locator(elementId: string) {
      return {
        get attrs() { return resolveElement(os, elementId); },
        getAttribute(name: string) {
          return resolveElement(os, elementId)[name];
        },
        click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }) {
          const mods = opts?.modifiers ?? [];
          simulateClick(os, elementId, {
            meta: mods.includes("Meta"),
            shift: mods.includes("Shift"),
            ctrl: mods.includes("Control"),
          });
        },
        toHaveAttribute(name: string, value: string | boolean) {
          return resolveElement(os, elementId)[name] === value;
        },
        toBeFocused() {
          return readFocusedItemId(os) === elementId;
        },
      };
    },
  };
}

export type { ItemAttrs };

import type { AppHandle } from "./defineApp.types";
import { defineApp } from "./defineApp";

import { OS_ESCAPE as prodOS_ESCAPE } from "@os/3-commands/dismiss/escape";
import { OS_EXPAND as prodEXPAND } from "@os/3-commands/expand/index";
import { OS_FIELD_START_EDIT as prodFIELD_START_EDIT } from "@os/3-commands/field/field";
import { OS_FOCUS as prodOS_FOCUS } from "@os/3-commands/focus/focus";
import {
  OS_STACK_POP as prodSTACK_POP,
  OS_STACK_PUSH as prodSTACK_PUSH,
} from "@os/3-commands/focus/stack";
import { OS_SYNC_FOCUS as prodSYNC_FOCUS } from "@os/3-commands/focus/syncFocus";
import { OS_CHECK as prodCHECK } from "@os/3-commands/interaction";
import { OS_ACTIVATE as prodACTIVATE } from "@os/3-commands/interaction/activate";
import { OS_DELETE as prodDELETE } from "@os/3-commands/interaction/delete";
import { OS_NAVIGATE as prodNAVIGATE } from "@os/3-commands/navigate";
import { OS_SELECT as prodOS_SELECT } from "@os/3-commands/selection/select";
import { OS_SELECTION_CLEAR as prodSELECTION_CLEAR } from "@os/3-commands/selection/selection";
import { OS_TAB as prodOS_TAB } from "@os/3-commands/tab/tab";
import { OS_VALUE_CHANGE as prodVALUE_CHANGE } from "@os/3-commands/value";

/** Zone order entry — describes a zone's position and key items for tab navigation */
export interface ZoneOrderEntry {
  zoneId: string;
  firstItemId: string | null;
  lastItemId: string | null;
  entry: import("@os/schemas/focus/config/FocusGroupConfig").NavigateEntry | string;
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

  os.defineEffect("focus", () => { });
  os.defineEffect("scroll", () => { });
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

  os.defineContext("zone-config", () => mockConfig.current);

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
            entry: (ze.config?.navigate?.entry ?? "first") as import("@os/schemas/focus/config/FocusGroupConfig").NavigateEntry,
            selectedItemId: zoneState?.selection?.[0] ?? null,
            lastFocusedId: zoneState?.lastFocusedId ?? null,
          };
        });
    }
    return mockZoneOrder.current;
  });

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
    setItems(items: string[]) { mockItems.current = items; },
    setRects(rects: Map<string, DOMRect>) { mockRects.current = rects; },
    setGrid(opts) {
      const { cols, itemWidth = 100, itemHeight = 40, gap = 0 } = opts;
      const rects = new Map<string, DOMRect>();
      mockItems.current.forEach((id, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        rects.set(
          id,
          new DOMRect(
            col * (itemWidth + gap),
            row * (itemHeight + gap),
            itemWidth,
            itemHeight,
          ),
        );
      });
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
        activate: { ...base.activate, ...config.activate },
        dismiss: { ...base.dismiss, ...config.dismiss },
        project: { ...base.project, ...config.project },
        expand: { ...base.expand, ...config.expand },
        check: { ...base.check, ...config.check },
        value: { ...base.value, ...config.value },
      } as FocusGroupConfig;
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
      mockTreeLevels.current = levels instanceof Map ? levels : new Map(Object.entries(levels));
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
      ZoneRegistry.register(zoneId, {
        ...(existingEntry?.role ? { role: existingEntry.role } : {}),
        config: mockConfig.current,
        element: null,
        parentId: null,
        ...(existingEntry?.getItems ? { getItems: existingEntry.getItems } : {}),
        ...(mockExpandableItems.current.size > 0
          ? { getExpandableItems: () => mockExpandableItems.current }
          : {}),
        ...(existingEntry?.onAction ? { onAction: existingEntry.onAction } : {}),
        ...(existingEntry?.onCheck ? { onCheck: existingEntry.onCheck } : {}),
        ...(existingEntry?.onDelete ? { onDelete: existingEntry.onDelete } : {}),
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
          if (opts?.selection) z.selection = opts.selection;
        }),
      );
      if (opts?.parentId !== undefined) {
        const existing = ZoneRegistry.get(zoneId);
        if (existing) {
          ZoneRegistry.register(zoneId, { ...existing, parentId: opts.parentId });
        }
      }
    },
    setZoneOrder(zones) {
      mockZoneOrder.current = zones;
    },
    zone(zoneId) {
      const id = zoneId ?? readActiveZoneId(os);
      return id ? os.getState().os.focus.zones[id] : undefined;
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
          ...(opts.config.navigate ? { navigate: { ...base.navigate, ...opts.config.navigate } as import("@os/schemas/focus/config/FocusGroupConfig").NavigateConfig } : {}),
          ...(opts.config.tab ? { tab: { ...base.tab, ...opts.config.tab } as Partial<TabConfig> } : {}),
          ...(opts.config.select ? { select: { ...base.select, ...opts.config.select } as Partial<SelectConfig> } : {}),
          ...(opts.config.activate ? { activate: { ...base.activate, ...opts.config.activate } as Partial<ActivateConfig> } : {}),
          ...(opts.config.dismiss ? { dismiss: { ...base.dismiss, ...opts.config.dismiss } as Partial<DismissConfig> } : {}),
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
        ...(opts?.onAction ? { onAction: opts.onAction } : {}),
      }); // Closing brace for ZoneRegistry.register

      const focusedId =
        opts?.focusedItemId !== undefined
          ? opts.focusedItemId
          : (opts?.items?.[0] ?? null);

      let initialSelection: string[] | undefined;
      if (focusedId && mockConfig.current.select?.followFocus) {
        initialSelection = [focusedId];
      }

      basePage.goto(zoneId, {
        focusedItemId: focusedId ?? undefined,
        config: mockConfig.current
      } as Parameters<typeof basePage.goto>[1]);

      if (initialSelection) {
        os.setState((s: AppState) =>
          produce(s, (draft) => {
            const z = ensureZone(draft.os, zoneId);
            z.selection = initialSelection!;
          })
        );
      }
    },

    // Command Exports
    kernel: os,
    dumpDiagnostics() {
      const txs = os.inspector.getTransactions();
      if (txs.length === 0) {
        console.log("[diagnostics] No transactions recorded.");
        return;
      }
      console.log(`[diagnostics] ${txs.length} transaction(s):`);
      for (const tx of txs) {
        const scope = tx.bubblePath?.join(" → ") ?? "unknown";
        console.log(
          `  [${tx.id}] ${tx.command.type} | scope: ${scope} | handler: ${tx.handlerScope}`,
        );
        if (tx.changes && tx.changes.length > 0) {
          for (const change of tx.changes) {
            console.log(
              `    Δ ${change.path}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`,
            );
          }
        }
      }
    },
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
    OS_VALUE_CHANGE: os.register(prodVALUE_CHANGE)
  };
  return result;
}

/**
 * Create a Playwright Page-isomorphic headless integration test interface.
 *
 * Usage:
 *   import { createPage } from "@os/defineApp.page";
 *   const page = createPage(TodoApp);              // headless
 *   const page = createPage(TodoApp, ListView);    // headless + projection
 *
 * createPage is an OS capability — it reads app data(appId, zone bindings)
 * from the AppHandle and sets up the headless test environment.
 */
export function createPage<S>(app: AppHandle<S>, Component?: FC): AppPage<S> {
  return createAppPage<S>(app.__appId, app.__zoneBindings, Component);
}
