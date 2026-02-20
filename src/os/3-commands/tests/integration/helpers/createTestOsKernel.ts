/**
 * createTestOsKernel — Shared headless kernel factory for integration tests.
 *
 * Creates an isolated kernel instance with:
 *   - Real commands via kernel.register() (same handlers as production)
 *   - Mock contexts: dom-items, dom-rects, zone-config, dom-zone-order
 *
 * Usage:
 *   const t = createTestOsKernel();
 *   t.setItems(["a", "b", "c"]);
 *   t.setActiveZone("list", "a");
 *   t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
 *   expect(t.focusedItemId()).toBe("b");
 */

import { createKernel } from "@kernel";
import { ZoneRegistry as ZoneRegistryImport } from "@os/2-contexts/zoneRegistry";
import type { AppState } from "@os/kernel";
import type { FocusGroupConfig } from "@os/schemas/focus/config/FocusGroupConfig";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import { initialOSState, initialZoneState } from "@os/state/initial";
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";

// Production commands — registered on test kernel via kernel.register()
import { OS_FOCUS as prodOS_FOCUS } from "../../../focus/focus";
import { OS_STACK_POP as prodSTACK_POP } from "../../../focus/stack";
import { OS_STACK_PUSH as prodSTACK_PUSH } from "../../../focus/stack";
import { OS_SYNC_FOCUS as prodSYNC_FOCUS } from "../../../focus/syncFocus";
import { OS_RECOVER as prodOS_RECOVER } from "../../../focus/recover";
import { OS_NAVIGATE as prodNAVIGATE } from "../../../navigate";
import { OS_ESCAPE as prodOS_ESCAPE } from "../../../dismiss/escape";
import { OS_SELECT as prodOS_SELECT } from "../../../selection/select";
import { OS_SELECTION_CLEAR as prodSELECTION_CLEAR } from "../../../selection/selection";
import { OS_TAB as prodOS_TAB } from "../../../tab/tab";
import { OS_EXPAND as prodEXPAND } from "../../../expand/index";
import { OS_FIELD_START_EDIT as prodFIELD_START_EDIT } from "../../../field/field";

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

  // ─── No-op effects (suppress "Unknown effect" warnings in headless mode) ───
  kernel.defineEffect("focus", () => { });
  kernel.defineEffect("scroll", () => { });

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
  kernel.defineContext("zone-config", () => mockConfig.current);
  kernel.defineContext("dom-zone-order", () => mockZoneOrder.current);

  // ─── Register production commands (no duplication) ───
  const OS_FOCUS = kernel.register(prodOS_FOCUS);
  const OS_SYNC_FOCUS = kernel.register(prodSYNC_FOCUS);
  const OS_RECOVER = kernel.register(prodOS_RECOVER);
  const OS_SELECT = kernel.register(prodOS_SELECT);
  const OS_SELECTION_CLEAR = kernel.register(prodSELECTION_CLEAR);
  const OS_NAVIGATE = kernel.register(prodNAVIGATE);
  const OS_TAB = kernel.register(prodOS_TAB);
  const OS_ESCAPE = kernel.register(prodOS_ESCAPE);
  const OS_STACK_PUSH = kernel.register(prodSTACK_PUSH);
  const OS_STACK_POP = kernel.register(prodSTACK_POP);
  const OS_EXPAND = kernel.register(prodEXPAND);
  const OS_FIELD_START_EDIT = kernel.register(prodFIELD_START_EDIT);

  // ─── Convenience helpers ───

  function setItems(items: string[]) {
    mockItems.current = items;
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

  return {
    kernel,
    dispatch: kernel.dispatch.bind(kernel),

    // Commands
    OS_FOCUS,
    OS_SYNC_FOCUS,
    OS_RECOVER,
    OS_SELECT,
    OS_NAVIGATE,
    OS_TAB,
    OS_ESCAPE,
    OS_SELECTION_CLEAR,
    OS_STACK_PUSH,
    OS_STACK_POP,
    OS_EXPAND,
    OS_FIELD_START_EDIT,

    // Mock setters
    setItems,
    setRects,
    setZoneOrder,
    setConfig,

    // State helpers
    setActiveZone,
    initZone,

    // State accessors
    state,
    activeZoneId,
    zone,
    focusedItemId,
    selection,
  };
}
