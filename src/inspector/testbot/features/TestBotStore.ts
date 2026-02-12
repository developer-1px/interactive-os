/**
 * TestBotStore — Global state for the OS TestBot runner
 *
 * Holds the bot instance globally so tests can run regardless of
 * Inspector open/close state. Pages register routes via useTestBotRoutes().
 */

import { useSyncExternalStore } from "react";
import type { BubbleVariant } from "../entities/BotCursor";
import type {
  CursorBubble,
  CursorRipple,
  CursorState,
} from "../entities/CursorState";
import type { Stamp } from "../entities/Stamp";
import type { SuiteResult } from "../entities/SuiteResult";
import type { TestBot } from "../entities/TestBot";
import { testBot } from "./testBot";

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_SPEED = 2.0;

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type RouteDefiner = (bot: TestBot) => void;

interface TestBotState {
  bot: TestBot;
  routeDefiners: Map<string, RouteDefiner>;
  activePageId: string | null;
  suites: SuiteResult[];
  stamps: Stamp[];
  cursorState: CursorState | null;
  isRunning: boolean;
  currentSuiteIndex: number;
  resetKey: number;
}

// ═══════════════════════════════════════════════════════════════════
// Vanilla Store
// ═══════════════════════════════════════════════════════════════════

let state: TestBotState = {
  bot: testBot({ speed: DEFAULT_SPEED }),
  routeDefiners: new Map(),
  activePageId: null,
  suites: [],
  stamps: [],
  cursorState: null,
  isRunning: false,
  currentSuiteIndex: -1,
  resetKey: 0,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return state;
}

function setState(
  partial: Partial<TestBotState> | ((s: TestBotState) => Partial<TestBotState>),
) {
  const next = typeof partial === "function" ? partial(state) : partial;
  state = { ...state, ...next };
  emit();
}

function getState() {
  return state;
}

// ─── React Hook ───

