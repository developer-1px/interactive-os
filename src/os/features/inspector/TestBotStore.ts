/**
 * TestBotStore — Global state for the OS TestBot runner
 *
 * Holds the bot instance globally so tests can run regardless of
 * Inspector open/close state. Pages register routes via useTestBotRoutes().
 */

import { testBot, type SuiteResult, type TestBot } from "@os/lib/testBot";
import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

type RouteDefiner = (bot: TestBot) => void;

interface TestBotState {
    /** Current bot instance */
    bot: TestBot;
    /** Registered route definers from pages */
    routeDefiners: Map<string, RouteDefiner>;
    /** Test results */
    results: SuiteResult[];
    /** Is the bot currently running? */
    isRunning: boolean;
    /** Current suite name being executed */
    currentSuite: string;
}

// ═══════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════

export const useTestBotStore = create<TestBotState>(() => ({
    bot: testBot({ speed: 2.0 }),
    routeDefiners: new Map(),
    results: [],
    isRunning: false,
    currentSuite: "",
}));

// ═══════════════════════════════════════════════════════════════════
// Actions (static, callable from anywhere)
// ═══════════════════════════════════════════════════════════════════

export const TestBotActions = {
    /**
     * Register test routes for a page.
     * Called from useTestBotRoutes() hook in page components.
     * Each registration rebuilds the bot with all accumulated routes.
     */
    register(pageId: string, definer: RouteDefiner) {
        const state = useTestBotStore.getState();
        const next = new Map(state.routeDefiners);
        next.set(pageId, definer);

        // Rebuild bot with ALL registered routes
        const newBot = testBot({ speed: 2.0 });
        next.forEach((fn) => fn(newBot));

        // Destroy old bot cursor
        state.bot.destroy();

        useTestBotStore.setState({
            routeDefiners: next,
            bot: newBot,
            results: [],
        });
    },

    /**
     * Unregister test routes (when page unmounts).
     */
    unregister(pageId: string) {
        const state = useTestBotStore.getState();
        const next = new Map(state.routeDefiners);
        next.delete(pageId);

        // Rebuild bot without the removed routes
        const newBot = testBot({ speed: 2.0 });
        next.forEach((fn) => fn(newBot));

        state.bot.destroy();

        useTestBotStore.setState({
            routeDefiners: next,
            bot: newBot,
            results: [],
        });
    },

    /**
     * Run all registered tests.
     * Works regardless of Inspector state — dispatches real DOM events.
     */
    async runAll() {
        const { bot, isRunning } = useTestBotStore.getState();
        if (isRunning) return;

        useTestBotStore.setState({ isRunning: true, results: [], currentSuite: "Starting..." });

        const finalResults = await bot.runAll((progress) => {
            useTestBotStore.setState({
                results: [...progress],
                currentSuite: progress[progress.length - 1]?.name ?? "",
            });
        });

        useTestBotStore.setState({
            results: finalResults,
            isRunning: false,
            currentSuite: "",
        });
    },

    /**
     * Stop the currently running test.
     */
    stop() {
        const { bot } = useTestBotStore.getState();
        bot.destroy();

        // Rebuild bot (destroy clears internal state)
        const state = useTestBotStore.getState();
        const newBot = testBot({ speed: 2.0 });
        state.routeDefiners.forEach((fn) => fn(newBot));

        useTestBotStore.setState({
            bot: newBot,
            isRunning: false,
            currentSuite: "",
        });
    },
};
