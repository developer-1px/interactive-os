/**
 * createTestOsKernel — Shared headless kernel factory for integration tests.
 *
 * Creates an isolated kernel instance with:
 *   - Real commands via kernel.register() (same handlers as production)
 *   - Mock contexts: dom-items, dom-rects, zone-config, dom-zone-order
 *   - Input shims: pressKey, click (same as user actions)
 *   - DOM projection: attrs (computes what FocusItem would render)
 *
 * Usage:
 *   const t = createTestOsKernel();
 *   t.setItems(["a", "b", "c"]);
 *   t.setRole("list", "listbox");
 *   t.setActiveZone("list", "a");
 *   t.pressKey("ArrowDown");
 *   expect(t.focusedItemId()).toBe("b");
 */

import { createKernel } from "@kernel";
import {
  type KeyboardInput,
  resolveKeyboard,
} from "@os/1-listeners/keyboard/resolveKeyboard";
import {
  type MouseInput,
  resolveMouse,
} from "@os/1-listeners/mouse/resolveMouse";
import { ZoneRegistry as ZoneRegistryImport } from "@os/2-contexts/zoneRegistry";
import type { AppState } from "@os/kernel";
import {
  getChildRole,
  isCheckedRole,
  isExpandableRole,
  type ZoneRole,
} from "@os/registries/roleRegistry";
import type { FocusGroupConfig } from "@os/schemas/focus/config/FocusGroupConfig";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import { initialOSState, initialZoneState } from "@os/state/initial";
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";

// Ensure OS defaults are registered (keybindings for ArrowDown → OS_NAVIGATE, etc.)
import "@os/keymaps/osDefaults";

import { OS_ESCAPE as prodOS_ESCAPE } from "../../../dismiss/escape";
import { OS_EXPAND as prodEXPAND } from "../../../expand/index";
import { OS_FIELD_START_EDIT as prodFIELD_START_EDIT } from "../../../field/field";
// Production commands — registered on test kernel via kernel.register()
import { OS_FOCUS as prodOS_FOCUS } from "../../../focus/focus";
import { OS_RECOVER as prodOS_RECOVER } from "../../../focus/recover";
import {
  OS_STACK_POP as prodSTACK_POP,
  OS_STACK_PUSH as prodSTACK_PUSH,
} from "../../../focus/stack";
import { OS_SYNC_FOCUS as prodSYNC_FOCUS } from "../../../focus/syncFocus";
import { OS_CHECK as prodCHECK } from "../../../interaction";
import { OS_ACTIVATE as prodACTIVATE } from "../../../interaction/activate";
import { OS_NAVIGATE as prodNAVIGATE } from "../../../navigate";
import { OS_SELECT as prodOS_SELECT } from "../../../selection/select";
import { OS_SELECTION_CLEAR as prodSELECTION_CLEAR } from "../../../selection/selection";
import { OS_TAB as prodOS_TAB } from "../../../tab/tab";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface ZoneOrderEntry {
  zoneId: string;
  firstItemId: string | null;
  lastItemId: string | null;
  entry: "first" | "last" | "restore" | "selected";
  selectedItemId: string | null;
  lastFocusedId: string | null;
}

