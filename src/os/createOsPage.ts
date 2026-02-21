/**
 * createOsPage — OS-only TestPage factory for headless integration tests.
 *
 * Creates an isolated kernel with OS commands registered.
 * Returns a TestPage-compatible interface for keyboard, mouse, and ARIA testing.
 *
 * Unlike defineApp.createPage() which uses the production kernel + preview,
 * this creates a fresh kernel — ideal for OS-only tests (APG, navigation, etc.)
 * that don't need app commands.
 *
 * Usage:
 *   const page = createOsPage();
 *   page.goto("listbox", { items: ["a", "b", "c"], role: "listbox" });
 *   page.keyboard.press("ArrowDown");
 *   expect(page.focusedItemId()).toBe("b");
 *   expect(page.attrs("b").tabIndex).toBe(0);
 */

import { createKernel } from "@kernel";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import type { ZoneCallback, ZoneCursor } from "@os/2-contexts/zoneRegistry";
import type { AppState } from "@os/kernel";
import { type ZoneRole, getChildRole } from "@os/registries/roleRegistry";
import {
    DEFAULT_CONFIG,
    type FocusGroupConfig,
} from "@os/schemas/focus/config/FocusGroupConfig";
import { initialOSState } from "@os/state/initial";
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";

// ── Shared headless interaction functions ──
import {
    type ItemAttrs,
    simulateKeyPress,
    simulateClick,
    computeAttrs,
    readActiveZoneId,
    readFocusedItemId,
    readSelection,
} from "@os/headless";

// ── Ensure OS keybindings are registered ──
import "@os/keymaps/osDefaults";

// ── Production OS commands (registered on isolated kernel) ──
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

// ═══════════════════════════════════════════════════════════════════
// OsPage Interface
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

export interface OsPage {
    // ── TestPage-compatible interface ──
    keyboard: { press(key: string): void };
    click(itemId: string, opts?: { shift?: boolean; meta?: boolean; ctrl?: boolean; zoneId?: string }): void;
    attrs(itemId: string, zoneId?: string): ItemAttrs;
    goto(zoneId: string, opts?: GotoOptions): void;
    focusedItemId(zoneId?: string): string | null;
    selection(zoneId?: string): string[];
    activeZoneId(): string | null;
    dispatch(cmd: any, opts?: any): void;
    cleanup(): void;

    // ── OS-specific advanced helpers ──
    setItems(items: string[]): void;
    setRects(rects: Map<string, DOMRect>): void;
    setConfig(config: Partial<FocusGroupConfig>): void;
    setRole(zoneId: string, role: ZoneRole, opts?: { onAction?: ZoneCallback; onCheck?: ZoneCallback; onDelete?: ZoneCallback }): void;
    setExpandableItems(items: string[] | Set<string>): void;
    setTreeLevels(levels: Record<string, number> | Map<string, number>): void;
    setActiveZone(zoneId: string, focusedItemId: string | null): void;
    initZone(zoneId: string, opts?: Partial<{ focusedItemId: string; lastFocusedId: string; selection: string[]; parentId: string | null }>): void;
    zone(zoneId?: string): any;
    state(): AppState;
    setZoneOrder(zones: any[]): void;

    // ── Direct kernel access ──
    readonly kernel: ReturnType<typeof createKernel<AppState>>;

