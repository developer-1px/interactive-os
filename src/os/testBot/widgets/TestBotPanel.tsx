/**
 * TestBotPanel — TestBot UI inside the Inspector
 *
 * Premium UI for running and viewing test results.
 */

import { Check, ChevronDown, Play, RefreshCw, Square, X } from "lucide-react";
import { useState } from "react";
import { TestBotActions } from "../features/TestBotActions";
import { useTestBotStore } from "../features/TestBotStore";
import { CopyLogButton } from "./CopyLogButton";
import { SuiteDetails } from "./SuiteDetails";

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function TestBotPanel() {
  const suites = useTestBotStore((s) => s.suites);
  const isRunning = useTestBotStore((s) => s.isRunning);
  const currentSuiteIndex = useTestBotStore((s) => s.currentSuiteIndex);
  const routeCount = useTestBotStore((s) => s.routeDefiners.size);

  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  const toggleSuite = (name: string) => {
    const next = new Set(expandedSuites);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedSuites(next);
  };

  // Derived counts — only count suites that have finished executing
  const doneSuites = suites.filter((s) => s.status === "done");
  const passCount = doneSuites.filter((s) => s.passed).length;
  const failCount = doneSuites.filter((s) => !s.passed).length;
  const isFinished = !isRunning && doneSuites.length > 0;

  const activeSuiteRef = (el: HTMLDivElement | null) => {
    if (el && isRunning)
      el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Header & Controls */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              TestBot Runner
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${routeCount > 0 ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}
              >
                {routeCount} Routes Active
              </span>
            </div>
          </div>

          {isRunning ? (
            <button
              onClick={TestBotActions.stop}
              className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md text-xs font-semibold transition-all shadow-sm"
            >
              <Square size={12} className="mr-1" fill="currentColor" /> Stop
            </button>
          ) : (
            <button
              onClick={TestBotActions.runAll}
              disabled={routeCount === 0}
              data-testbot-run-all
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 border border-transparent rounded-md text-xs font-semibold transition-all shadow-md disabled:opacity-50 disabled:shadow-none"
            >
              <Play size={12} className="mr-1" fill="currentColor" />{" "}
              {isFinished ? "Re-Run All" : "Run All"}
            </button>
          )}
        </div>

        {/* Progress / Status Bar */}
        {(isRunning || isFinished) && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1">
              <span>
                {isRunning
                  ? `Running: ${suites[currentSuiteIndex]?.name || "..."}`
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
                    width: `${(currentSuiteIndex / suites.length) * 100}%`,
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
              key={si}
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
              className={`bg-white rounded-lg border shadow-sm transition-all overflow-hidden mb-3 ${
                isRunningSuite
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
                onClick={() => toggleSuite(suite.name)}
                className="group/suite flex items-center px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="mr-3 shrink-0 transition-transform duration-300">
                  {isPending ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        TestBotActions.runSuite(si);
                      }}
                      data-testbot-run={si}
                      className="w-8 h-8 flex items-center justify-center -ml-1 -mt-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative z-10"
                      title={`Run "${suite.name}"`}
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        TestBotActions.runSuite(si);
                      }}
                      disabled={isRunningSuite}
                      data-testbot-run={si}
                      className="group/icon w-6 h-6 flex items-center justify-center relative z-20 bg-white rounded-full ring-4 ring-white transition-transform hover:scale-110"
                      title={`Re-run "${suite.name}"`}
                    >
                      {isRunningSuite ? (
                        <RefreshCw
                          size={16}
                          className="text-amber-500 animate-spin"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-100 group-hover/icon:opacity-0">
                            {suite.passed ? (
                              <Check
                                size={16}
                                className="text-emerald-500"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <X
                                size={16}
                                className="text-red-500"
                                strokeWidth={2.5}
                              />
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
                    className={`text-xs font-semibold truncate transition-colors ${
                      isRunningSuite
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

                {/* Copy Log Button (Right) */}
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

        {/* Hidden machine-readable results for AI/LLM agents */}
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
                  passed: step.passed,
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
