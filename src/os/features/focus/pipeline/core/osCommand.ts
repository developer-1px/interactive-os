/**
 * OS Command Core
 *
 * 순수함수 기반 OS 커맨드 시스템
 * - OSContext: 모든 Read를 미리 수집
 * - OSCommand: 순수함수 (state + dom → result)
 * - OSResult: State 변경 + DOM Effect
 */

import { createFocusEffect } from "@os/schema";
import type { EffectRecord, InputSource as SchemaInputSource, TransactionInput } from "@os/schema";
import { DOM } from "../../lib/dom";
import { FocusData } from "../../lib/focusData";
import type { FocusGroupStore } from "../../store/focusGroupStore";
import type { FocusGroupConfig } from "../../types";

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
  getGroupParentId(id: string): string | null;
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
  recoveryTargetId: string | null;

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
  toggleCommand?: any; // Space - checkbox/multi-select toggle
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
    recoveryTargetId: state.recoveryTargetId ?? null,

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
        prev: FocusData.getSiblingZone("backward"),
        next: FocusData.getSiblingZone("forward"),
      },
      queries: {
        getItemRole: (id) => DOM.getItem(id)?.getAttribute("role") ?? null,
        getItemRect: (id) => DOM.getItem(id)?.getBoundingClientRect(),
        getGroupRect: (id) => DOM.getGroupRect(id),
        getAllGroupRects: () => DOM.getAllGroupRects(),
        getGroupEntry: (id) => FocusData.getById(id),
        getGroupItems: (id) => DOM.getGroupItems(id),
        getGroupParentId: (id) => FocusData.getById(id)?.parentId ?? null,
      },
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
  const items = zoneEl.querySelectorAll("[data-item-id]");
  items.forEach((item) => {
    const id = item.getAttribute("data-item-id");
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
    recoveryTargetId?: string | null;
  };

  // Active Zone Change
  activeZoneId?: string | null;

  // DOM Effects
  domEffects?: DOMEffect[];

  // App Command to dispatch
  dispatch?: any;
}

export type DOMEffect =
  | { type: "FOCUS"; targetId: string }
  | { type: "SCROLL_INTO_VIEW"; targetId: string }
  | { type: "CLICK"; targetId: string }
  | { type: "BLUR" };

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
// Re-entrance guard: prevents infinite loops from
// runOS → el.focus() → focusin → dispatch → runOS cycles
let _isRunning = false;
let _callCount = 0;
let _callResetTimer: ReturnType<typeof setTimeout> | null = null;

export function isOSCommandRunning(): boolean {
  return _isRunning;
}

// ═══════════════════════════════════════════════════════════════════
// Ambient Context — Input Tracking + Effect Collection
// ═══════════════════════════════════════════════════════════════════

let _currentInput: Event | null = null;

export type InputSource = "mouse" | "keyboard" | "programmatic";
let _lastInputSource: InputSource = "programmatic";

/** Collected effects during runOS execution */
let _collectedEffects: EffectRecord[] = [];

/** Pending input info for transaction building */
let _pendingInput: TransactionInput | null = null;

/**
 * Set the current input event before dispatching a command.
 * Captures input info for transaction building.
 */
export function setCurrentInput(event: Event): void {
  _currentInput = event;
  if (event instanceof MouseEvent) {
    _lastInputSource = "mouse";
    _pendingInput = { source: "mouse", raw: event.type };
  } else if (event instanceof KeyboardEvent) {
    _lastInputSource = "keyboard";
    _pendingInput = { source: "keyboard", raw: event.key };
  } else {
    _pendingInput = { source: "programmatic", raw: event.type };
  }
}

/** Get the last input source. */
export function getLastInputSource(): InputSource {
  return _lastInputSource;
}

/** Consume input info for transaction building. Returns input and clears it. */
export function consumeInputInfo(): TransactionInput {
  const info = _pendingInput ?? { source: "programmatic" as const, raw: "system" };
  _pendingInput = null;
  _currentInput = null;
  return info;
}

