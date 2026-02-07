/**
 * OS Command Core
 * 
 * 순수함수 기반 OS 커맨드 시스템
 * - OSContext: 모든 Read를 미리 수집
 * - OSCommand: 순수함수 (state + dom → result)
 * - OSResult: State 변경 + DOM Effect
 */

import { FocusData } from '../../lib/focusData';
import { DOM } from '../../lib/dom';
import type { FocusGroupConfig } from '../../types';
import type { FocusGroupStore } from '../../store/focusGroupStore';

// ═══════════════════════════════════════════════════════════════════
// Context (모든 Read)
// ═══════════════════════════════════════════════════════════════════

/**
 * Lazy DOM Queries - Dependency Injection interface
 */
export interface DOMQueries {
    getItemRole(id: string): string | null;
    getItemRect(id: string): DOMRect | undefined;
    getGroupRect(id: string): DOMRect | undefined;
    getAllGroupRects(): Map<string, DOMRect>;
    getGroupEntry(id: string): any | undefined;
    getGroupItems(id: string): string[];
}

export interface OSContext {
    // Identity
    zoneId: string;

    // Store State
    focusedItemId: string | null;
    selection: string[];
    selectionAnchor: string | null;
    expandedItems: string[];
    stickyX: number | null;
    stickyY: number | null;

    // Zone Config
    config: FocusGroupConfig;

    // Store (for commit)
    store: FocusGroupStore;

    // Focus Path
    focusPath: string[];
    parentId: string | null;

    // DOM Snapshot
    dom: {
        items: string[];
        itemRects: Map<string, DOMRect>;
        siblingZones: { prev: string | null; next: string | null };
        queries: DOMQueries;
    };

    // Bound Commands
    activateCommand?: any;
    selectCommand?: any;
    toggleCommand?: any;  // Space - checkbox/multi-select toggle
    // Clipboard Commands
    copyCommand?: any;
    cutCommand?: any;
    pasteCommand?: any;
    // Editing Commands
    deleteCommand?: any;
    undoCommand?: any;
    redoCommand?: any;
}

export function buildContext(overrideZoneId?: string): OSContext | null {
    const zoneId = overrideZoneId ?? FocusData.getActiveZoneId();
    if (!zoneId) return null;

    const data = FocusData.getById(zoneId);
    if (!data) return null;

    const state = data.store.getState();
    const el = DOM.getGroup(zoneId);

    return {
        zoneId,

        // Store State
        focusedItemId: state.focusedItemId,
        selection: state.selection,
        selectionAnchor: state.selectionAnchor,
        expandedItems: state.expandedItems,
        stickyX: state.stickyX ?? null,
        stickyY: state.stickyY ?? null,

        // Config
        config: data.config,
        store: data.store,

        // Focus Path
        focusPath: FocusData.getFocusPath(),
        parentId: data.parentId,

        // DOM Snapshot
        dom: {
            items: DOM.getGroupItems(zoneId),
            itemRects: el ? collectItemRects(el) : new Map(),
            siblingZones: {
                prev: FocusData.getSiblingZone('backward'),
                next: FocusData.getSiblingZone('forward'),
            },
            queries: {
                getItemRole: (id) => DOM.getItem(id)?.getAttribute('role') ?? null,
                getItemRect: (id) => DOM.getItem(id)?.getBoundingClientRect(),
                getGroupRect: (id) => DOM.getGroupRect(id),
                getAllGroupRects: () => DOM.getAllGroupRects(),
                getGroupEntry: (id) => FocusData.getById(id),
                getGroupItems: (id) => DOM.getGroupItems(id),
            }
        },

        // Bound Commands
        activateCommand: data.activateCommand,
        selectCommand: data.selectCommand,
        toggleCommand: data.toggleCommand,
        copyCommand: data.copyCommand,
        cutCommand: data.cutCommand,
        pasteCommand: data.pasteCommand,
        deleteCommand: data.deleteCommand,
        undoCommand: data.undoCommand,
        redoCommand: data.redoCommand,
    };
}

function collectItemRects(zoneEl: HTMLElement): Map<string, DOMRect> {
    const rects = new Map<string, DOMRect>();
    const items = zoneEl.querySelectorAll('[data-item-id]');
    items.forEach(item => {
        const id = item.getAttribute('data-item-id');
        if (id) rects.set(id, item.getBoundingClientRect());
    });
    return rects;
}

// ═══════════════════════════════════════════════════════════════════
// Result (State Change + Effects)
// ═══════════════════════════════════════════════════════════════════

export interface OSResult {
    // State Changes (partial update)
    state?: {
        focusedItemId?: string | null;
        selection?: string[];
        selectionAnchor?: string | null;
        expandedItems?: string[];
        stickyX?: number | null;
        stickyY?: number | null;
    };

    // Active Zone Change
    activeZoneId?: string | null;

    // DOM Effects
    domEffects?: DOMEffect[];

    // App Command to dispatch
    dispatch?: any;
}

export type DOMEffect =
    | { type: 'FOCUS'; targetId: string }
    | { type: 'SCROLL_INTO_VIEW'; targetId: string }
    | { type: 'BLUR' };

// ═══════════════════════════════════════════════════════════════════
// Command Type
// ═══════════════════════════════════════════════════════════════════

export interface OSCommand<P = any> {
    run: (ctx: OSContext, payload: P) => OSResult | null;
}

// ═══════════════════════════════════════════════════════════════════
// Executor (Apply Result)
// ═══════════════════════════════════════════════════════════════════

/**
 * Execute an OS command and apply its result.
 * Returns true if the command was actually handled, false if it should passthrough.
 */
export function runOS<P>(command: OSCommand<P>, payload: P, overrideZoneId?: string): boolean {
    // 1. Read
    const ctx = buildContext(overrideZoneId);
    if (!ctx) return false;

    // 2. Pure
    const result = command.run(ctx, payload);
    if (!result) return false;

    // 3. State Write
    if (result.state) {
        ctx.store.setState(result.state);
    }

    // 4. Active Zone
    if (result.activeZoneId !== undefined) {
        FocusData.setActiveZone(result.activeZoneId);
    }

    // 5. DOM Effects
    if (result.domEffects) {
        for (const effect of result.domEffects) {
            executeDOMEffect(effect);
        }
    }

    // 6. App Command
    if (result.dispatch) {
        // Use app dispatch to run reducers, not the event bus
        import('@os/features/command/store/CommandEngineStore').then(({ useCommandEngineStore }) => {
            const dispatch = useCommandEngineStore.getState().getActiveDispatch();
            dispatch?.(result.dispatch);
        });
    }

    return true;
}

function executeDOMEffect(effect: DOMEffect): void {
    switch (effect.type) {
        case 'FOCUS': {
            const el = DOM.getItem(effect.targetId);
            el?.focus();
            break;
        }
        case 'SCROLL_INTO_VIEW': {
            const el = DOM.getItem(effect.targetId);
            el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            break;
        }
        case 'BLUR': {
            (document.activeElement as HTMLElement)?.blur();
            break;
        }
    }
}
