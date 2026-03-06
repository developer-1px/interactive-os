/**
 * TestBotPanel — TestBot UI inside the Inspector
 *
 * Pure test runner. State lives in kernel via defineApp.
 * Scripts auto-activated from zone-reactive manifest.
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
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import "./testbot-overlays.css";
import {
  executeAll,
  executeSuite,
  initSuites,
  progress,
  type SuiteState,
  TestBotApp,
} from "@apps/testbot/app";
import type { BrowserStep } from "@os-devtool/testing";
import { TestBotRegistry } from "@os-devtool/testing";
import { os } from "@os-sdk/os";
import { TESTBOT_MANIFEST } from "@/testing/testbot-manifest";
import {
  registerTestBotGlobalApi,
  unregisterTestBotGlobalApi,
} from "./testBotGlobalApi";

// ═══════════════════════════════════════════════════════════════════
// Key Symbol Labels
// ═══════════════════════════════════════════════════════════════════

const KEY_LABELS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Tab: "⇥ Tab",
  Enter: "↵ Enter",
  Escape: "Esc",
  " ": "Space",
  Backspace: "⌫",
  Delete: "Del",
  Home: "Home",
  End: "End",
  Shift: "⇧",
  Meta: "⌘",
  Control: "⌃",
  Alt: "⌥",
};
const displayKey = (k: string) => KEY_LABELS[k] ?? k;

// ═══════════════════════════════════════════════════════════════════
// SuiteDetails — Step timeline view
// ═══════════════════════════════════════════════════════════════════

function StepIcon({
  step,
  isActive,
}: {
  step: BrowserStep;
  isActive: boolean;
}) {
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
    return (
      <MousePointerClick size={14} className={`text-blue-500 ${bgWrap}`} />
    );
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
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isRunning]);

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
      <div className="absolute left-[24px] top-[-8px] bottom-6 w-px bg-slate-200 z-0" />

      {steps.map((step, i) => {
        const isActive = isRunning && i === activeStepIndex;
        const isPending =
          isRunning && activeStepIndex !== undefined && i > activeStepIndex;
        const isAssert = step.action === "assert";
        const isLast = i === steps.length - 1;
        const passed = step.result === "pass";

        return (
          <div
            key={`${i}-${step.action}`}
            ref={isActive ? activeRef : null}
            data-testbot-step={i}
            data-testbot-action={step.action}
            data-testbot-step-result={
              passed ? "pass" : step.error ? "fail" : "pending"
            }
            className={`group flex items-center pl-3 pr-2 py-1.5 transition-colors relative ${
              isActive
                ? "bg-blue-50/50"
                : isPending
                  ? "opacity-50"
                  : "hover:bg-slate-50"
            } ${isLast && !isPending && !isActive ? "animate-flash" : ""}`}
          >
            <div className="shrink-0 w-6 flex justify-center mr-2 pt-0.5">
              <StepIcon step={step} isActive={!!isActive} />
            </div>

            <div className="flex-1 min-w-0 text-[11px] leading-relaxed pt-0.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-[9px] select-none font-bold ${isActive ? "text-blue-600" : "text-slate-500"}`}
                >
                  #{i + 1}
                </span>
                <span
                  className={`font-extrabold tracking-tighter uppercase text-[10px] ${
                    isActive
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
                  className={`inline-flex items-center gap-0.5 flex-wrap ${
                    isActive
                      ? "text-blue-900"
                      : isPending
                        ? "text-slate-400"
                        : passed
                          ? "text-slate-700"
                          : "text-red-700 font-medium"
                  }`}
                >
                  {step.action === "press" ? (
                    step.detail.split("+").map((key, ki, arr) => (
                      <span
                        key={ki}
                        className="inline-flex items-center gap-0.5"
                      >
                        <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white border border-slate-200 border-b-[3px] border-b-slate-300 rounded-[4px] text-[10px] font-sans text-slate-600 font-bold uppercase select-none transition-transform active:border-b-0 active:translate-y-[3px] shadow-sm">
                          {displayKey(key)}
                        </kbd>
                        {ki < arr.length - 1 && (
                          <span className="text-[9px] text-slate-400 font-bold select-none">
                            +
                          </span>
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
// Copy helpers
// ═══════════════════════════════════════════════════════════════════

function formatLog(suites: SuiteState[], failedOnly = false): string {
  const targets = failedOnly
    ? suites.filter((s) => s.status === "done" && !s.passed)
    : suites;
  if (targets.length === 0) return failedOnly ? "All tests passed ✅" : "";

  const lines: string[] = failedOnly
    ? [
        `TestBot: ${targets.length} FAIL / ${suites.filter((s) => s.status === "done").length} total`,
        "",
      ]
    : [];

  for (const suite of targets) {
    const icon = suite.passed ? "✅" : "❌";
    lines.push(`${icon} ${suite.name} (${suite.passed ? "PASS" : "FAIL"})`);
    for (const step of suite.steps) {
      const si = step.error ? "💥" : step.result === "pass" ? "✅" : "⬜";
      lines.push(`  ${si} [${step.action}] ${step.detail}`);
      if (step.error) lines.push(`     → ${step.error}`);
    }
    if (!suite.passed && suite.diagnostics) {
      lines.push("");
      lines.push(suite.diagnostics);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function CopyButton({
  getText,
  label,
  size = 14,
  className = "",
}: {
  getText: () => string;
  label?: string;
  size?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const done = copied
    ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
    : "";
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy"
      className={`transition-all ${done || className}`}
    >
      {copied ? <Check size={size} strokeWidth={2.5} /> : <Copy size={size} />}
      {label && <span className="ml-0.5">{copied ? "Copied" : label}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TestBotPanel — reads from kernel store, dispatches actions
// ═══════════════════════════════════════════════════════════════════

export function TestBotPanel() {
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  // ── Kernel store ──
  const suites = TestBotApp.useComputed((s) => s.suites);
  const isRunning = TestBotApp.useComputed((s) => s.isRunning);
  const currentIndex = TestBotApp.useComputed((s) => s.currentIndex);
  const { passCount, failCount, isFinished } = TestBotApp.useComputed((s) =>
    progress.select(s),
  );

  // ── Zone-reactive scripts ──
  const activeScripts = useSyncExternalStore(
    (cb) => TestBotRegistry.subscribe(cb),
    () => TestBotRegistry.getScripts(),
    () => [],
  );

  // Ref keeps callbacks stable — prevents useEffect feedback loop
  const scriptsRef = useRef(activeScripts);
  scriptsRef.current = activeScripts;

  // When scripts change, init suites as "planned"
  useEffect(() => {
    os.dispatch(
      initSuites({
        scripts: activeScripts.map((s) => ({
          name: s.name,
          group: s.group ?? "",
        })),
      }),
    );
  }, [activeScripts]);

  // ── Handlers (stable refs — never change) ──
  const runAll = useCallback(() => executeAll(scriptsRef.current, false), []);
  const quickRun = useCallback(() => executeAll(scriptsRef.current, true), []);
  const runSuite = useCallback(
    (si: number) => executeSuite(scriptsRef.current, si),
    [],
  );

  const toggleSuite = (name: string) => {
    const next = new Set(expandedSuites);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedSuites(next);
  };

  const activeSuiteRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && isRunning) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [isRunning],
  );

  // ── Global API + zone-reactive init ──
  useEffect(() => {
    registerTestBotGlobalApi(runAll, runSuite);
    const teardown = TestBotRegistry.initZoneReactive(TESTBOT_MANIFEST);
    return () => {
      unregisterTestBotGlobalApi();
      teardown();
    };
  }, [runAll, runSuite]);

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Header & Controls */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            TestBot
            <span className="ml-1.5 text-[10px] font-medium text-slate-400">
              {activeScripts.length}
            </span>
          </h2>

          <div className="flex items-center gap-1.5">
            {isFinished && failCount > 0 && (
              <CopyButton
                getText={() => formatLog(suites, true)}
                label="Copy Failures"
                size={10}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              />
            )}

            {isRunning ? (
              <button
                type="button"
                onClick={() =>
                  os.dispatch({ type: "testbot:allDone" } as never)
                }
                className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md text-xs font-semibold transition-all shadow-sm"
              >
                <Square size={12} className="mr-1" fill="currentColor" /> Stop
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={quickRun}
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
                  ? `Running: ${suites[currentIndex]?.name || "..."}`
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
                    width: `${(currentIndex / activeScripts.length) * 100}%`,
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
            <p className="text-xs">No test scripts available</p>
          </div>
        )}

        {(() => {
          // Group suites by group name, preserving original indices
          const groups = new Map<
            string,
            { suite: (typeof suites)[0]; si: number }[]
          >();
          suites.forEach((suite, si) => {
            const g = suite.group || "Ungrouped";
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g)?.push({ suite, si });
          });

          return Array.from(groups.entries()).map(([groupName, entries]) => {
            const groupDone = entries.filter((e) => e.suite.status === "done");
            const groupPass = groupDone.filter((e) => e.suite.passed).length;
            const groupFail = groupDone.length - groupPass;
            const groupStatus =
              groupDone.length === 0 ? "🔘" : groupFail > 0 ? "❌" : "✅";

            return (
              <div key={groupName} className="mb-4">
                {/* Group Header */}
                <div className="flex items-center gap-2 px-1 mb-2">
                  <span className="text-xs">{groupStatus}</span>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {groupName}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {groupPass}/{entries.length}
                    {groupFail > 0 && (
                      <span className="text-red-400 ml-1">
                        ({groupFail} fail)
                      </span>
                    )}
                  </span>
                </div>

                {/* Suites in group */}
                {entries.map(({ suite, si }) => {
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
                        role="button"
                        onClick={() => toggleSuite(suite.name)}
                        className="group/suite w-full flex items-center px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="mr-3 shrink-0 transition-transform duration-300">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                runSuite(si);
                              }}
                              data-testbot-run={si}
                              className="w-8 h-8 flex items-center justify-center -ml-1 -mt-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative z-10"
                              title={`Run "${suite.name}"`}
                            >
                              <Play size={16} fill="currentColor" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                runSuite(si);
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
                          <p className="text-[11px] font-semibold text-slate-700 line-clamp-2">
                            {suite.name}
                          </p>
                          {!isPending && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {suite.steps.length} steps ·{" "}
                              {
                                suite.steps.filter((s) => s.result === "fail")
                                  .length
                              }{" "}
                              failed
                            </p>
                          )}
                        </div>

                        <CopyButton
                          getText={() => formatLog([suite])}
                          className="shrink-0 p-1.5 rounded-full text-slate-300 hover:text-blue-500 hover:bg-blue-50"
                        />

                        <ChevronDown
                          size={14}
                          className={`shrink-0 ml-1 text-slate-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <SuiteDetails
                          steps={suite.steps}
                          isRunning={isRunningSuite}
                          activeStepIndex={
                            isRunningSuite ? suite.steps.length - 1 : -1
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
