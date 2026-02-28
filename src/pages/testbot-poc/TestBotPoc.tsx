/**
 * TestBot POC — Visual Browser ARIA Test Runner
 *
 * Uses shared test scripts from @os/testing/scripts.
 * Same test code runs in:
 *   1. This browser visual (createBrowserPage)
 *   2. Headless vitest (createHeadlessPage)
 *   3. Playwright E2E (native page)
 */

import { useCallback, useRef, useState } from "react";
import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import {
    createBrowserPage,
    expect,
    allAriaScripts,
    type BrowserStep,
    type TestScript,
} from "@os/testing";

// ═══════════════════════════════════════════════════════════════════
// Shared Focus Item Style
// ═══════════════════════════════════════════════════════════════════

const ITEM_CLS = `px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer select-none
  bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300
  data-[focused=true]:bg-indigo-500/20 data-[focused=true]:text-indigo-300
  data-[focused=true]:ring-1 data-[focused=true]:ring-indigo-500/40
  data-[focused=true]:shadow-lg data-[focused=true]:shadow-indigo-500/10`;

const TOOL_CLS = `px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none
  bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300
  data-[focused=true]:bg-sky-500/20 data-[focused=true]:text-sky-300
  data-[focused=true]:ring-1 data-[focused=true]:ring-sky-500/40`;

const RADIO_CLS = `px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer select-none
  bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300
  data-[focused=true]:bg-violet-500/20 data-[focused=true]:text-violet-300
  data-[focused=true]:ring-1 data-[focused=true]:ring-violet-500/40
  aria-[selected=true]:bg-violet-500/20 aria-[selected=true]:text-violet-300
  aria-[selected=true]:ring-1 aria-[selected=true]:ring-violet-500/40`;

const CELL_CLS = `aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-150 cursor-pointer select-none
  bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300
  aria-[selected=true]:bg-emerald-500/20 aria-[selected=true]:text-emerald-300
  aria-[selected=true]:ring-1 aria-[selected=true]:ring-emerald-500/40
  data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500
  data-[focused=true]:ring-offset-1 data-[focused=true]:ring-offset-slate-900`;

// ═══════════════════════════════════════════════════════════════════
// Test Component
// ═══════════════════════════════════════════════════════════════════