export interface ItemAttrs {
  role: string | undefined;
  tabIndex: number;
  "aria-selected"?: boolean;
  "aria-checked"?: boolean;
  "aria-expanded"?: boolean;
  "aria-disabled"?: boolean;
  "data-focused"?: true | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createTestOsKernel(overrides?: Partial<AppState>) {
  const initialState: AppState = {
    os: initialOSState,
    apps: {},
    ...overrides,
  };

  const kernel = createKernel<AppState>(initialState);

  // ─── Mutable mock data ───
  const mockItems = { current: [] as string[] };
  const mockRects = { current: new Map<string, DOMRect>() };
  const mockZoneOrder = { current: [] as ZoneOrderEntry[] };
  const mockConfig = { current: { ...DEFAULT_CONFIG } as FocusGroupConfig };
  const mockExpandableItems = { current: new Set<string>() };
  const mockTreeLevels = { current: new Map<string, number>() };

  // ─── No-op effects (suppress "Unknown effect" warnings in headless mode) ───
  kernel.defineEffect("focus", () => {});
  kernel.defineEffect("scroll", () => {});

  // ─── Define contexts with mock providers ───
  kernel.defineContext("dom-items", () => {
    const zoneId = kernel.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistryImport.get(zoneId) : undefined;
    const items = mockItems.current;
    return entry?.itemFilter ? entry.itemFilter(items) : items;
  });
  kernel.defineContext("dom-rects", () => {
    const zoneId = kernel.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistryImport.get(zoneId) : undefined;
    if (!entry?.itemFilter) return mockRects.current;
    const allowedIds = new Set(
      entry.itemFilter(Array.from(mockRects.current.keys())),
    );
    const filtered = new Map<string, DOMRect>();
    for (const [id, rect] of mockRects.current) {
      if (allowedIds.has(id)) filtered.set(id, rect);
    }
    return filtered;
  });
  kernel.defineContext(
    "dom-expandable-items",
    () => mockExpandableItems.current,
  );
  kernel.defineContext("dom-tree-levels", () => mockTreeLevels.current);
  kernel.defineContext("zone-config", () => mockConfig.current);
  kernel.defineContext("dom-zone-order", () => mockZoneOrder.current);

  // ─── Register production commands (no duplication) ───
  const OS_FOCUS_CMD = kernel.register(prodOS_FOCUS);
  const OS_SYNC_FOCUS = kernel.register(prodSYNC_FOCUS);
  const OS_RECOVER = kernel.register(prodOS_RECOVER);
  const OS_SELECT_CMD = kernel.register(prodOS_SELECT);
  const OS_SELECTION_CLEAR = kernel.register(prodSELECTION_CLEAR);
  const OS_NAVIGATE = kernel.register(prodNAVIGATE);
  const OS_TAB = kernel.register(prodOS_TAB);
  const OS_ESCAPE = kernel.register(prodOS_ESCAPE);
  const OS_STACK_PUSH = kernel.register(prodSTACK_PUSH);
  const OS_STACK_POP = kernel.register(prodSTACK_POP);
  const OS_EXPAND = kernel.register(prodEXPAND);
  const OS_FIELD_START_EDIT = kernel.register(prodFIELD_START_EDIT);
  const OS_ACTIVATE_CMD = kernel.register(prodACTIVATE);
  const OS_CHECK_CMD = kernel.register(prodCHECK);

  // ─── Convenience helpers ───

  function setItems(items: string[]) {
    mockItems.current = items;
  }

  function setExpandableItems(items: string[]) {
    mockExpandableItems.current = new Set(items);
  }

  function setTreeLevels(levels: Record<string, number>) {
    mockTreeLevels.current = new Map(Object.entries(levels));
  }

  function setRects(rects: Map<string, DOMRect>) {
    mockRects.current = rects;
  }

  function setZoneOrder(zones: ZoneOrderEntry[]) {
    mockZoneOrder.current = zones;
  }

  function setConfig(config: Partial<FocusGroupConfig>) {
    mockConfig.current = { ...DEFAULT_CONFIG, ...config };
  }

  function setActiveZone(zoneId: string, focusedItemId: string | null) {
    kernel.setState((s) =>
      produce(s, (draft) => {
        draft.os.focus.activeZoneId = zoneId;
        const z = ensureZone(draft.os, zoneId);
        z.focusedItemId = focusedItemId;
        if (focusedItemId) z.lastFocusedId = focusedItemId;
      }),
    );
  }

  function initZone(zoneId: string) {
    kernel.setState((s) =>
      produce(s, (draft) => {
        if (!draft.os.focus.zones[zoneId]) {
          draft.os.focus.zones[zoneId] = { ...initialZoneState };
        }
      }),
    );
  }

  // ─── State accessors ───

  const state = () => kernel.getState();
  const osState = () => state().os.focus;
  const activeZoneId = () => osState().activeZoneId;
  const zone = (id?: string) => {
    const zId = id ?? activeZoneId();
    return zId ? osState().zones[zId] : undefined;
  };
  const focusedItemId = (zoneId?: string) =>
    zone(zoneId)?.focusedItemId ?? null;
  const selection = (zoneId?: string) => zone(zoneId)?.selection ?? [];

  // ─── Role Registration ───

  function setRole(
    zoneId: string,
    role: ZoneRole,
    opts?: { onAction?: (cursor: any) => any; onCheck?: (cursor: any) => any },
  ) {
    ZoneRegistryImport.register(zoneId, {
      role,
      config: DEFAULT_CONFIG,
      element: null as unknown as HTMLElement, // headless — no DOM
      parentId: null,
      ...opts,
    });
  }

  // ─── Zone helpers ───

  function getZoneEntry(zoneId?: string) {
    const id = zoneId ?? activeZoneId();
    return id ? ZoneRegistryImport.get(id) : undefined;
  }

  function getChildRoleForZone(zoneId?: string): string | undefined {
    const entry = getZoneEntry(zoneId);
    return entry?.role ? getChildRole(entry.role) : undefined;
  }

  // ─── Input Shims ───

  const dispatch = kernel.dispatch.bind(kernel);
  const baseRef = () => ({
    dispatch,
    state,
    activeZoneId,
    zone,
    focusedItemId,
    selection,
  });

  /**
   * Simulate a keyboard press. Derives KeyboardInput from kernel state,
   * runs resolveKeyboard, and dispatches the result.
   */
  function pressKey(key: string) {
    const z = zone();
    const entry = getZoneEntry();
    const childRole = getChildRoleForZone();

    const input: KeyboardInput = {
      canonicalKey: key,
      key,
      isEditing: false,
      isFieldActive: false,
      isComposing: false,
      isDefaultPrevented: false,
      isInspector: false,
      isCombobox: false,
      focusedItemRole: childRole ?? null,
      focusedItemId: z?.focusedItemId ?? null,
      activeZoneHasCheck: !!entry?.onCheck,
      activeZoneFocusedItemId: z?.focusedItemId ?? null,
      elementId: z?.focusedItemId ?? undefined,
      cursor: z?.focusedItemId
        ? {
            focusId: z.focusedItemId,
            selection: z.selection ?? [],
            anchor: z.selectionAnchor ?? null,
          }
        : null,
    };

    const result = resolveKeyboard(input);
    executeKeyboardResult(result, baseRef());
  }

  /**
   * Simulate a mouse click on an item. Derives MouseInput from kernel state,
   * runs resolveMouse, and dispatches the result.
   */
  function click(
    itemId: string,
    opts?: { shift?: boolean; meta?: boolean; ctrl?: boolean; zoneId?: string },
  ) {
    const zoneId = opts?.zoneId ?? activeZoneId();
    if (!zoneId) return;
    const childRole = getChildRoleForZone(zoneId);
    const expandable = childRole ? isExpandableRole(childRole) : false;

    const input: MouseInput = {
      targetItemId: itemId,
      targetGroupId: zoneId,
      shiftKey: opts?.shift ?? false,
      metaKey: opts?.meta ?? false,
      ctrlKey: opts?.ctrl ?? false,
      altKey: false,
      isLabel: false,
      labelTargetItemId: null,
      labelTargetGroupId: null,
      hasAriaExpanded: expandable,
      itemRole: childRole ?? null,
    };

    const result = resolveMouse(input);
    executeMouseResult(result, baseRef());
  }

  // ─── DOM Projection ───

  /**
   * Returns the DOM attributes that FocusItem would project for this item.
   * Pure computation from kernel state — no React.
   */
  function attrs(itemId: string, zoneId?: string): ItemAttrs {
    const id = zoneId ?? activeZoneId();
    if (!id) {
      return { role: undefined, tabIndex: -1 };
    }

    const s = state();
    const z = s.os.focus.zones[id];
    const entry = getZoneEntry(id);
    const childRole = entry?.role ? getChildRole(entry.role) : undefined;
    const expandable = childRole ? isExpandableRole(childRole) : false;
    const useChecked = childRole ? isCheckedRole(childRole) : false;

    const isFocused = z?.focusedItemId === itemId;
    const isActiveZone = s.os.focus.activeZoneId === id;
    const isSelected = z?.selection.includes(itemId) ?? false;
    const isExpanded = z?.expandedItems.includes(itemId) ?? false;
    const isDisabled = ZoneRegistryImport.isDisabled(id, itemId);

    const result: ItemAttrs = {
      role: childRole,
      tabIndex: isFocused ? 0 : -1,
      "data-focused": (isFocused && isActiveZone) || undefined,
    };

    if (useChecked) {
      result["aria-checked"] = isSelected;
    } else {
      result["aria-selected"] = isSelected;
    }

    if (expandable) {
      result["aria-expanded"] = isExpanded;
    }

    if (isDisabled) {
      result["aria-disabled"] = true;
    }

    return result;
  }

  // ─── Cleanup ───

  function cleanup() {
    const zId = activeZoneId();
    if (zId) ZoneRegistryImport.unregister(zId);
  }

  return {
    kernel,
    dispatch,

    // Commands
    OS_FOCUS: OS_FOCUS_CMD,
    OS_SYNC_FOCUS,
    OS_RECOVER,
    OS_SELECT: OS_SELECT_CMD,
    OS_NAVIGATE,
    OS_TAB,
    OS_ESCAPE,
    OS_SELECTION_CLEAR,
    OS_STACK_PUSH,
    OS_STACK_POP,
    OS_EXPAND,
    OS_FIELD_START_EDIT,
    OS_ACTIVATE: OS_ACTIVATE_CMD,
    OS_CHECK: OS_CHECK_CMD,

    // Mock setters
    setItems,
    setRects,
    setZoneOrder,
    setConfig,
    setRole,
    setExpandableItems,
    setTreeLevels,

    // State helpers
    setActiveZone,
    initZone,

    // Input shims
    pressKey,
    click,

    // DOM projection
    attrs,

    // State accessors
    state,
    activeZoneId,
    zone,
    focusedItemId,
    selection,

    // Cleanup
    cleanup,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Dispatch Pipeline (mirrors actual Listener dispatch logic)
// ═══════════════════════════════════════════════════════════════════

type BaseRef = {
  dispatch: (...args: any[]) => any;
  state: () => AppState;
  activeZoneId: () => string | null;
  zone: (id?: string) => any;
  focusedItemId: (zoneId?: string) => string | null;
  selection: (zoneId?: string) => string[];
};

function executeKeyboardResult(
  result: ReturnType<typeof resolveKeyboard>,
  base: BaseRef,
) {
  if (result.commands.length > 0) {
    for (const cmd of result.commands) {
      const opts = result.meta ? { meta: { input: result.meta } } : undefined;
      base.dispatch(cmd, opts);
    }
  }
}

function executeMouseResult(
  result: ReturnType<typeof resolveMouse>,
  base: BaseRef,
) {
  if (result.commands.length > 0) {
    for (const cmd of result.commands) {
      const opts = result.meta ? { meta: result.meta } : undefined;
      base.dispatch(cmd, opts);
    }
  }
}