/** Get collected effects and reset. Called after runOS completes. */
export function consumeCollectedEffects(): EffectRecord[] {
  const effects = _collectedEffects;
  _collectedEffects = [];
  return effects;
}


export function runOS<P>(
  command: OSCommand<P>,
  payload: P,
  overrideZoneId?: string,
): boolean {
  // Loop detection: if called more than 50 times in 500ms, something is wrong
  _callCount++;
  if (!_callResetTimer) {
    _callResetTimer = setTimeout(() => {
      _callCount = 0;
      _callResetTimer = null;
    }, 500);
  }
  if (_callCount > 50) {
    console.error(
      "[runOS] 🔴 Excessive calls detected!",
      _callCount,
      "payload:",
      payload,
    );
    return false;
  }

  // Re-entrance guard
  if (_isRunning) {
    console.warn("[runOS] ⚠️ Re-entrance blocked, payload:", payload);
    return false;
  }

  // 1. Read
  const ctx = buildContext(overrideZoneId);
  if (!ctx) return false;

  _isRunning = true;
  try {
    // 2. Pure
    const result = command.run(ctx, payload);
    if (!result) return false;

    // 3. State Write
    if (result.state) {
      // Auto-compute recovery target when focus changes
      if (result.state.focusedItemId) {
        const newFocusId = result.state.focusedItemId;
        const items = ctx.dom.items;
        const strategy = ctx.config.navigate.recovery; // default is 'next'
        const idx = items.indexOf(newFocusId);

        if (idx !== -1) {
          const next = items[idx + 1] ?? null;
          const prev = items[idx - 1] ?? null;

          // Pre-compute recovery target based on strategy
          result.state.recoveryTargetId =
            strategy === "prev"
              ? (prev ?? next)
              : strategy === "nearest"
                ? (next ?? prev)
                : (next ?? prev); // default 'next'
        }
      }

      // STATE logging removed — captured by Transaction snapshot + diff

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
      import("@os/features/command/store/CommandEngineStore").then(
        ({ useCommandEngineStore }) => {
          const dispatch = useCommandEngineStore.getState().getActiveDispatch();
          dispatch?.(result.dispatch);
        },
      );
    }

    return true;
  } finally {
    _isRunning = false;
  }
}

function executeDOMEffect(effect: DOMEffect): void {
  switch (effect.type) {
    case "FOCUS": {
      const el = DOM.getItem(effect.targetId);
      if (el) {
        el.focus({ preventScroll: true });
        _collectedEffects.push(
          createFocusEffect("focus", effect.targetId, true),
        );

        const shouldScroll = _lastInputSource !== "mouse";
        if (shouldScroll) {
          el.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
        _collectedEffects.push(
          createFocusEffect(
            "scrollIntoView",
            effect.targetId,
            shouldScroll,
            shouldScroll ? undefined : "mouse_input",
          ),
        );
      } else {
        _collectedEffects.push(
          createFocusEffect("focus", effect.targetId, false, "element_not_found"),
        );
      }
      break;
    }
    case "SCROLL_INTO_VIEW": {
      const el = DOM.getItem(effect.targetId);
      const shouldScroll = _lastInputSource !== "mouse";
      if (shouldScroll && el) {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      _collectedEffects.push(
        createFocusEffect(
          "scrollIntoView",
          effect.targetId,
          shouldScroll && !!el,
          !shouldScroll ? "mouse_input" : !el ? "element_not_found" : undefined,
        ),
      );
      break;
    }
    case "BLUR": {
      (document.activeElement as HTMLElement)?.blur();
      _collectedEffects.push(createFocusEffect("blur", null, true));
      break;
    }
    case "CLICK": {
      const el = DOM.getItem(effect.targetId);
      if (el) {
        el.click();
        _collectedEffects.push(
          createFocusEffect("click", effect.targetId, true),
        );
      } else {
        _collectedEffects.push(
          createFocusEffect("click", effect.targetId, false, "element_not_found"),
        );
      }
      break;
    }
  }
}
