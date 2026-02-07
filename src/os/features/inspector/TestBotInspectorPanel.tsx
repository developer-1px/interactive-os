/**
 * TestBotInspectorPanel — TestBot UI inside the Inspector
 *
 * Renders test results and controls.
 * Reads from global TestBotStore — works even if Inspector was closed during test run.
 */

import { TestBotActions, useTestBotStore } from "./TestBotStore";

export function TestBotInspectorPanel() {
    const results = useTestBotStore((s) => s.results);
    const isRunning = useTestBotStore((s) => s.isRunning);
    const currentSuite = useTestBotStore((s) => s.currentSuite);
    const routeCount = useTestBotStore((s) => s.routeDefiners.size);

    const passCount = results.filter((r) => r.passed).length;
    const failCount = results.filter((r) => !r.passed).length;
    const totalSteps = results.reduce((a, r) => a + r.steps.length, 0);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Controls */}
            <div className="px-3 py-2 border-b border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#666] uppercase tracking-wide">
                        TestBot
                    </span>
                    {routeCount === 0 && (
                        <span className="text-[9px] text-slate-400">
                            No routes registered
                        </span>
                    )}
                    {results.length > 0 && (
                        <span className="text-[9px] text-slate-500 font-mono">
                            ✅{passCount} ❌{failCount} · {totalSteps} steps
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {isRunning ? (
                        <button
                            onClick={TestBotActions.stop}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            ■ Stop
                        </button>
                    ) : (
                        <button
                            onClick={TestBotActions.runAll}
                            disabled={routeCount === 0}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ▶ Run All
                        </button>
                    )}
                </div>
            </div>

            {/* Running indicator */}
            {isRunning && currentSuite && (
                <div className="px-3 py-1 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-700 font-medium shrink-0">
                    ⏳ {currentSuite}
                </div>
            )}

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {results.length === 0 && !isRunning && (
                    <div className="px-3 py-6 text-center text-[10px] text-slate-400">
                        {routeCount > 0
                            ? "▶ Run All을 눌러 테스트를 시작하세요"
                            : "테스트 라우트가 등록된 페이지로 이동하세요"}
                    </div>
                )}

                {results.map((suite, si) => (
                    <div
                        key={si}
                        className={`border-b border-slate-100 ${suite.passed ? "" : "bg-red-50/50"}`}
                    >
                        {/* Suite header */}
                        <div className="px-3 py-1.5 flex items-center gap-1.5">
                            <span className="text-[11px]">
                                {suite.passed ? "✅" : "❌"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700">
                                {suite.name}
                            </span>
                            <span className="text-[9px] text-slate-400 ml-auto">
                                {suite.steps.length} steps
                            </span>
                        </div>

                        {/* Step details */}
                        <div className="px-3 pb-1.5 space-y-px">
                            {suite.steps.map((step, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-1.5 text-[9px] font-mono ${step.passed ? "text-emerald-700" : "text-red-600"
                                        }`}
                                >
                                    <span className="shrink-0 w-3">
                                        {step.passed ? "✓" : "✗"}
                                    </span>
                                    <span className="shrink-0 text-slate-400 font-sans w-14 truncate">
                                        {step.action}
                                    </span>
                                    <span className="flex-1">
                                        {step.detail}
                                        {step.error && (
                                            <span className="block text-red-500 mt-0.5 text-[8px]">
                                                {step.error}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
