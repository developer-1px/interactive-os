/**
 * TestBotStore — Global state for the OS TestBot runner
 *
 * Holds the bot instance globally so tests can run regardless of
 * Inspector open/close state. Pages register routes via useTestBotRoutes().
 */

import { testBot } from "./testBot";
import type { SuiteResult, TestBot } from "./types";
import { DEFAULT_SPEED } from "./types";
import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

type RouteDefiner = (bot: TestBot) => void;

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
function rebuildBot(definers: Map<string, RouteDefiner>): TestBot {
    const newBot = testBot({ speed: DEFAULT_SPEED });
    definers.forEach((fn) => fn(newBot));
    return newBot;
}

/** Replace current bot and reset state */
function swapBot(definers: Map<string, RouteDefiner>) {
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

// ═══════════════════════════════════════════════════════════════════
// Actions (static, callable from anywhere)
// ═══════════════════════════════════════════════════════════════════

export const TestBotActions = {
    register(pageId: string, definer: RouteDefiner) {
        const next = new Map(useTestBotStore.getState().routeDefiners);
        next.set(pageId, definer);
        swapBot(next);
    },

    unregister(pageId: string) {
        const next = new Map(useTestBotStore.getState().routeDefiners);
        next.delete(pageId);
        swapBot(next);
    },

    async runAll() {
        const { bot, isRunning } = useTestBotStore.getState();
        if (isRunning) return;

        // Track which suites have received their first real step
        const startedSuites = new Set<number>();

        useTestBotStore.setState({ isRunning: true, currentSuiteIndex: 0 });

        const finalResults = await bot.runAll(
            // onProgress — Suite completed, overwrite with final result
            (progress) => {
                const index = progress.length - 1;
                useTestBotStore.setState((state) => {
                    const nextSuites = [...state.suites];
                    if (nextSuites[index]) nextSuites[index] = { ...progress[index] };
                    return { suites: nextSuites, currentSuiteIndex: index + 1 };
                });
            },
            // onStep — Real-time step updates
            (suiteIndex, step) => {
                const isFirstStep = !startedSuites.has(suiteIndex);
                if (isFirstStep) startedSuites.add(suiteIndex);

                useTestBotStore.setState((state) => {
                    const nextSuites = [...state.suites];
                    const target = nextSuites[suiteIndex];
                    if (!target) return state;

                    nextSuites[suiteIndex] = {
                        ...target,
                        status: "running",
                        steps: isFirstStep ? [step] : [...target.steps, step],
                    };
                    return { suites: nextSuites, currentSuiteIndex: suiteIndex };
                });
            },
        );

        useTestBotStore.setState({
            suites: finalResults,
            isRunning: false,
            currentSuiteIndex: -1,
        });
    },

    async runSuite(index: number) {
        const { bot, isRunning } = useTestBotStore.getState();
        if (isRunning) return;

        useTestBotStore.setState({ isRunning: true, currentSuiteIndex: index });

        // Mark as running
        useTestBotStore.setState((state) => {
            const nextSuites = [...state.suites];
            if (nextSuites[index]) nextSuites[index] = { ...nextSuites[index], status: "running", steps: [] };
            return { suites: nextSuites };
        });

        const result = await bot.runSuite(
            index,
            // onStep
            (_suiteIndex, step) => {
                useTestBotStore.setState((state) => {
                    const nextSuites = [...state.suites];
                    const target = nextSuites[index];
                    if (!target) return state;
                    nextSuites[index] = { ...target, steps: [...target.steps, step] };
                    return { suites: nextSuites };
                });
            },
        );

        useTestBotStore.setState((state) => {
            const nextSuites = [...state.suites];
            nextSuites[index] = result;
            return { suites: nextSuites, isRunning: false, currentSuiteIndex: -1 };
        });
    },

    stop() {
        const { bot, routeDefiners } = useTestBotStore.getState();
        bot.destroy();
        const newBot = rebuildBot(routeDefiners);

        useTestBotStore.setState({
            bot: newBot,
            isRunning: false,
            currentSuiteIndex: -1,
        });
    },
};

// ═══════════════════════════════════════════════════════════════════
// Global API for AI/LLM agents (window.__TESTBOT__)
// ═══════════════════════════════════════════════════════════════════

(window as any).__TESTBOT__ = {
    /** Run all test suites */
    runAll: () => TestBotActions.runAll(),

    /** Run a single suite by index */
    runSuite: (i: number) => TestBotActions.runSuite(i),

    /** Run a single suite by exact name */
    runByName: (name: string) => {
        const { suites } = useTestBotStore.getState();
        const idx = suites.findIndex(s => s.name === name);
        if (idx < 0) throw new Error(`Suite "${name}" not found. Available: ${suites.map(s => s.name).join(", ")}`);
        return TestBotActions.runSuite(idx);
    },

    /** Get structured results as JSON */
    getResults: () => {
        const { suites, isRunning } = useTestBotStore.getState();
        return {
            isRunning,
            summary: {
                total: suites.length,
                pass: suites.filter(s => s.passed).length,
                fail: suites.filter(s => s.status === "done" && !s.passed).length,
            },
            suites: suites.map(s => ({
                name: s.name,
                status: s.status,
                passed: s.passed,
                steps: s.steps.map(step => ({
                    action: step.action,
                    detail: step.detail,
                    passed: step.passed,
                    error: step.error || null,
                })),
            })),
        };
    },

    /** Check if tests are currently running */
    isRunning: () => useTestBotStore.getState().isRunning,

    /** List all registered suite names */
    listSuites: () => useTestBotStore.getState().suites.map(s => s.name),
};
