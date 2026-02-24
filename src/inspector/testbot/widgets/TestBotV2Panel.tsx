/**
 * TestBotV2Panel — TestBot v2 Report Viewer
 *
 * Loads testbot-report.json and displays test results in a
 * hierarchical view: Files → Suites → Tests with pass/fail status.
 *
 * Purpose: Human verification of LLM-written tests.
 * Future: Replay engine with cursor animations and PASS/FAIL stamps.
 */

import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════
// Types (matching TestBotReporter output)
// ═══════════════════════════════════════════════════════════════════

interface ReportTest {
  name: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  error?: string;
}

interface ReportSuite {
  name: string;
  tests: ReportTest[];
  suites: ReportSuite[];
}

interface ReportFile {
  file: string;
  duration: number;
  suites: ReportSuite[];
}

interface TestBotReport {
  version: number;
  createdAt: string;
  duration: number;
  summary: {
    files: number;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  files: ReportFile[];
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function shortPath(fullPath: string): string {
  const idx = fullPath.indexOf("src/");
  return idx >= 0 ? fullPath.slice(idx) : fullPath;
}

function countTestsInSuites(suites: ReportSuite[]): {
  pass: number;
  fail: number;
  skip: number;
} {
  let pass = 0;
  let fail = 0;
  let skip = 0;
  for (const s of suites) {
    for (const t of s.tests) {
      if (t.status === "pass") pass++;
      else if (t.status === "fail") fail++;
      else skip++;
    }
    const nested = countTestsInSuites(s.suites);
    pass += nested.pass;
    fail += nested.fail;
    skip += nested.skip;
  }
  return { pass, fail, skip };
}

function formatMs(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// ═══════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════

function StatusIcon({ status }: { status: "pass" | "fail" | "skip" }) {
  switch (status) {
    case "pass":
      return (
        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check size={10} className="text-emerald-600" strokeWidth={3} />
        </div>
      );
    case "fail":
      return (
        <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
          <X size={10} className="text-red-600" strokeWidth={3} />
        </div>
      );
    case "skip":
      return (
        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        </div>
      );
  }
}

function TestRow({ test }: { test: ReportTest }) {
  const [showError, setShowError] = useState(false);

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1 px-3 text-[11px] hover:bg-slate-50 transition-colors ${
          test.status === "fail" ? "cursor-pointer" : ""
        }`}
        onClick={() => test.error && setShowError(!showError)}
      >
        <StatusIcon status={test.status} />
        <span
          className={`flex-1 ${test.status === "fail" ? "text-red-700 font-medium" : "text-slate-600"}`}
        >
          {test.name}
        </span>
        <span className="text-[9px] text-slate-400 font-mono tabular-nums">
          {formatMs(test.duration)}
        </span>
      </div>
      {showError && test.error && (
        <div className="mx-3 mb-1 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-[10px] text-red-700 font-mono whitespace-pre-wrap break-all">
          {test.error}
        </div>
      )}
    </div>
  );
}

function SuiteBlock({ suite, depth }: { suite: ReportSuite; depth: number }) {
  const counts = countTestsInSuites([suite]);
  const hasFails = counts.fail > 0;
  const [expanded, setExpanded] = useState(hasFails);

  return (
    <div className={depth > 0 ? "ml-3 border-l border-slate-100" : ""}>
      <div
        className="flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-slate-50 transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown size={12} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
        )}
        <span
          className={`text-[11px] font-semibold flex-1 ${hasFails ? "text-red-700" : "text-slate-700"}`}
        >
          {suite.name}
        </span>
        <span className="text-[9px] text-slate-400 font-mono">
          {counts.pass > 0 && (
            <span className="text-emerald-500">{counts.pass}✓</span>
          )}
          {counts.fail > 0 && (
            <span className="text-red-500 ml-1">{counts.fail}✗</span>
          )}
        </span>
      </div>

      {expanded && (
        <div>
          {suite.tests.map((test) => (
            <TestRow key={test.name} test={test} />
          ))}
          {suite.suites.map((s) => (
            <SuiteBlock key={s.name} suite={s} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileBlock({ file }: { file: ReportFile }) {
  const counts = countTestsInSuites(file.suites);
  const hasFails = counts.fail > 0;
  const total = counts.pass + counts.fail + counts.skip;
  const [expanded, setExpanded] = useState(hasFails);

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${
        hasFails ? "border-red-200 ring-1 ring-red-50" : "border-slate-200"
      }`}
    >
      {/* File Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <FileText
          size={14}
          className={hasFails ? "text-red-400" : "text-emerald-400"}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-700 truncate">
            {shortPath(file.file)}
          </p>
          <p className="text-[9px] text-slate-400">
            {total} tests · {formatMs(file.duration)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {counts.pass > 0 && (
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {counts.pass}✓
            </span>
          )}
          {counts.fail > 0 && (
            <span className="text-[10px] font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              {counts.fail}✗
            </span>
          )}
          {expanded ? (
            <ChevronDown size={14} className="text-slate-400" />
          ) : (
            <ChevronRight size={14} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Suite/Test Hierarchy */}
      {expanded && (
        <div className="border-t border-slate-100 py-1">
          {file.suites.map((suite) => (
            <SuiteBlock key={suite.name} suite={suite} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Panel
// ═══════════════════════════════════════════════════════════════════

export function TestBotV2Panel() {
  const [report, setReport] = useState<TestBotReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/testbot-report.json?" + Date.now());
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'No report found. Run "npm run test:browser" first.'
            : `Failed to load: ${res.status}`,
        );
      }
      const data = (await res.json()) as TestBotReport;
      setReport(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              TestBot v2
            </h2>
            <p className="text-[10px] text-slate-400">
              Visual test replay · Report viewer
            </p>
          </div>

          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-semibold transition-all"
          >
            <RefreshCw
              size={12}
              className={`mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Reload
          </button>
        </div>

        {/* Summary Bar */}
        {report && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1">
              <span>{relativeTime(report.createdAt)}</span>
              <div className="flex gap-2 font-mono">
                <span className="text-emerald-600">
                  PASS: {report.summary.passed}
                </span>
                <span
                  className={
                    report.summary.failed > 0
                      ? "text-red-600"
                      : "text-slate-400"
                  }
                >
                  FAIL: {report.summary.failed}
                </span>
                <span className="text-slate-400">
                  {report.summary.files} files
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="flex h-full w-full rounded-full overflow-hidden">
                <div
                  style={{ flex: report.summary.passed }}
                  className="bg-emerald-500"
                />
                <div
                  style={{ flex: report.summary.failed }}
                  className="bg-red-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-xs">Loading report...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
              <AlertCircle size={20} className="text-amber-500" />
            </div>
            <p className="text-xs text-center max-w-[200px]">{error}</p>
            <code className="text-[10px] text-slate-400 mt-2 bg-slate-100 px-2 py-1 rounded">
              npm run test:browser
            </code>
          </div>
        )}

        {report &&
          !loading &&
          report.files.map((file) => <FileBlock key={file.file} file={file} />)}
      </div>
    </div>
  );
}
