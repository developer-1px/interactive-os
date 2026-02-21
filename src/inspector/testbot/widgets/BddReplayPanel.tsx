/**
 * BddReplayPanel — Run BDD test files in the browser and show results.
 *
 * Architecture:
 *   1. Dynamic import test file → spec-wrapper wraps as __runSpec__()
 *   2. __runSpec__() calls vitest shim → describe/it register into registry
 *   3. Walk registry tree, execute each test with beforeEach hooks
 *   4. Collect pass/fail results
 *   5. Display structured results
 */

import { CheckCircle2, Play, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useState } from "react";
import {
    clearEntriesForFile,
    getEntriesByFile,
    registry,
    type TestEntry,
} from "../playwright/registry";

// ── Types ──

interface TestResult {
    suite: string;
    name: string;
    status: "pass" | "fail" | "idle";
    error?: string;
    duration: number;
}

// ── Test file catalog ──

const TEST_FILES = [
    {
        label: "Todo BDD",
        path: "tests/integration/todo-bdd.test.ts",
        loader: () => import("@apps/todo/tests/integration/todo-bdd.test.ts"),
    },
];

// ── Execute tests from registry ──

function executeRegistryTests(sourceFile: string): TestResult[] {
    const results: TestResult[] = [];
    const entries = getEntriesByFile(sourceFile);

    function runEntry(entry: TestEntry, suiteName: string, parentBeforeEach: Function[] = []) {
        if (entry.type === "describe" && entry.children) {
            const hooks = [...parentBeforeEach, ...(entry.beforeEach || [])];
            for (const child of entry.children) {
                runEntry(child, entry.name, hooks);
            }
        } else if (entry.type === "test") {
            // Run beforeEach hooks
            for (const hook of parentBeforeEach) {
                try { hook(); } catch { /* swallow hook errors */ }
            }

            const start = performance.now();
            try {
                entry.fn();
                results.push({
                    suite: suiteName,
                    name: entry.name,
                    status: "pass",
                    duration: performance.now() - start,
                });
            } catch (e: any) {
                results.push({
                    suite: suiteName,
                    name: entry.name,
                    status: "fail",
                    error: e?.message || String(e),
                    duration: performance.now() - start,
                });
            }
        }
    }

    // Also run top-level entries that might not have a source file marker
    const targets = entries.length > 0 ? entries : registry;
    for (const entry of targets) {
        runEntry(entry, entry.name, []);
    }

    return results;
}

// ── Component ──

export function BddReplayPanel() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [running, setRunning] = useState(false);
    const [selectedFile, setSelectedFile] = useState(TEST_FILES[0]!);
    const [duration, setDuration] = useState(0);

    const run = useCallback(async () => {
        setRunning(true);
        setResults([]);

        // Clear previous entries for this file
        clearEntriesForFile(selectedFile.path);

        const start = performance.now();
        try {
            // Dynamic import → spec-wrapper wraps → __runSpec__ called → registry populated
            const mod = await selectedFile.loader();
            // spec-wrapper exports __runSpec__ as default
            if (mod && typeof (mod as any).default === "function") {
                (mod as any).default();
            }

            // Execute all registered tests
            const testResults = executeRegistryTests(selectedFile.path);
            setResults(testResults);
        } catch (e: any) {
            setResults([{
                suite: "Error",
                name: "Import failed",
                status: "fail",
                error: e?.message || String(e),
                duration: 0,
            }]);
        }

        setDuration(performance.now() - start);
        setRunning(false);
    }, [selectedFile]);

    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;

    // Group results by suite
    const suiteMap = new Map<string, TestResult[]>();
    for (const r of results) {
        if (!suiteMap.has(r.suite)) suiteMap.set(r.suite, []);
        suiteMap.get(r.suite)!.push(r);
    }

    return (
        <div className="flex flex-col h-full bg-white text-[13px]">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200 bg-stone-50">
                <select
                    className="text-xs bg-white border border-stone-200 rounded px-2 py-1"
                    value={selectedFile.label}
                    onChange={(e) => {
                        const f = TEST_FILES.find((t) => t.label === e.target.value);
                        if (f) setSelectedFile(f);
                    }}
                >
                    {TEST_FILES.map((f) => (
                        <option key={f.label} value={f.label}>{f.label}</option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={run}
                    disabled={running}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded hover:bg-emerald-600 disabled:opacity-50"
                >
                    {running ? <RotateCcw size={12} className="animate-spin" /> : <Play size={12} />}
                    {running ? "Running..." : "Run"}
                </button>

                {results.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto text-xs">
                        <span className="text-emerald-600 font-bold">{passed} ✓</span>
                        {failed > 0 && <span className="text-red-600 font-bold">{failed} ✗</span>}
                        <span className="text-stone-400 font-mono">{Math.round(duration)}ms</span>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
                {results.length === 0 && !running && (
                    <div className="flex flex-col items-center justify-center h-full text-stone-300">
                        <Play size={32} className="mb-2 opacity-30" />
                        <p className="text-sm">Click Run to execute tests</p>
                    </div>
                )}

                {Array.from(suiteMap.entries()).map(([suite, tests]) => (
                    <div key={suite} className="mb-3">
                        <div className="px-2 py-1 text-xs font-bold text-stone-500 uppercase tracking-wider">
                            {suite}
                        </div>
                        {tests.map((t, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${t.status === "fail" ? "bg-red-50" : t.status === "pass" ? "hover:bg-stone-50" : ""
                                    }`}
                            >
                                {t.status === "pass" ? (
                                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <XCircle size={14} className="text-red-500 flex-shrink-0" />
                                )}
                                <span className={`flex-1 truncate ${t.status === "fail" ? "text-red-700" : "text-stone-700"}`}>
                                    {t.name}
                                </span>
                                <span className="text-stone-400 font-mono text-[10px]">
                                    {t.duration < 1 ? "<1" : Math.round(t.duration)}ms
                                </span>
                            </div>
                        ))}
                        {/* Show errors */}
                        {tests.filter((t) => t.error).map((t, i) => (
                            <div key={`err-${i}`} className="mx-4 my-1 p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-600 font-mono">
                                <span className="font-bold">✕ {t.name}:</span> {t.error}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
