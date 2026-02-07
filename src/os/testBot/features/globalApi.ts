/**
 * TestBot — Global API for AI/LLM agents (window.__TESTBOT__)
 *
 * Provides programmatic access to TestBot from the browser console
 * or AI agent integrations.
 */

import { useTestBotStore } from "./TestBotStore";
import { TestBotActions } from "./TestBotActions";

// ═══════════════════════════════════════════════════════════════════
// Global Registration
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