    // ── Re-exported command factories (for direct dispatch) ──
    OS_FOCUS: typeof prodOS_FOCUS;
    OS_SYNC_FOCUS: typeof prodSYNC_FOCUS;
    OS_SELECT: typeof prodOS_SELECT;
    OS_NAVIGATE: typeof prodNAVIGATE;
    OS_TAB: typeof prodOS_TAB;
    OS_ESCAPE: typeof prodOS_ESCAPE;
    OS_SELECTION_CLEAR: typeof prodSELECTION_CLEAR;
    OS_STACK_PUSH: typeof prodSTACK_PUSH;
    OS_STACK_POP: typeof prodSTACK_POP;
    OS_EXPAND: typeof prodEXPAND;
    OS_FIELD_START_EDIT: typeof prodFIELD_START_EDIT;
    OS_ACTIVATE: typeof prodACTIVATE;
    OS_CHECK: typeof prodCHECK;
    OS_DELETE: typeof prodDELETE;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createOsPage(overrides?: Partial<AppState>): OsPage {
    const initialState: AppState = {
        os: initialOSState,
        apps: {},
        ...overrides,
    };

    const kernel = createKernel<AppState>(initialState);

    // ── Mutable mock data ──
    const mockItems = { current: [] as string[] };
    const mockRects = { current: new Map<string, DOMRect>() };
    const mockConfig = { current: { ...DEFAULT_CONFIG } as FocusGroupConfig };
    const mockExpandableItems = { current: new Set<string>() };
    const mockTreeLevels = { current: new Map<string, number>() };
    const mockZoneOrder = { current: [] as any[] };

    // ── No-op effects ──
    kernel.defineEffect("focus", () => { });
    kernel.defineEffect("scroll", () => { });

    // ── Mock contexts ──
    kernel.defineContext("dom-items", () => {
        const zoneId = kernel.getState().os.focus.activeZoneId;
        const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
        const items = mockItems.current;
        return entry?.itemFilter ? entry.itemFilter(items) : items;
    });
    kernel.defineContext("dom-rects", () => {
        const zoneId = kernel.getState().os.focus.activeZoneId;
        const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
        const items = entry?.itemFilter
            ? entry.itemFilter(mockItems.current)
            : mockItems.current;
        const rects = mockRects.current;
        if (rects.size > 0) return rects;
        const auto = new Map<string, DOMRect>();
        items.forEach((id, i) => {
            auto.set(id, new DOMRect(0, i * 40, 200, 40));
        });
        return auto;
    });
    kernel.defineContext("zone-config", () => mockConfig.current);
    kernel.defineContext("dom-expandable-items", () => mockExpandableItems.current);
    kernel.defineContext("dom-tree-levels", () => mockTreeLevels.current);
    kernel.defineContext("dom-zone-order", () => mockZoneOrder.current);

    // ── Register OS commands ──
    const OS_FOCUS_CMD = kernel.register(prodOS_FOCUS);
    const OS_SYNC_FOCUS_CMD = kernel.register(prodSYNC_FOCUS);
    const OS_SELECT_CMD = kernel.register(prodOS_SELECT);
    const OS_NAVIGATE_CMD = kernel.register(prodNAVIGATE);
    const OS_TAB_CMD = kernel.register(prodOS_TAB);
    const OS_ESCAPE_CMD = kernel.register(prodOS_ESCAPE);
    const OS_SELECTION_CLEAR_CMD = kernel.register(prodSELECTION_CLEAR);
    const OS_STACK_PUSH_CMD = kernel.register(prodSTACK_PUSH);
    const OS_STACK_POP_CMD = kernel.register(prodSTACK_POP);
    const OS_EXPAND_CMD = kernel.register(prodEXPAND);
    const OS_FIELD_START_EDIT_CMD = kernel.register(prodFIELD_START_EDIT);
    const OS_ACTIVATE_CMD = kernel.register(prodACTIVATE);
    const OS_CHECK_CMD = kernel.register(prodCHECK);
    const OS_DELETE_CMD = kernel.register(prodDELETE);

    // ── Dispatch ──
    const dispatch = kernel.dispatch.bind(kernel);

    // ── Mock setters (OS-specific) ──
    function setItems(items: string[]) { mockItems.current = items; }
    function setRects(rects: Map<string, DOMRect>) { mockRects.current = rects; }
    function setConfig(config: Partial<FocusGroupConfig>) { mockConfig.current = { ...DEFAULT_CONFIG, ...config }; }
    function setExpandableItems(items: string[] | Set<string>) { mockExpandableItems.current = items instanceof Set ? items : new Set(items); }
    function setTreeLevels(levels: Record<string, number> | Map<string, number>) { mockTreeLevels.current = levels instanceof Map ? levels : new Map(Object.entries(levels)); }
    function setZoneOrder(zones: any[]) { mockZoneOrder.current = zones; }

    function setRole(
        zoneId: string,
        role: ZoneRole,
        opts?: { onAction?: ZoneCallback; onCheck?: ZoneCallback; onDelete?: ZoneCallback },
    ) {
        ZoneRegistry.register(zoneId, {
            role,
            config: DEFAULT_CONFIG,
            element: null as unknown as HTMLElement,
            parentId: null,
            ...(opts?.onAction ? { onAction: opts.onAction } : {}),
            ...(opts?.onCheck ? { onCheck: opts.onCheck } : {}),
            ...(opts?.onDelete ? { onDelete: opts.onDelete } : {}),
        });
    }

    function setActiveZone(zoneId: string, focusedItemId: string | null) {
        ZoneRegistry.register(zoneId, {
            role: ZoneRegistry.get(zoneId)?.role,
            config: mockConfig.current,
            element: null as unknown as HTMLElement,
            parentId: null,
        });
        kernel.setState((s: AppState) =>
            produce(s, (draft) => {
                draft.os.focus.activeZoneId = zoneId;
                const z = ensureZone(draft.os, zoneId);
                z.focusedItemId = focusedItemId;
                if (focusedItemId) z.lastFocusedId = focusedItemId;
            }),
        );
    }

    function initZone(
        zoneId: string,
        opts?: Partial<{ focusedItemId: string; lastFocusedId: string; selection: string[]; parentId: string | null }>,
    ) {
        kernel.setState((s: AppState) =>
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
    }

    // ── goto — high-level zone setup ──
    function goto(zoneId: string, opts?: GotoOptions) {
        if (opts?.items) setItems(opts.items);
        if (opts?.config) setConfig({ ...DEFAULT_CONFIG, ...opts.config });

        const role = opts?.role ?? ZoneRegistry.get(zoneId)?.role;
        ZoneRegistry.register(zoneId, {
            ...(role ? { role } : {}),
            config: mockConfig.current,
            element: null as unknown as HTMLElement,
            parentId: null,
            ...(opts?.onAction ? { onAction: opts.onAction } : {}),
            ...(opts?.onCheck ? { onCheck: opts.onCheck } : {}),
            ...(opts?.onDelete ? { onDelete: opts.onDelete } : {}),
        });

        const focusedId = opts?.focusedItemId !== undefined
            ? opts.focusedItemId
            : (opts?.items?.[0] ?? null);
        kernel.setState((s: AppState) =>
            produce(s, (draft) => {
                draft.os.focus.activeZoneId = zoneId;
                const z = ensureZone(draft.os, zoneId);
                if (focusedId) {
                    z.focusedItemId = focusedId;
                    z.lastFocusedId = focusedId;
                }
            }),
        );
    }

    function cleanup() {
        const zId = readActiveZoneId(kernel);
        if (zId) ZoneRegistry.unregister(zId);
    }

    // ── Return OsPage ──
    return {
        // TestPage-compatible
        keyboard: { press(key: string) { simulateKeyPress(kernel, key); } },
        click(itemId, opts?) { simulateClick(kernel, itemId, opts); },
        attrs(itemId, zoneId?) { return computeAttrs(kernel, itemId, zoneId); },
        goto,
        focusedItemId(zoneId?) { return readFocusedItemId(kernel, zoneId); },
        selection(zoneId?) { return readSelection(kernel, zoneId); },
        activeZoneId() { return readActiveZoneId(kernel); },
        dispatch,
        cleanup,

        // OS-specific
        setItems,
        setRects,
        setConfig,
        setRole,
        setExpandableItems,
        setTreeLevels,
        setActiveZone,
        initZone,
        setZoneOrder,
        zone(zoneId?: string) {
            const id = zoneId ?? readActiveZoneId(kernel);
            return id ? kernel.getState().os.focus.zones[id] : undefined;
        },
        state() { return kernel.getState(); },

        // Kernel
        kernel,

        // Command factories
        OS_FOCUS: OS_FOCUS_CMD,
        OS_SYNC_FOCUS: OS_SYNC_FOCUS_CMD,
        OS_SELECT: OS_SELECT_CMD,
        OS_NAVIGATE: OS_NAVIGATE_CMD,
        OS_TAB: OS_TAB_CMD,
        OS_ESCAPE: OS_ESCAPE_CMD,
        OS_SELECTION_CLEAR: OS_SELECTION_CLEAR_CMD,
        OS_STACK_PUSH: OS_STACK_PUSH_CMD,
        OS_STACK_POP: OS_STACK_POP_CMD,
        OS_EXPAND: OS_EXPAND_CMD,
        OS_FIELD_START_EDIT: OS_FIELD_START_EDIT_CMD,
        OS_ACTIVATE: OS_ACTIVATE_CMD,
        OS_CHECK: OS_CHECK_CMD,
        OS_DELETE: OS_DELETE_CMD,
    };
}

export type { ItemAttrs };
