/**
 * TestBotStore — Global state for the OS TestBot runner
 *
 * Holds the bot instance globally so tests can run regardless of
 * Inspector open/close state. Pages register routes via useTestBotRoutes().
 */

import { create } from "zustand";
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
  activePageId: string | null; // Track which page is currently active
  suites: SuiteResult[];
  stamps: Stamp[];
  isRunning: boolean;
  currentSuiteIndex: number;
  resetKey: number; // Incremented before each run to force page re-mount
}

// ═══════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════

export const useTestBotStore = create<TestBotState>(() => ({
  bot: testBot({ speed: DEFAULT_SPEED }),
  routeDefiners: new Map(),
  activePageId: null,
  suites: [],
  stamps: [],
  isRunning: false,
  currentSuiteIndex: -1,
  resetKey: 0,
}));

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
  const { routeDefiners } = useTestBotStore.getState();
  const newBot = rebuildBot(routeDefiners, pageId);

  useTestBotStore.setState({
    activePageId: pageId,
    bot: newBot,
    suites: [],
    isRunning: false,
    currentSuiteIndex: -1,
  });

  newBot.dryRun().then((plan) => {
    useTestBotStore.setState({ suites: plan });
  });
}

/** Replace current bot and reset state */
export function swapBot(definers: Map<string, RouteDefiner>) {
  const { bot, activePageId } = useTestBotStore.getState();
  bot.destroy();
  const newBot = rebuildBot(definers, activePageId);

  useTestBotStore.setState({
    routeDefiners: definers,
    bot: newBot,
    suites: [],
    isRunning: false,
    currentSuiteIndex: -1,
  });

  newBot.dryRun().then((plan) => {
    useTestBotStore.setState({ suites: plan });
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
  useTestBotStore.setState((s) => ({ stamps: [...s.stamps, stamp] }));
}

export function removeStamp(id: string) {
  useTestBotStore.setState((s) => ({
    stamps: s.stamps.filter((st) => st.id !== id),
  }));
}

export function clearAllStamps() {
  useTestBotStore.setState({ stamps: [] });
}

export function updateStampPositions() {
  const { stamps } = useTestBotStore.getState();
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

  if (changed) useTestBotStore.setState({ stamps: next });
}
