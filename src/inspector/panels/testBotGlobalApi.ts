/**
 * TestBot Global API — window.__TESTBOT__
 *
 * Provides programmatic access to TestBot from:
 *   - Browser DevTools console
 *   - LLM/AI agent integrations
 *   - E2E automation bridges
 */

import {
    createBrowserPage,
    expect,
    resetFocusState,
    TestBotRegistry,
    type BrowserStep,
    type TestScript,
} from "@os/testing";

// ═══════════════════════════════════════════════════════════════════
// Internal State Bridge
// ═══════════════════════════════════════════════════════════════════

export interface SuiteSnapshot {
    name: string;
    status: "planned" | "running" | "done";
    passed: boolean;
    steps: StepSnapshot[];
}

export interface StepSnapshot {
    action: string;
    detail: string;
    passed: boolean;
    error: string | null;
}

interface ApiState {
    isRunning: boolean;
    suites: SuiteSnapshot[];
    scripts: { name: string }[];
}

// Module-level mutable bridge (updated by TestBotPanel)
let _state: ApiState = { isRunning: false, suites: [], scripts: [] };
let _runAll: (() => void) | null = null;
let _runSuite: ((si: number) => void) | null = null;
let _activeScripts: TestScript[] = [];

// ═══════════════════════════════════════════════════════════════════
// Quick Run (headless, no visual effects)
// ═══════════════════════════════════════════════════════════════════

interface QuickResult {
    name: string;
    passed: boolean;
    steps: { action: string; detail: string; passed: boolean; error?: string }[];
}

async function quickRunScripts(scripts: TestScript[]): Promise<QuickResult[]> {
    const results: QuickResult[] = [];

    for (const script of scripts) {
        const steps: BrowserStep[] = [];
        const page = createBrowserPage(document.body, {
            headless: true,
            onStep: (step) => steps.push(step),
        });

        let passed = true;
        try {
            resetFocusState();
            await script.run(page, expect);
        } catch (e) {
            passed = false;
            steps.push({
                action: "assert",
                detail: String(e),
                result: "fail",
                error: String(e),
                timestamp: 0,
            });
        }

        page.hideCursor();
        results.push({
            name: script.name,
            passed,
            steps: steps.map((s) => ({
                action: s.action,
                detail: s.detail,
                passed: s.result === "pass",
                ...(s.error ? { error: s.error } : {}),
            })),
        });
    }

    return results;
}

function printQuickResults(results: QuickResult[]) {
    const pass = results.filter((r) => r.passed).length;
    const fail = results.filter((r) => !r.passed).length;
    const total = results.length;

    console.log(
        `\n🤖 TestBot Quick: ${pass}/${total} passed` +
        (fail > 0 ? ` · ${fail} failed` : "") +
        "\n",
    );

    for (const r of results) {
        if (r.passed) {
            console.log(`  ✅ ${r.name}`);
        } else {
            console.log(`  ❌ ${r.name}`);
            for (const step of r.steps) {
                if (!step.passed) {
                    console.log(`     💥 [${step.action}] ${step.detail}`);
                    if (step.error) console.log(`        → ${step.error}`);
                }
            }
        }
    }
    console.log("");
}

// ═══════════════════════════════════════════════════════════════════
// Registration (called by TestBotPanel)
// ═══════════════════════════════════════════════════════════════════

export function updateTestBotApiState(state: ApiState) {
    _state = state;
}

export function setActiveScripts(scripts: TestScript[]) {
    _activeScripts = scripts;
}

