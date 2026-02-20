/**
 * createTestKernel — Shared headless kernel factory for integration tests.
 *
 * Creates an isolated kernel instance with:
 *   - Real commands via kernel.register() (same handlers as production)
 *   - Mock contexts: dom-items, dom-rects, zone-config, dom-zone-order
 *
 * Usage:
 *   const t = createTestKernel();
 *   t.setItems(["a", "b", "c"]);
 *   t.setActiveZone("list", "a");
 *   t.dispatch(t.NAVIGATE({ direction: "down" }));
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
import { FOCUS as prodFOCUS } from "../../../focus/focus";
import { STACK_POP as prodSTACK_POP } from "../../../focus/stack";
import { STACK_PUSH as prodSTACK_PUSH } from "../../../focus/stack";
import { SYNC_FOCUS as prodSYNC_FOCUS } from "../../../focus/syncFocus";
import { RECOVER as prodRECOVER } from "../../../focus/recover";
import { NAVIGATE as prodNAVIGATE } from "../../../navigate";
import { ESCAPE as prodESCAPE } from "../../../dismiss/escape";
import { SELECT as prodSELECT } from "../../../selection/select";
import { SELECTION_CLEAR as prodSELECTION_CLEAR } from "../../../selection/selection";
import { TAB as prodTAB } from "../../../tab/tab";

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

export function createTestKernel(overrides?: Partial<AppState>) {
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
  const FOCUS = kernel.register(prodFOCUS);
  const SYNC_FOCUS = kernel.register(prodSYNC_FOCUS);
  const RECOVER = kernel.register(prodRECOVER);
  const SELECT = kernel.register(prodSELECT);
  const SELECTION_CLEAR = kernel.register(prodSELECTION_CLEAR);
  const NAVIGATE = kernel.register(prodNAVIGATE);
  const TAB = kernel.register(prodTAB);
  const ESCAPE = kernel.register(prodESCAPE);
  const STACK_PUSH = kernel.register(prodSTACK_PUSH);
  const STACK_POP = kernel.register(prodSTACK_POP);

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
    FOCUS,
    SYNC_FOCUS,
    RECOVER,
    SELECT,
    NAVIGATE,
    TAB,
    ESCAPE,
    SELECTION_CLEAR,
    STACK_PUSH,
    STACK_POP,

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
