/**
 * ReplayPanel — Visual integration test replay (Cypress-style)
 *
 * Architecture:
 *   1. Test file imported → vitest shim collects entries into registry
 *   2. Select test → enter preview sandbox
 *   3. Run test fn with visual actions (DOM events + feedback)
 *   4. Each step recorded with state snapshot
 *   5. Click any step → setPreview(snapshot) → time travel
 *   6. Stop → clearPreview → restore real state
 *
 * "Same test code, different runtime."
 */

import {
    ChevronLeft,
    ChevronRight,
    History,
    Play,
    RotateCcw,
    Square,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { os } from "@/os/kernel";
import {
    createVisualTestKit,
    type VisualStep,
} from "../features/createVisualTestKit";
import { registry } from "../playwright/registry";
import { setVisualObserver } from "@os/3-commands/tests/integration/helpers/visualObserver";

// ═══════════════════════════════════════════════════════════════════
// Test file registry — import real test files here
// ═══════════════════════════════════════════════════════════════════

interface TestSuite {
    name: string;
    tests: { name: string; fn: Function }[];
}

// Flatten vitest/playwright registry entries into test suites
function loadTestSuites(): TestSuite[] {

    const suites: TestSuite[] = [];

    for (const entry of registry) {
        if (entry.type === "describe" && entry.children) {
            suites.push({
                name: entry.name,
                tests: entry.children
                    .filter((c) => c.type === "test")
                    .map((c) => ({ name: c.name, fn: c.fn })),
            });
        } else if (entry.type === "test") {
            // Top-level test — group as "Ungrouped"
            const ungrouped = suites.find((s) => s.name === "Ungrouped");
            if (ungrouped) {
                ungrouped.tests.push({ name: entry.name, fn: entry.fn });
            } else {
                suites.push({
                    name: "Ungrouped",
                    tests: [{ name: entry.name, fn: entry.fn }],
                });
            }
        }
    }

    return suites;
}

// ═══════════════════════════════════════════════════════════════════
// Step display
// ═══════════════════════════════════════════════════════════════════

function stepColor(s: VisualStep): string {
    if (s.type === "setup") return "bg-slate-100 text-slate-600 border-slate-200";
    if (s.type === "pressKey") return "bg-blue-500/10 text-blue-600 border-blue-200";
    if (s.type === "click") return "bg-amber-500/10 text-amber-600 border-amber-200";
    if (s.type === "assert") return s.passed ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200";
    return "bg-slate-100 text-slate-500 border-slate-200";
}

function stepIcon(s: VisualStep): string {
    if (s.type === "setup") return "🏁";
    if (s.type === "pressKey") return "⌨";
    if (s.type === "click") return "🖱";
    if (s.type === "assert") return s.passed ? "✅" : "❌";
    return "•";
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

export function ReplayPanel() {
    const [view, setView] = useState<"list" | "running" | "review">("list");
    const [suites, setSuites] = useState<TestSuite[]>([]);
    const [activeSuite, setActiveSuite] = useState<string>("");
    const [activeTest, setActiveTest] = useState<string>("");
    const [steps, setSteps] = useState<VisualStep[]>([]);
    const [idx, setIdx] = useState(-1);
    const [running, setRunning] = useState(false);
    const kitRef = useRef(createVisualTestKit());

    // Load suites on mount
    useEffect(() => {
        setSuites(loadTestSuites());
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            kitRef.current.exit();
        };
    }, []);

    // ── Execute test ──
    const execute = useCallback(async (suiteName: string, testName: string, fn: Function) => {
        setActiveSuite(suiteName);
        setActiveTest(testName);
        setView("running");
        setRunning(true);
        setSteps([]);
        setIdx(-1);

        const kit = kitRef.current;
        const localSteps = kit.getSteps();
        kit.enter();

        // Wire visual observer so createTestOsKernel reports actions
        setVisualObserver({
            onPressKey(key) {
                localSteps.push({
                    type: "pressKey",
                    label: key,
                    snapshot: JSON.parse(JSON.stringify(os.getState())),
                    timestamp: Date.now(),
                });
            },
            onClick(itemId) {
                localSteps.push({
                    type: "click",
                    label: `click(${itemId})`,
                    snapshot: JSON.parse(JSON.stringify(os.getState())),
                    timestamp: Date.now(),
                });
            },
            onAssert(label, passed, error) {
                localSteps.push({
                    type: "assert",
                    label,
                    passed,
                    error,
                    snapshot: JSON.parse(JSON.stringify(os.getState())),
                    timestamp: Date.now(),
                });
            },
            async delay() {
                await new Promise((r) => setTimeout(r, 100));
            },
        });

        try {
            await fn();
        } catch (e) {
            console.error("[ReplayPanel] Test error:", e);
        }

        setVisualObserver(null);
        setSteps([...localSteps]);
        setIdx(localSteps.length - 1);
        setRunning(false);
        setView("review");
    }, []);

    // ── Execute all tests in a suite ──
    const executeAll = useCallback(async (suite: TestSuite) => {
        setActiveSuite(suite.name);
        setActiveTest(`All (${suite.tests.length})`);
        setView("running");
        setRunning(true);
        setSteps([]);
        setIdx(-1);

        const kit = kitRef.current;
        const localSteps = kit.getSteps();
        kit.enter();

        // Same observer as execute
        setVisualObserver({
            onPressKey(key) {
                localSteps.push({
                    type: "pressKey",
                    label: key,
                    snapshot: JSON.parse(JSON.stringify(os.getState())),
                    timestamp: Date.now(),
                });
            },
            onClick(itemId) {
                localSteps.push({
                    type: "click",
                    label: `click(${itemId})`,
                    snapshot: JSON.parse(JSON.stringify(os.getState())),
                    timestamp: Date.now(),
                });
            },
            onAssert(label, passed, error) {
                localSteps.push({
                    type: "assert",
                    label,
                    passed,
                    error,
                    snapshot: JSON.parse(JSON.stringify(os.getState())),
                    timestamp: Date.now(),
                });
            },
            async delay() {
                await new Promise((r) => setTimeout(r, 100));
            },
        });

        for (const t of suite.tests) {
            try {
                await t.fn();
            } catch (e) {
                console.error(`[ReplayPanel] Test "${t.name}" error:`, e);
            }
        }

        setVisualObserver(null);
        setSteps([...localSteps]);
        setIdx(localSteps.length - 1);
        setRunning(false);
        setView("review");
    }, []);

    // ── Time travel ──
    const jumpTo = useCallback((i: number) => {
        if (i >= 0 && i < steps.length) {
            os.setPreview(steps[i]!.snapshot as any);
            setIdx(i);
        }
    }, [steps]);

    const stop = useCallback(() => {
        kitRef.current.exit();
        setView("list");
        setSteps([]);
        setIdx(-1);
        setRunning(false);
    }, []);

    // ═══ Scenario List ═══
    if (view === "list") {
        return (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
                <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
                    <h2 className="text-sm font-bold text-slate-800">Replay</h2>
                    <p className="text-[10px] text-slate-400">
                        {suites.reduce((n, s) => n + s.tests.length, 0)} tests from vitest registry
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {suites.length === 0 && (
                        <p className="text-center py-8 text-xs text-slate-300">
                            No tests registered. Navigate to a page that imports test files.
                        </p>
                    )}
                    {suites.map((suite) => (
                        <div key={suite.name} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-700">{suite.name}</span>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => executeAll(suite)}
                                        className="text-[9px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium">
                                        Run All
                                    </button>
                                    <span className="text-[9px] text-slate-400">{suite.tests.length}</span>
                                </div>
                            </div>
                            {suite.tests.map((t) => (
                                <button key={t.name} type="button"
                                    onClick={() => execute(suite.name, t.name, t.fn)}
                                    className="w-full text-left px-3 py-2 text-[11px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0">
                                    <Play size={9} className="text-slate-400 shrink-0" />
                                    <span className="flex-1 truncate">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ═══ Running / Review ═══
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
            {/* Header */}
            <div className="px-3 py-2 bg-white border-b border-slate-200 shrink-0 flex items-center gap-2">
                <button type="button" onClick={stop} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                    <ChevronLeft size={14} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{activeTest}</p>
                    <p className="text-[9px] text-slate-400">
                        {running ? "Running..." : `${steps.length} steps · ${activeSuite}`}
                    </p>
                </div>
                {!running && (
                    <span className="text-[9px] font-mono text-slate-400 tabular-nums">{idx + 1}/{steps.length}</span>
                )}
            </div>

            {/* Preview indicator */}
            {os.isPreviewing() && (
                <div className="px-3 py-1 bg-amber-50 border-b border-amber-200 flex items-center gap-2 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-amber-700">
                        {running ? "RUNNING — test executing on preview sandbox" : "REVIEW — click any step to time-travel"}
                    </span>
                </div>
            )}

            {/* Progress */}
            <div className="h-1 bg-slate-100 w-full">
                <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-300 rounded-r"
                    style={{ width: `${steps.length ? ((idx + 1) / steps.length) * 100 : 0}%` }} />
            </div>

            {/* Current step badge */}
            <div className="flex items-center justify-center py-2 shrink-0 min-h-[40px]">
                {running ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 rounded-lg shadow-lg animate-pulse">
                        <span className="text-white font-bold text-[10px]">Executing...</span>
                    </div>
                ) : idx >= 0 && steps[idx] ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg shadow-lg">
                        <span className="text-[12px]">{stepIcon(steps[idx]!)}</span>
                        <span className="text-white font-mono font-bold text-[10px]">{steps[idx]!.label}</span>
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-300">Click a step to time-travel</span>
                )}
            </div>

            {/* Command Log */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {steps.map((s, i) => {
                    const isCur = i === idx;
                    const isPast = i < idx;

                    return (
                        <div key={i} onClick={() => !running && jumpTo(i)}
                            ref={(el) => { if (isCur && el) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium border transition-all
                ${running ? "cursor-default" : "cursor-pointer"}
                ${isCur ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300/40"
                                    : isPast ? `${stepColor(s)} opacity-60` : `${stepColor(s)} opacity-40`}`}>
                            <span className="text-[10px] shrink-0">{stepIcon(s)}</span>
                            <span className="text-[8px] font-mono text-slate-400 w-2.5 text-right tabular-nums shrink-0">{i}</span>
                            <span className="flex-1 truncate">{s.label}</span>
                            {s.error && <span className="text-[8px] text-red-400 truncate max-w-[80px]">{s.error}</span>}
                        </div>
                    );
                })}

                {steps.length === 0 && running && (
                    <p className="text-center py-8 text-xs text-slate-300 animate-pulse">Executing test...</p>
                )}
            </div>

            {/* Controls */}
            {!running && steps.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-t border-slate-200 shrink-0">
                    <button type="button" onClick={() => {
                        const suite = suites.find((s) => s.name === activeSuite);
                        const test = suite?.tests.find((t) => t.name === activeTest);
                        if (test) execute(activeSuite, activeTest, test.fn);
                    }} className="p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm" title="Re-run">
                        <RotateCcw size={12} />
                    </button>
                    <button type="button" onClick={stop} className="p-1 rounded text-slate-500 hover:bg-slate-100" title="Stop & restore">
                        <Square size={12} />
                    </button>
                    <div className="w-px h-3 bg-slate-200" />
                    <button type="button" onClick={() => jumpTo(Math.max(0, idx - 1))} disabled={idx <= 0} className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                        <ChevronLeft size={12} />
                    </button>
                    <button type="button" onClick={() => jumpTo(Math.min(steps.length - 1, idx + 1))} disabled={idx >= steps.length - 1} className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                        <ChevronRight size={12} />
                    </button>
                    <div className="ml-auto">
                        <button type="button" onClick={() => jumpTo(0)}
                            className="text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center gap-1">
                            <History size={9} /> Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