export function TestBotPoc() {
    const [logs, setLogs] = useState<BrowserStep[]>([]);
    const [running, setRunning] = useState(false);
    const [currentSuite, setCurrentSuite] = useState<string | null>(null);
    const [suiteResults, setSuiteResults] = useState<Map<string, "pass" | "fail">>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    const addLog = useCallback((step: BrowserStep) => {
        setLogs((prev) => [...prev, step]);
    }, []);

    const runAll = useCallback(async () => {
        setRunning(true);
        setLogs([]);
        setSuiteResults(new Map());

        const container = containerRef.current;
        if (!container) return;

        const page = createBrowserPage(container, {
            speed: 3,
            onStep: addLog,
        });

        for (const script of allAriaScripts) {
            setCurrentSuite(script.name);
            addLog({
                action: "assert",
                detail: `── ${script.name} ──`,
                result: "pass",
                timestamp: Date.now(),
            });

            try {
                await script.run(page, expect);
                setSuiteResults((prev) => new Map(prev).set(script.name, "pass"));
            } catch (e) {
                addLog({
                    action: "assert",
                    detail: `✗ ${script.name}: ${e}`,
                    result: "fail",
                    error: String(e),
                    timestamp: Date.now(),
                });
                setSuiteResults((prev) => new Map(prev).set(script.name, "fail"));
            }
        }

        addLog({
            action: "assert",
            detail: "✅ All suites complete",
            result: "pass",
            timestamp: Date.now(),
        });

        page.hideCursor();
        setCurrentSuite(null);
        setRunning(false);
    }, [addLog]);

    const runSingle = useCallback(async (script: TestScript) => {
        setRunning(true);
        setLogs([]);

        const container = containerRef.current;
        if (!container) return;

        const page = createBrowserPage(container, {
            speed: 3,
            onStep: addLog,
        });

        setCurrentSuite(script.name);

        try {
            await script.run(page, expect);
            setSuiteResults((prev) => new Map(prev).set(script.name, "pass"));
            addLog({
                action: "assert",
                detail: `✅ ${script.name} — PASSED`,
                result: "pass",
                timestamp: Date.now(),
            });
        } catch (e) {
            addLog({
                action: "assert",
                detail: `✗ ${script.name}: ${e}`,
                result: "fail",
                error: String(e),
                timestamp: Date.now(),
            });
            setSuiteResults((prev) => new Map(prev).set(script.name, "fail"));
        }

        page.hideCursor();
        setCurrentSuite(null);
        setRunning(false);
    }, [addLog]);

    const passed = logs.filter((l) => l.result === "pass").length;
    const failed = logs.filter((l) => l.result === "fail").length;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* ── Left: Test Subjects ── */}
            <div
                className="flex-1 flex items-start justify-center pt-10 overflow-y-auto"
                ref={containerRef}
                style={{ position: "relative" }}
            >
                <div className="flex flex-col gap-5 items-center pb-10">
                    {/* Listbox */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-6 shadow-2xl w-[340px]">
                        <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <span className="text-indigo-400">◆</span> Listbox
                            <span className="ml-auto text-[10px] text-slate-600 font-mono">vertical · no-loop · followFocus</span>
                        </h2>
                        <Zone
                            id="lb-zone"
                            role="listbox"
                            options={{ navigate: { orientation: "vertical", loop: false, entry: "first" } }}
                            className="flex flex-col gap-1"
                        >
                            {[
                                { id: "lb-apple", label: "🍎 Apple" },
                                { id: "lb-banana", label: "🍌 Banana" },
                                { id: "lb-cherry", label: "🍒 Cherry" },
                                { id: "lb-date", label: "🌴 Date" },
                                { id: "lb-elderberry", label: "🫐 Elderberry" },
                            ].map((item) => (
                                <Item key={item.id} id={item.id} className={ITEM_CLS}>
                                    {item.label}
                                </Item>
                            ))}
                        </Zone>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-6 shadow-2xl w-[340px]">
                        <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <span className="text-sky-400">◆</span> Toolbar
                            <span className="ml-auto text-[10px] text-slate-600 font-mono">horizontal · loop</span>
                        </h2>
                        <Zone
                            id="tb-zone"
                            role="toolbar"
                            options={{ navigate: { orientation: "horizontal", loop: true, entry: "first" } }}
                            className="flex gap-1"
                        >
                            {[
                                { id: "tb-bold", label: "B" },
                                { id: "tb-italic", label: "I" },
                                { id: "tb-underline", label: "U" },
                                { id: "tb-link", label: "🔗" },
                            ].map((item) => (
                                <Item key={item.id} id={item.id} className={TOOL_CLS}>
                                    {item.label}
                                </Item>
                            ))}
                        </Zone>
                    </div>

                    {/* Grid (Multi-Select) */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-6 shadow-2xl w-[340px]">
                        <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <span className="text-emerald-400">◆</span> Grid
                            <span className="ml-auto text-[10px] text-slate-600 font-mono">multi · toggle · range</span>
                        </h2>
                        <Zone
                            id="gr-zone"
                            role="grid"
                            options={{
                                navigate: { orientation: "horizontal" },
                                select: { mode: "multiple", toggle: true, range: true },
                            }}
                            className="grid grid-cols-4 gap-2"
                        >
                            {Array.from({ length: 4 }, (_, i) => (
                                <Item key={i} id={`gr-cell-${i}`} role="gridcell" className={CELL_CLS}>
                                    {i}
                                </Item>
                            ))}
                        </Zone>
                        <p className="text-[10px] text-slate-600 mt-2">⌘+Click toggle · Shift+Click range</p>
                    </div>

                    {/* Radiogroup */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-6 shadow-2xl w-[340px]">
                        <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <span className="text-violet-400">◆</span> Radiogroup
                            <span className="ml-auto text-[10px] text-slate-600 font-mono">loop · followFocus · disallowEmpty</span>
                        </h2>
                        <Zone
                            id="rg-zone"
                            role="listbox"
                            options={{
                                navigate: { orientation: "vertical", loop: true, entry: "first" },
                                select: { followFocus: true, disallowEmpty: true },
                            }}
                            className="flex flex-col gap-1"
                        >
                            {[
                                { id: "rg-sm", label: "Small" },
                                { id: "rg-md", label: "Medium" },
                                { id: "rg-lg", label: "Large" },
                            ].map((item) => (
                                <Item key={item.id} id={item.id} className={RADIO_CLS}>
                                    {item.label}
                                </Item>
                            ))}
                        </Zone>
                    </div>
                </div>
            </div>

            {/* ── Right: Control Panel ── */}
            <div className="w-[420px] border-l border-slate-700/50 bg-slate-900/50 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-bold text-white flex items-center gap-2">
                            <span className="text-lg">🤖</span> ARIA Test Runner
                        </h1>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Playwright-compatible · 3-engine
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={runAll}
                        disabled={running}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${running
                            ? "bg-slate-700 text-slate-400 cursor-wait"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-500/20"
                            }`}
                    >
                        {running ? "⏳ Running..." : "▶ Run All"}
                    </button>
                </div>

                {/* Suite Buttons */}
                <div className="px-4 py-3 border-b border-slate-700/30 flex flex-wrap gap-1.5">
                    {allAriaScripts.map((script) => {
                        const result = suiteResults.get(script.name);
                        return (
                            <button
                                key={script.name}
                                type="button"
                                onClick={() => runSingle(script)}
                                disabled={running}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all border ${result === "pass"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : result === "fail"
                                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                                        : currentSuite === script.name
                                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                            : "bg-slate-800/50 text-slate-500 border-slate-700/30 hover:text-slate-400"
                                    } ${running ? "opacity-50 cursor-wait" : ""}`}
                            >
                                {result === "pass" ? "✓ " : result === "fail" ? "✗ " : ""}
                                {script.name.split(" — ")[0]}
                            </button>
                        );
                    })}
                </div>

                {/* Summary */}
                {logs.length > 0 && (
                    <div className="px-5 py-2 border-b border-slate-700/30 flex items-center gap-3 text-xs">
                        {passed > 0 && <span className="text-emerald-400 font-bold">{passed} ✓</span>}
                        {failed > 0 && <span className="text-red-400 font-bold">{failed} ✗</span>}
                        <span className="text-slate-500 font-mono">{logs.length} steps</span>
                    </div>
                )}

                {/* Logs */}
                <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                    {logs.length === 0 && !running && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600">
                            <span className="text-3xl mb-2 opacity-30">▶</span>
                            <p className="text-sm">Press Run All or pick a suite</p>
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${log.result === "pass"
                                ? "text-emerald-400"
                                : log.result === "fail"
                                    ? "bg-red-500/10 text-red-400"
                                    : "text-slate-500"
                                }`}
                        >
                            {log.action === "click" && <span className="text-amber-400 shrink-0">🖱</span>}
                            {log.action === "press" && <span className="text-blue-400 shrink-0">⌨</span>}
                            {log.action === "assert" && (
                                <span className={`shrink-0 ${log.result === "pass" ? "text-emerald-400" : "text-red-400"}`}>
                                    {log.result === "pass" ? "✓" : "✗"}
                                </span>
                            )}
                            <span className="truncate">{log.detail}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TestBotPoc;
