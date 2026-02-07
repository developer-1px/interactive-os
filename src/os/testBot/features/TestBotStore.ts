/**
 * TestBotStore — Global state for the OS TestBot runner
 *
 * Holds the bot instance globally so tests can run regardless of
 * Inspector open/close state. Pages register routes via useTestBotRoutes().
 */

import { testBot } from "./testBot";
import type { TestBot } from "../entities/TestBot";
import type { SuiteResult } from "../entities/SuiteResult";
import { create } from "zustand";

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
    suites: SuiteResult[];
    isRunning: boolean;
    currentSuiteIndex: number;
}

// ═══════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════

export const useTestBotStore = create<TestBotState>(() => ({
    bot: testBot({ speed: DEFAULT_SPEED }),
    routeDefiners: new Map(),
    suites: [],
    isRunning: false,
    currentSuiteIndex: -1,
}));

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Rebuild bot from all registered route definers */
export function rebuildBot(definers: Map<string, RouteDefiner>): TestBot {
    const newBot = testBot({ speed: DEFAULT_SPEED });
    definers.forEach((fn) => fn(newBot));
    return newBot;
}

/** Replace current bot and reset state */
export function swapBot(definers: Map<string, RouteDefiner>) {
    const { bot } = useTestBotStore.getState();
    bot.destroy();
    const newBot = rebuildBot(definers);

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
