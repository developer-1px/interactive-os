/**
 * TestBotPanel — TestBot UI inside the Inspector
 *
 * Original design fully restored. Data layer updated to use
 * TestBotRegistry + createBrowserPage instead of the legacy TestBotStore.
 *
 * Two modes (auto-switching via TestBotRegistry):
 *   • ARIA mode (default): own embedded widgets
 *   • Page mode: when a playground registers scripts via TestBotRegistry
 */

import {
    AlertTriangle,
    Check,
    ChevronDown,
    Copy,
    Eye,
    Keyboard,
    MousePointerClick,
    Play,
    RefreshCw,
    Square,
    X,
    Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import "./testbot-overlays.css";
import {
    allAriaScripts,
    createBrowserPage,
    expect,
    resetFocusState,
    TestBotRegistry,
    type BrowserStep,
    type TestScript,
} from "@os/testing";
import {
    registerTestBotGlobalApi,
    setActiveScripts,
    unregisterTestBotGlobalApi,
    updateTestBotApiState,
} from "./testBotGlobalApi";

// ═══════════════════════════════════════════════════════════════════
// Key Symbol Labels (original from testbot/features/actions/constants.ts)
// ═══════════════════════════════════════════════════════════════════

const KEY_LABELS: Record<string, string> = {
    ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
    Tab: "⇥ Tab", Enter: "↵ Enter", Escape: "Esc",
    " ": "Space", Backspace: "⌫", Delete: "Del",
    Home: "Home", End: "End",
    Shift: "⇧", Meta: "⌘", Control: "⌃", Alt: "⌥",
};
const displayKey = (k: string) => KEY_LABELS[k] ?? k;

// ═══════════════════════════════════════════════════════════════════
// Internal Suite State (mirrors legacy SuiteResult shape)
// ═══════════════════════════════════════════════════════════════════

type SuiteStatus = "planned" | "running" | "done";

interface SuiteState {
    name: string;
    status: SuiteStatus;
    passed: boolean;
    steps: BrowserStep[];
}

// ═══════════════════════════════════════════════════════════════════
// Embedded widget styles (ARIA mode only)
// ═══════════════════════════════════════════════════════════════════

const ITEM_CLS =
    `px-2 py-1 rounded text-xs cursor-pointer select-none border
  bg-white text-slate-600 border-slate-200 hover:bg-slate-50
  data-[focused=true]:bg-blue-50 data-[focused=true]:text-blue-700
  data-[focused=true]:border-blue-300`;

const TOOL_CLS =
    `px-2 py-1 rounded text-xs font-bold cursor-pointer select-none border
  bg-white text-slate-600 border-slate-200 hover:bg-slate-50
  data-[focused=true]:bg-violet-50 data-[focused=true]:text-violet-700
  data-[focused=true]:border-violet-300`;

const RADIO_CLS =
    `px-2 py-1 rounded text-xs cursor-pointer select-none border
  bg-white text-slate-600 border-slate-200
  data-[focused=true]:bg-rose-50 data-[focused=true]:text-rose-700
  data-[focused=true]:border-rose-300
  aria-[selected=true]:bg-rose-50 aria-[selected=true]:text-rose-700
  aria-[selected=true]:border-rose-300`;

const CELL_CLS =
    `aspect-square flex items-center justify-center rounded text-xs font-bold
  cursor-pointer select-none border bg-white text-slate-600 border-slate-200
  aria-[selected=true]:bg-emerald-50 aria-[selected=true]:text-emerald-700
  aria-[selected=true]:border-emerald-300
  data-[focused=true]:ring-2 data-[focused=true]:ring-blue-400`;

// ═══════════════════════════════════════════════════════════════════
// SuiteDetails — Step timeline view (original design)
// ═══════════════════════════════════════════════════════════════════

const FLASH_STYLE = `
@keyframes flash-bg {
    0% { background-color: rgba(59, 130, 246, 0.2); }
    100% { background-color: transparent; }
}
.animate-flash {
    animation: flash-bg 1s ease-out forwards;
}
`;

function StepIcon({ step, isActive }: { step: BrowserStep; isActive: boolean }) {
    if (isActive)
        return (
            <div className="w-3 h-3 flex items-center justify-center bg-white rounded-full ring-2 ring-blue-500 z-10 relative">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            </div>
        );
    const bgWrap = "bg-white z-10 relative rounded-full";
    if (step.error)
        return <AlertTriangle size={14} className={`text-red-500 ${bgWrap}`} />;
    if (step.action === "click")
        return <MousePointerClick size={14} className={`text-blue-500 ${bgWrap}`} />;
    if (step.action === "press")
        return <Keyboard size={14} className={`text-slate-500 ${bgWrap}`} />;
    if (step.action === "assert")
        return (
            <Eye
                size={14}
                className={`${step.result === "pass" ? "text-emerald-500" : "text-slate-400"} ${bgWrap}`}
            />
        );
    return <div className={`w-2 h-2 rounded-full bg-slate-200 ${bgWrap}`} />;
}

function SuiteDetails({
    steps,
    isRunning,
    activeStepIndex,
}: {
    steps: BrowserStep[];
    isRunning?: boolean;
    activeStepIndex?: number;
}) {
    const activeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isRunning && activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [isRunning, steps.length]);

    if (!steps || steps.length === 0) {
        return (
            <div className="relative pb-2">
                <div className="flex items-center pl-3 pr-2 py-1.5">
                    <div className="shrink-0 w-6 flex justify-center mr-2 pt-0.5">
                        <div className="w-2 h-2 rounded-full bg-slate-200 bg-white z-10 relative" />
                    </div>
                    <span className="text-[11px] text-slate-400">Ready to run</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative pb-2">
            <style>{FLASH_STYLE}</style>
            {/* Timeline Line */}
            <div className="absolute left-[24px] top-[-8px] bottom-6 w-px bg-slate-200 z-0" />

            {steps.map((step, i) => {
                const isActive = isRunning && i === activeStepIndex;
                const isPending = isRunning && activeStepIndex !== undefined && i > activeStepIndex;
                const isAssert = step.action === "assert";
                const isLast = i === steps.length - 1;
                const passed = step.result === "pass";

                return (
                    <div
                        key={`${i}-${step.action}`}
                        ref={isActive ? activeRef : null}
                        data-testbot-step={i}
                        data-testbot-action={step.action}
                        data-testbot-step-result={passed ? "pass" : step.error ? "fail" : "pending"}
                        className={`group flex items-center pl-3 pr-2 py-1.5 transition-colors relative ${isActive
                            ? "bg-blue-50/50"
                            : isPending
                                ? "opacity-50"
                                : "hover:bg-slate-50"
                            } ${isLast && !isPending && !isActive ? "animate-flash" : ""}`}
                    >
                        {/* Icon */}
                        <div className="shrink-0 w-6 flex justify-center mr-2 pt-0.5">
                            <StepIcon step={step} isActive={!!isActive} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 text-[11px] leading-relaxed pt-0.5">
                            <div className="flex items-baseline gap-1.5">
                                <span className={`font-mono text-[9px] select-none font-bold ${isActive ? "text-blue-600" : "text-slate-500"}`}>
                                    #{i + 1}
                                </span>
                                <span
                                    className={`font-extrabold tracking-tighter uppercase text-[10px] ${isActive
                                        ? "text-blue-700"
                                        : step.action === "click"
                                            ? "text-blue-700 bg-blue-50 px-1 rounded"
                                            : step.action === "press"
                                                ? "text-slate-600"
                                                : isAssert
                                                    ? isPending
                                                        ? "text-slate-400"
                                                        : passed
                                                            ? "text-emerald-700"
                                                            : "text-red-700"
                                                    : "text-slate-500"
                                        }`}
                                >
                                    {isAssert ? "Expect" : step.action}
                                </span>
                                <span
                                    className={`inline-flex items-center gap-0.5 flex-wrap ${isActive
                                        ? "text-blue-900"
                                        : isPending
                                            ? "text-slate-400"
                                            : passed
                                                ? "text-slate-700"
                                                : "text-red-700 font-medium"
                                        }`}
                                >
                                    {step.action === "press" ? (
                                        // Split "Shift+Tab" → [⇧] + [⇥ Tab]
                                        step.detail.split("+").map((key, ki, arr) => (
                                            <span key={ki} className="inline-flex items-center gap-0.5">
                                                <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white border border-slate-200 border-b-[3px] border-b-slate-300 rounded-[4px] text-[10px] font-sans text-slate-600 font-bold uppercase select-none transition-transform active:border-b-0 active:translate-y-[3px] shadow-sm">
                                                    {displayKey(key)}
                                                </kbd>
                                                {ki < arr.length - 1 && (
                                                    <span className="text-[9px] text-slate-400 font-bold select-none">+</span>
                                                )}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="font-mono truncate">{step.detail}</span>
                                    )}
                                </span>
                            </div>
                            {step.error && (
                                <div
                                    data-testbot-error
                                    className="mt-1 px-2 py-1.5 bg-red-50/50 text-red-600 rounded border border-red-100/50 font-mono text-[10px] break-all"
                                >
                                    {step.error}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// CopyLogButton (original design)
// ═══════════════════════════════════════════════════════════════════

function generateSuiteLog(suite: SuiteState): string {
    const status = suite.passed ? "PASS" : "FAIL";
    const steps = suite.steps
        .map((s, i) => {
            const icon = s.error ? "❌" : s.result === "pass" ? "✅" : "⬜";
            return `${i + 1}. ${icon} [${s.action.toUpperCase()}] ${s.detail}${s.error ? `\n   Error: ${s.error}` : ""}`;
        })
        .join("\n");
    return `## Test Scenario: ${suite.name}\nStatus: ${status}\nSteps: ${suite.steps.length}\n\n### Execution Log\n${steps}\n`;
}

function CopyLogButton({ suite }: { suite: SuiteState }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(generateSuiteLog(suite)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`shrink-0 p-1.5 rounded-full transition-all duration-200 ${copied
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                : "text-slate-300 hover:text-blue-500 hover:bg-blue-50"
                }`}
            title="Copy Scenario Log"
        >
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════
// CopyFailuresButton — copies ALL failed suites' logs at once
// ═══════════════════════════════════════════════════════════════════

function generateFailureReport(suites: SuiteState[]): string {
    const failed = suites.filter((s) => s.status === "done" && !s.passed);
    if (failed.length === 0) return "All tests passed ✅";

    const total = suites.filter((s) => s.status === "done").length;
    const lines: string[] = [
        `TestBot: ${failed.length} FAIL / ${total} total`,
        "",
    ];

    for (const suite of failed) {
        lines.push(`❌ ${suite.name}`);
        for (const step of suite.steps) {
            const icon = step.error ? "💥" : step.result === "pass" ? "✅" : "⬜";
            lines.push(`  ${icon} [${step.action}] ${step.detail}`);
            if (step.error) {
                lines.push(`     → ${step.error}`);
            }
        }
        lines.push("");
    }

    return lines.join("\n");
}

function CopyFailuresButton({ suites }: { suites: SuiteState[] }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const report = generateFailureReport(suites);
        navigator.clipboard.writeText(report).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${copied
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                }`}
            title="Copy all failure logs to clipboard"
        >
            {copied ? <Check size={10} strokeWidth={2.5} /> : <Copy size={10} />}
            {copied ? "Copied" : "Copy Failures"}
        </button>
    );
}


export function TestBotPanel() {
    const [suites, setSuites] = useState<SuiteState[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentSuiteIndex, setCurrentSuiteIndex] = useState(0);
    const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    // Context-aware: switch between page scripts and default ARIA suite
    const pageScripts = useSyncExternalStore(
        (cb) => TestBotRegistry.subscribe(cb),
        () => TestBotRegistry.getScripts(),
        () => [],
    );
    const isPageMode = pageScripts.length > 0;
    const activeScripts: TestScript[] = isPageMode ? pageScripts : allAriaScripts;

    // Reset when scripts change (page navigation)
    useEffect(() => {
        setSuites([]);
        setIsRunning(false);
    }, [activeScripts]);

    // ── window.__TESTBOT__ ──────────────────────────────────────────
    // Sync state to global API on every render
    updateTestBotApiState({
        isRunning,
        suites: suites.map((s) => ({
            name: s.name,
            status: s.status,
            passed: s.passed,
            steps: s.steps.map((st) => ({
                action: st.action,
                detail: st.detail,
                passed: st.result === "pass",
                error: st.error ?? null,
            })),
        })),
        scripts: activeScripts.map((s) => ({ name: s.name })),
    });
    setActiveScripts(activeScripts);

    const toggleSuite = (name: string) => {
        const next = new Set(expandedSuites);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        setExpandedSuites(next);
    };

    const doneSuites = suites.filter((s) => s.status === "done");
    const passCount = doneSuites.filter((s) => s.passed).length;
    const failCount = doneSuites.filter((s) => !s.passed).length;
    const isFinished = !isRunning && doneSuites.length > 0;

    const activeSuiteRef = useCallback(
        (el: HTMLDivElement | null) => {
            if (el && isRunning) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        },
        [isRunning],
    );

    const createPage = useCallback(() => {
        const container: HTMLElement | null = isPageMode ? document.body : containerRef.current;
        if (!container) return null;
        return createBrowserPage(container, { speed: 4 });
    }, [isPageMode]);

    const runAll = useCallback(async () => {
        // Init all suites as planned
        const initialSuites: SuiteState[] = activeScripts.map((s) => ({
            name: s.name,
            status: "planned",
            passed: false,
            steps: [],
        }));
        setSuites(initialSuites);
        setIsRunning(true);
        setCurrentSuiteIndex(0);

        for (let i = 0; i < activeScripts.length; i++) {
            const script = activeScripts[i];
            setCurrentSuiteIndex(i);

            // Mark as running
            setSuites((prev) =>
                prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)),
            );

            const steps: BrowserStep[] = [];
            const page = createPage();
            if (!page) continue;

            const pageWithCapture = createBrowserPage(
                isPageMode ? document.body : containerRef.current!,
                {
                    speed: 4,
                    onStep: (step) => {
                        steps.push(step);
                        setSuites((prev) =>
                            prev.map((s, idx) =>
                                idx === i ? { ...s, steps: [...steps] } : s,
                            ),
                        );
                    },
                },
            );

            let passed = true;
            try {
                resetFocusState();
                await script?.run(pageWithCapture, expect);
            } catch (e) {
                passed = false;
                const errStep: BrowserStep = {
                    action: "assert",
                    detail: String(e),
                    result: "fail",
                    error: String(e),
                    timestamp: Date.now(),
                };
                steps.push(errStep);
            }

            pageWithCapture.hideCursor();

            setSuites((prev) =>
                prev.map((s, idx) =>
                    idx === i ? { ...s, status: "done", passed, steps: [...steps] } : s,
                ),
            );
        }

        setIsRunning(false);
    }, [activeScripts, createPage, isPageMode]);

    const runSuite = useCallback(async (si: number) => {
        const script = activeScripts[si];
        if (!script) return;

        setIsRunning(true);
        setCurrentSuiteIndex(si);

        setSuites((prev) => {
            const next = [...prev];
            if (!next[si]) {
                // If suites list not yet initialized, create it
                const all = activeScripts.map((s) => ({
                    name: s.name,
                    status: "planned" as SuiteStatus,
                    passed: false,
                    steps: [],
                }));
                all[si] = { name: all[si]!.name, status: "running", passed: false, steps: [] };
                return all;
            }
            next[si] = { ...next[si], status: "running", steps: [] };
            return next;
        });

        const steps: BrowserStep[] = [];
        const container: HTMLElement | null = isPageMode ? document.body : containerRef.current;
        if (!container) { setIsRunning(false); return; }

        const page = createBrowserPage(container, {
            speed: 4,
            onStep: (step) => {
                steps.push(step);
                setSuites((prev) =>
                    prev.map((s, idx) =>
                        idx === si ? { ...s, steps: [...steps] } : s,
                    ),
                );
            },
        });

        let passed = true;
        try {
            await script.run(page, expect);
        } catch (e) {
            passed = false;
            const errStep: BrowserStep = {
                action: "assert",
                detail: String(e),
                result: "fail",
                error: String(e),
                timestamp: Date.now(),
            };
            steps.push(errStep);
        }

        page.hideCursor();
        setSuites((prev) =>
            prev.map((s, idx) =>
                idx === si ? { ...s, status: "done", passed, steps: [...steps] } : s,
            ),
        );
        setIsRunning(false);
    }, [activeScripts, isPageMode]);

    const handleQuickRun = useCallback(async () => {
        const initialSuites: SuiteState[] = activeScripts.map((s) => ({
            name: s.name,
            status: "planned",
            passed: false,
            steps: [],
        }));
        setSuites(initialSuites);
        setIsRunning(true);

        const container: HTMLElement = isPageMode ? document.body : (containerRef.current ?? document.body);

        for (let i = 0; i < activeScripts.length; i++) {
            const script = activeScripts[i];
            setCurrentSuiteIndex(i);
            setSuites((prev) =>
                prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)),
            );

            const steps: BrowserStep[] = [];
            const page = createBrowserPage(container, {
                headless: true,
                onStep: (step) => steps.push(step),
            });

            let passed = true;
            try {
                resetFocusState();
                await script?.run(page, expect);
            } catch (e) {
                passed = false;
                steps.push({
                    action: "assert",
                    detail: String(e),
                    result: "fail",
                    error: String(e),
                    timestamp: Date.now(),
                });
            }

            page.hideCursor();
            setSuites((prev) =>
                prev.map((s, idx) =>
                    idx === i ? { ...s, status: "done", passed, steps: [...steps] } : s,
                ),
            );
        }

        setIsRunning(false);
    }, [activeScripts, isPageMode]);

    // Register / unregister window.__TESTBOT__ on mount/unmount
    useEffect(() => {
        registerTestBotGlobalApi(runAll, runSuite);
        return () => unregisterTestBotGlobalApi();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // register once; runAll/runSuite are stable refs via useCallback

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">

            {/* Header & Controls */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0 z-10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                        TestBot
                        <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                            {isPageMode ? "Page" : `${activeScripts.length}`}
                        </span>
                    </h2>

                    <div className="flex items-center gap-1.5">
                        {/* Copy All Failures — only when failures exist */}
                        {isFinished && failCount > 0 && (
                            <CopyFailuresButton suites={suites} />
                        )}

                        {isRunning ? (
                            <button
                                type="button"
                                onClick={() => setIsRunning(false)}
                                className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md text-xs font-semibold transition-all shadow-sm"
                            >
                                <Square size={12} className="mr-1" fill="currentColor" /> Stop
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleQuickRun}
                                    title="Quick Run (headless, no animation)"
                                    className="flex items-center px-2 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-md text-xs font-semibold transition-all"
                                >
                                    <Zap size={12} className="mr-0.5" fill="currentColor" /> Quick
                                </button>
                                <button
                                    type="button"
                                    onClick={runAll}
                                    data-testbot-run-all
                                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 border border-transparent rounded-md text-xs font-semibold transition-all shadow-md"
                                >
                                    <Play size={12} className="mr-1" fill="currentColor" />{" "}
                                    {isFinished ? "Re-Run" : "Run All"}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress / Status Bar */}
                {(isRunning || isFinished) && (
                    <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1">
                            <span>
                                {isRunning
                                    ? `Running: ${activeScripts[currentSuiteIndex]?.name || "..."}`
                                    : "Run Completed"}
                            </span>
                            <div className="flex gap-2 font-mono" id="test-results-summary">
                                <span className={passCount > 0 ? "text-emerald-600" : ""}>
                                    PASS: {passCount}
                                </span>
                                <span className={failCount > 0 ? "text-red-600" : ""}>
                                    FAIL: {failCount}
                                </span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            {isRunning ? (
                                <div
                                    className="h-full bg-blue-500 animate-pulse rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(currentSuiteIndex / activeScripts.length) * 100}%`,
                                    }}
                                />
                            ) : (
                                <div className="flex h-full w-full rounded-full overflow-hidden">
                                    <div style={{ flex: passCount }} className="bg-emerald-500" />
                                    <div style={{ flex: failCount }} className="bg-red-500" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Embedded Widgets (ARIA mode only) */}
            {!isPageMode && (
                <div
                    ref={containerRef}
                    className="px-3 py-2 bg-slate-100/60 border-b border-slate-200 shrink-0"
                    style={{ position: "relative" }}
                >
                    <p className="text-[9px] font-mono text-slate-400 uppercase mb-1.5 tracking-wider">Test Subjects</p>
                    <div className="flex flex-col gap-1.5">
                        <Zone
                            id="lb-zone"
                            role="listbox"
                            options={{ navigate: { orientation: "vertical", loop: false, entry: "first" } }}
                            className="flex gap-1"
                        >
                            {["lb-apple", "lb-banana", "lb-cherry", "lb-date", "lb-elderberry"].map((id, i) => (
                                <Item key={id} id={id} className={ITEM_CLS}>
                                    {["🍎", "🍌", "🍒", "🌴", "🫐"][i]}
                                </Item>
                            ))}
                        </Zone>
                        <div className="flex gap-2">
                            <Zone
                                id="tb-zone"
                                role="toolbar"
                                options={{ navigate: { orientation: "horizontal", loop: true, entry: "first" } }}
                                className="flex gap-1"
                            >
                                {[{ id: "tb-bold", l: "B" }, { id: "tb-italic", l: "I" }, { id: "tb-underline", l: "U" }, { id: "tb-link", l: "🔗" }].map(({ id, l }) => (
                                    <Item key={id} id={id} className={TOOL_CLS}>{l}</Item>
                                ))}
                            </Zone>
                            <Zone
                                id="rg-zone"
                                role="listbox"
                                options={{ navigate: { orientation: "vertical", loop: true, entry: "first" }, select: { followFocus: true, disallowEmpty: true } }}
                                className="flex gap-1"
                            >
                                {[{ id: "rg-sm", l: "S" }, { id: "rg-md", l: "M" }, { id: "rg-lg", l: "L" }].map(({ id, l }) => (
                                    <Item key={id} id={id} className={RADIO_CLS}>{l}</Item>
                                ))}
                            </Zone>
                            <Zone
                                id="gr-zone"
                                role="grid"
                                options={{ navigate: { orientation: "horizontal" }, select: { mode: "multiple", toggle: true, range: true } }}
                                className="grid grid-cols-2 gap-1"
                            >
                                {[0, 1, 2, 3].map((i) => (
                                    <Item key={i} id={`gr-cell-${i}`} role="gridcell" className={CELL_CLS}>{i}</Item>
                                ))}
                            </Zone>
                        </div>
                    </div>
                </div>
            )}

            {/* Suite List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
                {suites.length === 0 && !isRunning && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Play size={16} />
                        </div>
                        <p className="text-xs">Ready to start testing</p>
                    </div>
                )}

                {suites.map((suite, si) => {
                    const isRunningSuite = suite.status === "running";
                    const isPending = suite.status === "planned";
                    const isExpanded =
                        isRunningSuite ||
                        expandedSuites.has(suite.name) ||
                        (isFinished && !suite.passed);

                    return (
                        <div
                            key={suite.name}
                            ref={isRunningSuite ? activeSuiteRef : null}
                            data-testbot-suite={suite.name}
                            data-testbot-index={si}
                            data-testbot-status={suite.status}
                            data-testbot-result={
                                suite.status === "done"
                                    ? suite.passed
                                        ? "pass"
                                        : "fail"
                                    : undefined
                            }
                            className={`bg-white rounded-lg border shadow-sm transition-all overflow-hidden mb-3 ${isRunningSuite
                                ? "border-blue-400 ring-4 ring-blue-50/50 shadow-md scale-[1.02]"
                                : isPending
                                    ? "border-slate-200 border-dashed opacity-60"
                                    : suite.passed
                                        ? "border-slate-200 opacity-80"
                                        : "border-red-200 ring-1 ring-red-50"
                                }`}
                        >
                            {/* Suite Header */}
                            <div
                                role="button"
                                onClick={() => toggleSuite(suite.name)}
                                className="group/suite w-full flex items-center px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="mr-3 shrink-0 transition-transform duration-300">
                                    {isPending ? (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); runSuite(si); }}
                                            data-testbot-run={si}
                                            className="w-8 h-8 flex items-center justify-center -ml-1 -mt-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative z-10"
                                            title={`Run "${suite.name}"`}
                                        >
                                            <Play size={16} fill="currentColor" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); runSuite(si); }}
                                            disabled={isRunningSuite}
                                            data-testbot-run={si}
                                            className="group/icon w-6 h-6 flex items-center justify-center relative z-20 bg-white rounded-full ring-4 ring-white transition-transform hover:scale-110"
                                            title={`Re-run "${suite.name}"`}
                                        >
                                            {isRunningSuite ? (
                                                <RefreshCw size={16} className="text-amber-500 animate-spin" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-100 group-hover/icon:opacity-0">
                                                        {suite.passed ? (
                                                            <Check size={16} className="text-emerald-500" strokeWidth={2.5} />
                                                        ) : (
                                                            <X size={16} className="text-red-500" strokeWidth={2.5} />
                                                        )}
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 group-hover/icon:opacity-100 text-blue-500">
                                                        <Play size={16} fill="currentColor" />
                                                    </div>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3
                                        className={`text-xs font-semibold truncate transition-colors ${isRunningSuite
                                            ? "text-blue-700"
                                            : isPending
                                                ? "text-slate-500"
                                                : suite.passed
                                                    ? "text-slate-700"
                                                    : "text-red-700"
                                            }`}
                                    >
                                        {suite.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-400">
                                        {suite.steps.length} steps
                                    </p>
                                </div>

                                <CopyLogButton suite={suite} />

                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                />
                            </div>

                            {/* Details (Expanded) */}
                            {isExpanded && (
                                <SuiteDetails
                                    steps={suite.steps}
                                    isRunning={isRunningSuite}
                                    activeStepIndex={isRunningSuite ? suite.steps.length - 1 : -1}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Hidden machine-readable results for LLM agents */}
                {isFinished && (
                    <pre
                        id="testbot-results-json"
                        data-testbot-results
                        style={{ display: "none" }}
                    >
                        {JSON.stringify(
                            suites.map((s) => ({
                                name: s.name,
                                passed: s.passed,
                                steps: s.steps.map((step) => ({
                                    action: step.action,
                                    detail: step.detail,
                                    passed: step.result === "pass",
                                    error: step.error || null,
                                })),
                            })),
                        )}
                    </pre>
                )}
            </div>
        </div>
    );
}