export function registerTestBotGlobalApi(
    runAll: () => void,
    runSuite: (si: number) => void,
) {
    _runAll = runAll;
    _runSuite = runSuite;

    function findSuiteIndex(name: string): number {
        const idx = _state.suites.findIndex((s) => s.name === name);
        if (idx < 0) {
            const available = _state.scripts.map((s) => s.name).join(", ");
            throw new Error(`Suite "${name}" not found. Available: ${available}`);
        }
        return idx;
    }

    function getScripts(): TestScript[] {
        const pageScripts = TestBotRegistry.getScripts();
        return pageScripts.length > 0 ? pageScripts : _activeScripts;
    }

    (window as Record<string, unknown>)["__TESTBOT__"] = {
        // ── Visual Run ───────────────────────────────────────────

        /** Run all test suites (with visual effects) */
        runAll: () => _runAll?.(),

        /** Run a single suite by index (with visual effects) */
        runSuite: (i: number) => _runSuite?.(i),

        /** Run a single suite by exact name (with visual effects) */
        runByName: (name: string) => _runSuite?.(findSuiteIndex(name)),

        // ── Quick Run (headless) ─────────────────────────────────

        /** 🚀 Quick run — no visuals, instant results */
        quickRun: async () => {
            const scripts = getScripts();
            if (scripts.length === 0) {
                console.warn("[TestBot] No scripts available");
                return;
            }
            console.log(`⚡ Running ${scripts.length} tests headlessly...`);
            const results = await quickRunScripts(scripts);
            printQuickResults(results);
            return results;
        },

        /** 🚀 Quick run a single suite by name */
        quickRunByName: async (name: string) => {
            const scripts = getScripts();
            const script = scripts.find((s) => s.name === name);
            if (!script) {
                console.warn(`[TestBot] Script "${name}" not found`);
                return;
            }
            console.log(`⚡ Quick: "${name}"...`);
            const results = await quickRunScripts([script]);
            printQuickResults(results);
            return results[0];
        },

        /** Re-run only previously failed suites */
        rerunFailed: async () => {
            if (_state.isRunning) {
                console.warn("[TestBot] Already running");
                return;
            }
            const failedIndices = _state.suites
                .map((s, i) => (s.status === "done" && !s.passed ? i : -1))
                .filter((i) => i >= 0);

            if (failedIndices.length === 0) {
                console.log("✅ [TestBot] No failed suites to re-run.");
                return;
            }

            const names = failedIndices.map((i) => _state.suites[i]?.name).join(", ");
            console.log(`🔄 Re-running ${failedIndices.length} failed: ${names}`);

            for (const idx of failedIndices) {
                _runSuite?.(idx);
                await new Promise<void>((resolve) => {
                    const check = setInterval(() => {
                        if (!_state.isRunning) { clearInterval(check); resolve(); }
                    }, 100);
                });
            }
        },

        // ── Query ────────────────────────────────────────────────

        /** Structured results (all suites) */
        getResults: () => ({
            isRunning: _state.isRunning,
            summary: {
                total: _state.suites.length,
                pass: _state.suites.filter((s) => s.passed).length,
                fail: _state.suites.filter((s) => s.status === "done" && !s.passed).length,
            },
            suites: _state.suites,
        }),

        /** Only failed suites with first error detail */
        getFailures: () => {
            const failed = _state.suites.filter((s) => s.status === "done" && !s.passed);
            return failed.map((s) => ({
                name: s.name,
                failedStep: (() => {
                    const step = s.steps.find((st) => !st.passed);
                    if (!step) return null;
                    return {
                        index: s.steps.indexOf(step) + 1,
                        action: step.action,
                        detail: step.detail,
                        error: step.error,
                    };
                })(),
            }));
        },

        /** "PASS: N / FAIL: N / TOTAL: N" */
        summary: () => {
            const pass = _state.suites.filter((s) => s.passed).length;
            const fail = _state.suites.filter((s) => s.status === "done" && !s.passed).length;
            return `PASS: ${pass} / FAIL: ${fail} / TOTAL: ${_state.suites.length}`;
        },

        /** Currently running? */
        isRunning: () => _state.isRunning,

        /** List all script names */
        listSuites: () => _state.scripts.map((s) => s.name),

        /** Get results as JSON string (for LLM/agent parsing) */
        getJSON: () => JSON.stringify({
            suites: _state.suites.map((s) => ({
                name: s.name,
                passed: s.passed,
                steps: s.steps.map((st) => ({
                    action: st.action,
                    detail: st.detail,
                    passed: st.passed,
                    error: st.error,
                })),
            })),
        }, null, 2),
    };

    console.log(
        "[TestBot] 🤖 window.__TESTBOT__ registered.\n" +
        "  runAll() · quickRun() · getFailures() · summary()",
    );
}

export function unregisterTestBotGlobalApi() {
    delete (window as Record<string, unknown>)["__TESTBOT__"];
}