export function useTestBotStore<T>(selector: (s: TestBotState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
}

// Compat: static getState/setState for action functions
useTestBotStore.getState = getState;
useTestBotStore.setState = setState;

// Compat: Zustand-style subscribe(listener) where listener receives (state, prevState)
useTestBotStore.subscribe = (
  listener: (state: TestBotState, prev: TestBotState) => void,
) => {
  let prev = getState();
  return subscribe(() => {
    const next = getState();
    listener(next, prev);
    prev = next;
  });
};

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Rebuild bot from all registered route definers, optionally filtered by pageId */
export function rebuildBot(
  definers: Map<string, RouteDefiner>,
  pageId?: string | null,
): TestBot {
  const newBot = testBot({ speed: DEFAULT_SPEED });

  if (pageId) {
    // Only register tests for the active page
    const definer = definers.get(pageId);
    if (definer) definer(newBot);
  } else {
    // No active page - register all routes (fallback)
    definers.forEach((fn) => {
      fn(newBot);
    });
  }

  return newBot;
}

/** Set the active page and rebuild bot to show only that page's tests */
export function setActivePage(pageId: string | null) {
  const { routeDefiners } = getState();
  const newBot = rebuildBot(routeDefiners, pageId);

  setState({
    activePageId: pageId,
    bot: newBot,
    suites: [],
    isRunning: false,
    currentSuiteIndex: -1,
  });

  newBot.dryRun().then((plan) => {
    setState({ suites: plan });
  });
}

/** Replace current bot and reset state */
export function swapBot(definers: Map<string, RouteDefiner>) {
  const { bot, activePageId } = getState();
  bot.destroy();
  const newBot = rebuildBot(definers, activePageId);

  setState({
    routeDefiners: definers,
    bot: newBot,
    suites: [],
    isRunning: false,
    currentSuiteIndex: -1,
  });

  newBot.dryRun().then((plan) => {
    setState({ suites: plan });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Stamp Actions
// ═══════════════════════════════════════════════════════════════════

let stampCounter = 0;

export function addStamp(type: "pass" | "fail", el: Element, selector: string) {
  const rect = el.getBoundingClientRect();
  const stamp: Stamp = {
    id: `stamp-${++stampCounter}`,
    type,
    el,
    selector,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    rotation: Math.random() * 10 - 5 + (type === "fail" ? 5 : -5),
    createdAt: Date.now(),
  };
  setState((s) => ({ stamps: [...s.stamps, stamp] }));
}

export function removeStamp(id: string) {
  setState((s) => ({
    stamps: s.stamps.filter((st) => st.id !== id),
  }));
}

export function clearAllStamps() {
  setState({ stamps: [] });
}

export function updateStampPositions() {
  const { stamps } = getState();
  if (stamps.length === 0) return;

  let changed = false;
  const next = stamps.map((stamp) => {
    // Try direct element ref first, fallback to selector
    let el = stamp.el.isConnected ? stamp.el : null;
    if (!el) {
      el = document.querySelector(stamp.selector);
    }
    if (!el) return stamp; // Element gone — keep last position

    const rect = el.getBoundingClientRect();
    const nx = rect.left + rect.width / 2;
    const ny = rect.top + rect.height / 2;

    if (Math.abs(nx - stamp.x) > 0.5 || Math.abs(ny - stamp.y) > 0.5) {
      changed = true;
      return { ...stamp, el, x: nx, y: ny };
    }
    return stamp.el !== el ? { ...stamp, el } : stamp;
  });

  if (changed) setState({ stamps: next });
}

// ═══════════════════════════════════════════════════════════════════
// Cursor Actions
// ═══════════════════════════════════════════════════════════════════

let bubbleCounter = 0;
let rippleCounter = 0;

export function showCursor() {
  const cur = getState().cursorState;
  if (cur) {
    setState({ cursorState: { ...cur, visible: true } });
  } else {
    setState({
      cursorState: {
        visible: true,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        transitionMs: 300,
        offScreen: false,
        offScreenRotation: 0,
        bubbles: [],
        ripples: [],
        trackedEl: null,
      },
    });
  }
}

export function hideCursor() {
  setState({ cursorState: null });
}

export function setCursorState(partial: Partial<CursorState>) {
  const cur = getState().cursorState;
  if (!cur) return;
  setState({ cursorState: { ...cur, ...partial } });
}

export function addCursorBubble(label: string, variant: BubbleVariant) {
  const cur = getState().cursorState;
  if (!cur) return;
  const bubble: CursorBubble = {
    id: `bubble-${++bubbleCounter}`,
    label,
    variant,
    createdAt: Date.now(),
  };
  const next = [...cur.bubbles, bubble];
  // Cap at 3 visible bubbles
  const capped = next.length > 3 ? next.slice(next.length - 3) : next;
  setState({ cursorState: { ...cur, bubbles: capped } });
}

export function removeCursorBubble(id: string) {
  const cur = getState().cursorState;
  if (!cur) return;
  setState({
    cursorState: { ...cur, bubbles: cur.bubbles.filter((b) => b.id !== id) },
  });
}

export function clearCursorBubbles() {
  const cur = getState().cursorState;
  if (!cur) return;
  setState({ cursorState: { ...cur, bubbles: [] } });
}

export function addCursorRipple(x: number, y: number) {
  const cur = getState().cursorState;
  if (!cur) return;
  const ripple: CursorRipple = {
    id: `ripple-${++rippleCounter}`,
    x,
    y,
    createdAt: Date.now(),
  };
  setState({
    cursorState: { ...cur, ripples: [...cur.ripples, ripple] },
  });
}

export function removeCursorRipple(id: string) {
  const cur = getState().cursorState;
  if (!cur) return;
  setState({
    cursorState: { ...cur, ripples: cur.ripples.filter((r) => r.id !== id) },
  });
}

/** Update cursor position from tracked element */
export function updateCursorFromTrackedEl() {
  const cur = getState().cursorState;
  if (!cur?.trackedEl || !cur.visible) return;

  const el = cur.trackedEl;
  if (!el.isConnected) return;

  const rect = el.getBoundingClientRect();
  const nx = rect.left + rect.width / 2;
  const ny = rect.top + rect.height / 2;

  if (Math.abs(nx - cur.x) > 2 || Math.abs(ny - cur.y) > 2) {
    setState({
      cursorState: { ...cur, x: nx, y: ny, transitionMs: 300 },
    });
  }
}
