/**
 * BddReplayPanel — Run BDD test files in the browser, record interactions, replay.
 *
 * Architecture:
 *   1. Dynamic import test file → spec-wrapper wraps as __runSpec__()
 *   2. __runSpec__() calls vitest shim → describe/it register into registry
 *   3. Set interaction observer → simulateKeyPress/Click record snapshots
 *   4. Walk registry, execute each test with beforeEach hooks
 *   5. Display results + interaction timeline with replay
 */

import { type InteractionRecord, setInteractionObserver } from "@os/headless";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  MousePointer2,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
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
  /** Interaction records captured during this test */
  records: InteractionRecord[];
}

// ── Test file catalog ──

const TEST_FILES = [
  {
    label: "Todo BDD",
    path: "tests/integration/todo-bdd.test.ts",
    loader: () => import("@apps/todo/tests/integration/todo-bdd.test.ts"),
  },
];

// ── Execute tests from registry with recording ──

function executeRegistryTests(sourceFile: string): TestResult[] {
  const results: TestResult[] = [];
  const entries = getEntriesByFile(sourceFile);

  function runEntry(
    entry: TestEntry,
    suiteName: string,
    parentBeforeEach: Function[] = [],
  ) {
    if (entry.type === "describe" && entry.children) {
      const hooks = [...parentBeforeEach, ...(entry.beforeEach || [])];
      for (const child of entry.children) {
        runEntry(child, entry.name, hooks);
      }
    } else if (entry.type === "test") {
      // Collect interaction records for this test
      const records: InteractionRecord[] = [];
      setInteractionObserver((record) => records.push(record));

      // Run beforeEach hooks
      for (const hook of parentBeforeEach) {
        try {
          hook();
        } catch {
          /* swallow hook errors */
        }
      }

      const start = performance.now();
      try {
        entry.fn();
        results.push({
          suite: suiteName,
          name: entry.name,
          status: "pass",
          duration: performance.now() - start,
          records,
        });
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : String(e);
        results.push({
          suite: suiteName,
          name: entry.name,
          status: "fail",
          error: err,
          duration: performance.now() - start,
          records,
        });
      }

      setInteractionObserver(null);
    }
  }

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
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [replayIdx, setReplayIdx] = useState(-1);

  const run = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setSelectedTest(null);
    setReplayIdx(-1);

    clearEntriesForFile(selectedFile.path);

    const start = performance.now();
    try {
      const mod = await selectedFile.loader();
      if (mod && typeof (mod as Record<string, unknown>)["default"] === "function") {
        (mod as Record<string, unknown> & { default: () => void }).default();
      }
      const testResults = executeRegistryTests(selectedFile.path);
      setResults(testResults);
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      setResults([
        {
          suite: "Error",
          name: "Import failed",
          status: "fail",
          error: err,
          duration: 0,
          records: [],
        },
      ]);
    }

    setDuration(performance.now() - start);
    setRunning(false);
  }, [selectedFile]);

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const totalRecords = results.reduce((acc, r) => acc + r.records.length, 0);

  // Group results by suite
  const suiteMap = new Map<string, TestResult[]>();
  for (const r of results) {
    if (!suiteMap.has(r.suite)) suiteMap.set(r.suite, []);
    suiteMap.get(r.suite)!.push(r);
  }

  // ── Replay view ──
  if (selectedTest) {
    const records = selectedTest.records;
    const current =
      replayIdx >= 0 && replayIdx < records.length ? records[replayIdx] : null;

    return (
      <div className="flex flex-col h-full bg-white text-[13px]">
        {/* Replay Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-200 bg-indigo-50">
          <button
            type="button"
            onClick={() => {
              setSelectedTest(null);
              setReplayIdx(-1);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back
          </button>
          <span className="text-xs font-bold text-indigo-900 truncate flex-1">
            {selectedTest.name}
          </span>
          <span className="text-[10px] text-indigo-400 font-mono">
            {records.length} steps
          </span>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-stone-100 bg-stone-50">
          <button
            type="button"
            onClick={() => setReplayIdx(Math.max(0, replayIdx - 1))}
            disabled={replayIdx <= 0}
            className="p-0.5 rounded hover:bg-stone-200 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[10px] font-mono text-stone-500 min-w-[40px] text-center">
            {replayIdx + 1}/{records.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setReplayIdx(Math.min(records.length - 1, replayIdx + 1))
            }
            disabled={replayIdx >= records.length - 1}
            className="p-0.5 rounded hover:bg-stone-200 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Step List */}
        <div className="flex-1 overflow-y-auto">
          {records.map((rec, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setReplayIdx(i)}
              className={`w-full flex items-center gap-2 px-3 py-1 text-left text-xs border-l-2 transition-colors ${i === replayIdx
                ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                : "border-transparent hover:bg-stone-50 text-stone-600"
                }`}
            >
              {rec.type === "press" ? (
                <Keyboard size={12} className="text-blue-500 flex-shrink-0" />
              ) : (
                <MousePointer2
                  size={12}
                  className="text-amber-500 flex-shrink-0"
                />
              )}
              <span className="font-mono truncate">{rec.label}</span>
            </button>
          ))}
        </div>

        {/* State Diff */}
        {current && (
          <div className="border-t border-stone-200 bg-stone-50 px-3 py-2 max-h-[200px] overflow-y-auto">
            <div className="text-[10px] font-bold text-stone-400 uppercase mb-1">
              State Change
            </div>
            <StateDiff
              before={current.stateBefore}
              after={current.stateAfter}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Test List view ──
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
            <option key={f.label} value={f.label}>
              {f.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded hover:bg-emerald-600 disabled:opacity-50"
        >
          {running ? (
            <RotateCcw size={12} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
          {running ? "Running..." : "Run"}
        </button>

        {results.length > 0 && (
          <div className="flex items-center gap-2 ml-auto text-xs">
            <span className="text-emerald-600 font-bold">{passed} ✓</span>
            {failed > 0 && (
              <span className="text-red-600 font-bold">{failed} ✗</span>
            )}
            <span className="text-stone-400 font-mono">
              {Math.round(duration)}ms
            </span>
            {totalRecords > 0 && (
              <span className="text-indigo-400 font-mono text-[10px]">
                {totalRecords} steps
              </span>
            )}
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
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedTest(t);
                  setReplayIdx(0);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors ${t.status === "fail"
                  ? "bg-red-50 hover:bg-red-100"
                  : "hover:bg-stone-50"
                  }`}
              >
                {t.status === "pass" ? (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 flex-shrink-0"
                  />
                ) : (
                  <XCircle size={14} className="text-red-500 flex-shrink-0" />
                )}
                <span
                  className={`flex-1 truncate ${t.status === "fail" ? "text-red-700" : "text-stone-700"}`}
                >
                  {t.name}
                </span>
                {t.records.length > 0 && (
                  <span className="text-indigo-400 font-mono text-[10px]">
                    {t.records.length} steps
                  </span>
                )}
                <span className="text-stone-400 font-mono text-[10px]">
                  {t.duration < 1 ? "<1" : Math.round(t.duration)}ms
                </span>
              </button>
            ))}
            {tests
              .filter((t) => t.error)
              .map((t, i) => (
                <div
                  key={`err-${i}`}
                  className="mx-4 my-1 p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-600 font-mono"
                >
                  <span className="font-bold">✕ {t.name}:</span> {t.error}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Simple State Diff ──

/** Minimal shape for state diff operations */
interface FocusSnapshot {
  activeZoneId?: string | null;
  zones?: Record<string, { focusedItemId?: string | null; selection?: string[] }>;
}

interface DiffableState {
  focus?: FocusSnapshot;
}

function StateDiff({ before, after }: { before: unknown; after: unknown }) {
  const b = before as DiffableState | null;
  const a = after as DiffableState | null;

  if (!b || !a)
    return <div className="text-[10px] text-stone-400">No state data</div>;

  const changes: { path: string; from: string; to: string }[] = [];

  // Compare focus state
  const bFocus = b.focus;
  const aFocus = a.focus;
  if (bFocus && aFocus) {
    if (bFocus.activeZoneId !== aFocus.activeZoneId) {
      changes.push({
        path: "activeZoneId",
        from: String(bFocus.activeZoneId),
        to: String(aFocus.activeZoneId),
      });
    }
    // Compare zone states
    const allZones = new Set([
      ...Object.keys(bFocus.zones || {}),
      ...Object.keys(aFocus.zones || {}),
    ]);
    for (const z of allZones) {
      const bz = bFocus.zones?.[z];
      const az = aFocus.zones?.[z];
      if (bz?.focusedItemId !== az?.focusedItemId) {
        changes.push({
          path: `${z}.focusedItemId`,
          from: String(bz?.focusedItemId ?? "null"),
          to: String(az?.focusedItemId ?? "null"),
        });
      }
      const bs = JSON.stringify(bz?.selection ?? []);
      const as2 = JSON.stringify(az?.selection ?? []);
      if (bs !== as2) {
        changes.push({
          path: `${z}.selection`,
          from: bs,
          to: as2,
        });
      }
    }
  }

  if (changes.length === 0) {
    return (
      <div className="text-[10px] text-stone-400 italic">
        No focus state changes
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {changes.map((c, i) => (
        <div
          key={i}
          className="flex items-baseline gap-1 text-[10px] font-mono"
        >
          <span className="text-stone-500">{c.path}:</span>
          <span className="text-red-400 line-through">{c.from}</span>
          <span className="text-stone-300">→</span>
          <span className="text-emerald-600">{c.to}</span>
        </div>
      ))}
    </div>
  );
}
