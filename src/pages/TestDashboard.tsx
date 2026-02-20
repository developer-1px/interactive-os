/**
 * TestDashboard — In-browser test runner
 *
 * Discovers all tests via import.meta.glob on the standardized
 * {slice}/tests/{unit,testbot,e2e}/ structure.
 *
 * Features:
 * - Source toggle (show/hide)
 * - Real test execution via vitest-shim
 * - Structured result tree with pass/fail/error display
 */

import {
  Bot,
  BoxSelect,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
  EyeOff,
  FileCode2,
  FlaskConical,
  FolderOpen,
  Layout,
  MinusCircle,
  Play,
  RotateCw,
  Search,
  TestTube2,
  Theater,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type SuiteResult,
  type TestEvent,
  type TestResult,
  TestRunner,
  type TestStatus,
} from "@/pages/test-runner/vitest-shim";

// ═══════════════════════════════════════════════════════════════════
// Discovery — build-time glob
// ═══════════════════════════════════════════════════════════════════

// Raw source for display
const unitFilesRaw = import.meta.glob("/src/**/tests/unit/**/*.test.ts", {
  query: "?raw",
  eager: false,
});
const e2eFilesRaw = import.meta.glob("/src/**/tests/e2e/**/*.spec.ts", {
  query: "?raw",
  eager: false,
});

// Executable modules for running
const unitFilesExec = import.meta.glob("/src/**/tests/unit/**/*.test.ts", {
  eager: false,
});
const e2eFilesExec = import.meta.glob("/src/**/tests/e2e/**/*.spec.ts", {
  eager: false,
});

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface TestFile {
  path: string;
  filename: string;
  layer: "unit" | "testbot" | "e2e";
  rawLoader: () => Promise<unknown>;
  execLoader?: () => Promise<unknown>;
}

interface ProjectGroup {
  name: string;
  slug: string;
  category: string;
  tests: TestFile[];
  layers: {
    unit: TestFile[];
    testbot: TestFile[];
    e2e: TestFile[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// Test Parser (Regex-based Static Analysis for idle state)
// ═══════════════════════════════════════════════════════════════════

interface StaticSuiteNode {
  type: "suite";
  name: string;
  children: (StaticSuiteNode | StaticTestNode)[];
  status: TestStatus;
}

interface StaticTestNode {
  type: "test";
  name: string;
  status: TestStatus;
}

function parseTestStructure(code: string): StaticSuiteNode[] {
  const lines = code.split("\n");
  const suiteStack: { node: StaticSuiteNode; indent: number }[] = [];
  const rootSuite: StaticSuiteNode = {
    type: "suite",
    name: "ROOT",
    children: [],
    status: "idle",
  };
  suiteStack.push({ node: rootSuite, indent: -1 });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line?.search(/\S/) ?? -1;
    if (indent === -1) continue;

    const trimmed = line!.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    const descMatch = trimmed.match(/^describe\s*\(\s*["'`](.*?)["'`]/);
    if (descMatch) {
      const newNode: StaticSuiteNode = {
        type: "suite",
        name: descMatch[1] ?? "",
        children: [],
        status: "idle",
      };
      while (
        suiteStack.length > 1 &&
        suiteStack[suiteStack.length - 1]!.indent >= indent
      ) {
        suiteStack.pop();
      }
      suiteStack[suiteStack.length - 1]!.node.children.push(newNode);
      suiteStack.push({ node: newNode, indent });
      continue;
    }

    const testMatch = trimmed.match(/^(it|test)\s*\(\s*["'`](.*?)["'`]/);
    if (testMatch) {
      const newNode: StaticTestNode = {
        type: "test",
        name: testMatch[2] ?? "",
        status: "idle",
      };
      while (
        suiteStack.length > 1 &&
        suiteStack[suiteStack.length - 1]!.indent >= indent
      ) {
        suiteStack.pop();
      }
      suiteStack[suiteStack.length - 1]!.node.children.push(newNode);
    }
  }

  return rootSuite.children.filter(
    (c): c is StaticSuiteNode => c.type === "suite",
  );
}

// ═══════════════════════════════════════════════════════════════════
// Parse & Group
// ═══════════════════════════════════════════════════════════════════

function extractProjectInfo(path: string): { category: string; name: string } {
  const normalized = path.replace(/^\//, "");
  if (normalized.startsWith("src/tests/")) {
    return { category: "Global", name: "Global" };
  }
  const match = normalized.match(/^src\/([^/]+)\/([^/]+)\/tests\//);
  if (match) {
    return {
      category: match[1]!.charAt(0).toUpperCase() + match[1]!.slice(1),
      name: match[2]!,
    };
  }
  const firstDir = normalized.split("/")[1];
  return { category: "Other", name: firstDir || "Unknown" };
}

function buildGroups(
  rawModules: Record<string, () => Promise<unknown>>,
  execModules: Record<string, () => Promise<unknown>>,
  e2eRawModules: Record<string, () => Promise<unknown>>,
  e2eExecModules: Record<string, () => Promise<unknown>>,
): ProjectGroup[] {
  const groupMap = new Map<string, ProjectGroup>();

  const addFile = (
    path: string,
    layer: "unit" | "testbot" | "e2e",
    rawLoader: () => Promise<unknown>,
    execLoader?: () => Promise<unknown>,
  ) => {
    const { category, name } = extractProjectInfo(path);
    const slug = `${category.toLowerCase()}-${name}`;
    const filename = path.split("/").pop() || path;

    if (!groupMap.has(slug)) {
      groupMap.set(slug, {
        name,
        slug,
        category,
        tests: [],
        layers: { unit: [], testbot: [], e2e: [] },
      });
    }

    const file: TestFile = {
      path,
      filename,
      layer,
      rawLoader,
      ...(execLoader ? { execLoader } : {}),
    };
    const group = groupMap.get(slug)!;
    group.tests.push(file);
    group.layers[layer].push(file);
  };

  for (const [path, loader] of Object.entries(rawModules)) {
    addFile(path, "unit", loader, execModules[path]);
  }
  for (const [path, loader] of Object.entries(e2eRawModules)) {
    addFile(path, "e2e", loader, e2eExecModules[path]);
  }

  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
}

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════

const LAYER_META = {
  unit: {
    icon: FlaskConical,
    label: "Unit",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  testbot: {
    icon: Bot,
    label: "TestBot",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  e2e: {
    icon: Theater,
    label: "E2E",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
} as const;

function HealthIcon({
  group,
  size = 16,
}: {
  group: ProjectGroup;
  size?: number;
}) {
  const hasUnit = group.layers.unit.length > 0;
  const hasE2E = group.layers.e2e.length > 0;

  if (hasUnit && hasE2E)
    return <CheckCircle2 size={size} className="text-emerald-500" />;
  if (hasUnit || hasE2E)
    return <MinusCircle size={size} className="text-amber-500" />;
  return <XCircle size={size} className="text-red-500" />;
}

function StatusIcon({ status }: { status: TestStatus }) {
  switch (status) {
    case "running":
      return <RotateCw size={14} className="text-blue-500 animate-spin" />;
    case "pass":
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    case "fail":
      return <XCircle size={14} className="text-red-500" />;
    default:
      return (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-200" />
      );
  }
}

function ResultNode({
  node,
  depth = 0,
}: {
  node: SuiteResult | TestResult;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);

  if (node.type === "test") {
    return (
      <div
        className="group flex items-center justify-between py-1 text-sm rounded-md hover:bg-stone-50 pr-2 transition-colors"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <StatusIcon status={node.status} />
          <span
            className={`truncate ${
              node.status === "fail"
                ? "text-red-600"
                : node.status === "pass"
                  ? "text-emerald-700"
                  : "text-stone-600"
            }`}
          >
            {node.name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {node.duration > 0 && (
            <span className="text-[10px] font-mono text-stone-400">
              {node.duration < 1 ? "<1" : Math.round(node.duration)}ms
            </span>
          )}
          {node.status === "fail" && (
            <span className="text-[10px] text-red-500 font-bold px-1.5 py-0.5 bg-red-50 rounded">
              FAIL
            </span>
          )}
          {node.status === "pass" && (
            <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">
              PASS
            </span>
          )}
        </div>
      </div>
    );
  }

  // Suite node
  const suite = node as SuiteResult;
  const testCount = countTests(suite);

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full group flex items-center justify-between py-1.5 text-sm font-semibold text-stone-800 rounded-md hover:bg-stone-50 pr-2 transition-colors"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown size={12} className="text-stone-400" />
          ) : (
            <ChevronRight size={12} className="text-stone-400" />
          )}
          <StatusIcon status={suite.status} />
          <span className="truncate">{suite.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {suite.duration > 0 && (
            <span className="text-[10px] font-mono text-stone-400">
              {Math.round(suite.duration)}ms
            </span>
          )}
          <span className="text-[9px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
            {testCount.passed}/{testCount.total}
          </span>
        </div>
      </button>

      {expanded && (
        <div>
          {suite.children.map((child, i) => (
            <ResultNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Show errors inline */}
      {expanded &&
        suite.children
          .filter(
            (c): c is TestResult =>
              c.type === "test" && c.status === "fail" && !!c.error,
          )
          .map((test, i) => (
            <div
              key={`err-${i}`}
              className="mx-4 my-1 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700 font-mono"
              style={{ marginLeft: depth * 16 + 20 }}
            >
              <span className="font-bold text-red-500">✕ {test.name}:</span>{" "}
              {test.error}
            </div>
          ))}
    </div>
  );
}

function StaticNode({
  node,
  depth = 0,
}: {
  node: StaticSuiteNode | StaticTestNode;
  depth?: number;
}) {
  if (node.type === "test") {
    return (
      <div
        className="flex items-center gap-2 py-1 text-sm text-stone-500"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-200" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div className="mb-0.5">
      <div
        className="flex items-center gap-2 py-1.5 text-sm font-semibold text-stone-700"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <ChevronDown size={12} className="text-stone-400" />
        <BoxSelect size={14} className="text-stone-400" />
        <span className="truncate">{node.name}</span>
      </div>
      <div>
        {node.children.map((child, i) => (
          <StaticNode key={i} node={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

function countTests(suite: SuiteResult): {
  total: number;
  passed: number;
  failed: number;
} {
  let total = 0;
  let passed = 0;
  let failed = 0;
  for (const child of suite.children) {
    if (child.type === "test") {
      total++;
      if (child.status === "pass") passed++;
      if (child.status === "fail") failed++;
    } else {
      const sub = countTests(child);
      total += sub.total;
      passed += sub.passed;
      failed += sub.failed;
    }
  }
  return { total, passed, failed };
}

// ═══════════════════════════════════════════════════════════════════
// Summary Bar
// ═══════════════════════════════════════════════════════════════════

function SummaryBar({
  results,
  running,
  duration,
}: {
  results: SuiteResult[];
  running: boolean;
  duration: number;
}) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  for (const suite of results) {
    const c = countTests(suite);
    total += c.total;
    passed += c.passed;
    failed += c.failed;
  }

  if (total === 0 && !running) return null;

  return (
    <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between text-xs">
      <div className="flex items-center gap-3">
        {running && (
          <div className="flex items-center gap-1.5 text-blue-600">
            <RotateCw size={12} className="animate-spin" />
            <span className="font-medium">Running...</span>
          </div>
        )}
        {!running && total > 0 && (
          <>
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={12} />
              <span className="font-bold">{passed}</span>
              <span className="text-stone-400">passed</span>
            </div>
            {failed > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle size={12} />
                <span className="font-bold">{failed}</span>
                <span className="text-stone-400">failed</span>
              </div>
            )}
            <span className="text-stone-400">{total} total</span>
          </>
        )}
      </div>
      {duration > 0 && !running && (
        <span className="font-mono text-stone-400">
          {duration < 1000
            ? `${Math.round(duration)}ms`
            : `${(duration / 1000).toFixed(2)}s`}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════

export function TestDashboard() {
  const groups = useMemo(
    () => buildGroups(unitFilesRaw, unitFilesExec, e2eFilesRaw, e2eFilesExec),
    [],
  );

  const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(
    groups[0] || null,
  );
  const [selectedFile, setSelectedFile] = useState<TestFile | null>(null);
  const [code, setCode] = useState<string>("");
  const [showSource, setShowSource] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  // Runner state
  const [results, setResults] = useState<SuiteResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runDuration, setRunDuration] = useState(0);
  const [_events, setEvents] = useState<TestEvent[]>([]);
  const runnerRef = useRef<TestRunner | null>(null);

  // Group projects by category
  const categorizedGroups = useMemo(() => {
    const map = new Map<string, ProjectGroup[]>();
    for (const group of groups) {
      if (!map.has(group.category)) map.set(group.category, []);
      map.get(group.category)?.push(group);
    }
    return map;
  }, [groups]);

  const toggleCategory = (category: string) => {
    const newSet = new Set(collapsedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setCollapsedCategories(newSet);
  };

  // Select first file when group changes
  useEffect(() => {
    if (selectedGroup) {
      const firstFile =
        selectedGroup.layers.unit[0] ??
        selectedGroup.layers.e2e[0] ??
        selectedGroup.tests[0];
      if (firstFile) setSelectedFile(firstFile);
    }
  }, [selectedGroup]);

  // Load code when file changes
  useEffect(() => {
    if (selectedFile) {
      selectedFile.rawLoader().then((mod) => {
        const m = mod as string | { default: string };
        setCode(typeof m === "string" ? m : m.default || "");
      });
      setResults([]);
      setEvents([]);
      setRunDuration(0);
    } else {
      setCode("");
    }
  }, [selectedFile]);

  // Static parse for idle display
  const staticStructure = useMemo(() => parseTestStructure(code), [code]);

  // Run tests
  const runTests = useCallback(async () => {
    if (!selectedFile?.execLoader || running) return;

    setRunning(true);
    setResults([]);
    setEvents([]);
    setRunDuration(0);

    const runner = new TestRunner();
    runnerRef.current = runner;

    runner.onEvent((event) => {
      setEvents((prev) => [...prev, event]);
    });

    const startTime = performance.now();
    try {
      const suiteResults = await runner.run(
        selectedFile.execLoader,
        selectedFile.path,
      );
      setResults(suiteResults);
    } catch (e) {
      console.error("[TestDashboard] Run failed:", e);
    }
    setRunDuration(performance.now() - startTime);
    setRunning(false);
  }, [selectedFile, running]);

  return (
    <div className="flex h-full bg-stone-50 overflow-hidden">
      {/* 1. Projects Sidebar */}
      <div className="w-64 border-r border-stone-200 bg-white flex flex-col flex-shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-stone-200 gap-2 flex-shrink-0">
          <div className="p-1.5 bg-violet-100 rounded-md">
            <TestTube2 size={18} className="text-violet-600" />
          </div>
          <span className="font-bold text-stone-900">Tests</span>
          <span className="ml-auto text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
            {groups.reduce((acc, g) => acc + g.tests.length, 0)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {Array.from(categorizedGroups.entries()).map(
            ([category, categoryGroups]) => {
              const isCollapsed = collapsedCategories.has(category);
              return (
                <div key={category} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-md transition-colors uppercase tracking-wide group"
                  >
                    {isCollapsed ? (
                      <ChevronRight size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                    {category === "Apps" ? (
                      <Layout size={12} className="opacity-70" />
                    ) : category === "Os" ? (
                      <Bot size={12} className="opacity-70" />
                    ) : (
                      <FolderOpen size={12} className="opacity-70" />
                    )}
                    <span>{category}</span>
                    <span className="ml-auto text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-400 group-hover:text-stone-600">
                      {categoryGroups.length}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="mt-0.5 space-y-px pl-2 relative">
                      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-stone-100" />
                      {categoryGroups.map((group) => (
                        <button
                          type="button"
                          key={group.slug}
                          onClick={() => setSelectedGroup(group)}
                          className={`relative w-full flex items-center gap-2.5 px-3 py-[5px] text-[13px] rounded-md transition-all text-left ml-1 ${
                            selectedGroup === group
                              ? "bg-violet-50 text-violet-900 font-semibold shadow-sm ring-1 ring-violet-100"
                              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                          }`}
                        >
                          <HealthIcon group={group} size={12} />
                          <span className="truncate flex-1 leading-none">
                            {group.name}
                          </span>
                          {group.tests.length > 0 && (
                            <span
                              className={`text-[9px] font-mono opacity-60 ${selectedGroup === group ? "text-violet-700" : "text-stone-400"}`}
                            >
                              {group.tests.length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* 2. File List (Middle Pane) */}
      <div className="w-72 border-r border-stone-200 bg-stone-50/50 flex flex-col flex-shrink-0">
        {selectedGroup ? (
          <>
            <div className="h-14 flex items-center px-4 border-b border-stone-200 bg-white flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-stone-500 bg-stone-100 mr-2">
                {selectedGroup.category}
              </span>
              <h2 className="font-bold text-stone-800 truncate">
                {selectedGroup.name}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-6">
              {(["unit", "testbot", "e2e"] as const).map((layer) => {
                const files = selectedGroup.layers[layer];
                if (files.length === 0) return null;
                const meta = LAYER_META[layer];
                const Icon = meta.icon;

                return (
                  <div key={layer}>
                    <div
                      className={`flex items-center gap-2 px-2 mb-2 text-xs font-bold uppercase tracking-widest ${meta.color} bg-white/50 py-1 rounded border border-transparent`}
                    >
                      <Icon size={12} /> {meta.label} ({files.length})
                    </div>
                    <div className="space-y-px">
                      {files.map((file) => (
                        <button
                          type="button"
                          key={file.path}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-mono border ${
                            selectedFile === file
                              ? "bg-white border-stone-300 shadow-sm text-stone-900 font-semibold scale-[1.02] origin-left"
                              : "border-transparent text-stone-500 hover:bg-stone-200/50 hover:text-stone-700"
                          }`}
                        >
                          <FileCode2
                            size={12}
                            className={
                              selectedFile === file
                                ? "text-stone-500"
                                : "text-stone-300 scale-90"
                            }
                          />
                          <span className="truncate direction-rtl text-left flex-1">
                            {file.filename}
                          </span>
                          {file.execLoader && (
                            <FlaskConical
                              size={10}
                              className="text-emerald-400 flex-shrink-0"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-300 p-8 text-center">
            <Search size={32} className="mb-2 opacity-20" />
            <p className="text-sm">Select a project</p>
          </div>
        )}
      </div>

      {/* 3. Main View */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        {selectedFile ? (
          <>
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-stone-100 bg-white flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-stone-600 font-mono truncate">
                <FileCode2 size={16} className="text-stone-400" />
                {selectedFile.path.replace(/^\/src\//, "")}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSource(!showSource)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all border ${
                    showSource
                      ? "bg-stone-100 text-stone-700 border-stone-200"
                      : "bg-white text-stone-400 border-stone-100 hover:text-stone-600 hover:border-stone-200"
                  }`}
                >
                  {showSource ? <EyeOff size={12} /> : <Eye size={12} />}
                  Source
                </button>
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${LAYER_META[selectedFile.layer].bg} ${LAYER_META[selectedFile.layer].color}`}
                >
                  {selectedFile.layer}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className={`flex flex-1 overflow-hidden ${showSource ? "flex-row" : ""}`}
              >
                {/* Test Results / Suite Panel */}
                <div
                  className={`flex flex-col border-r border-stone-200 bg-white overflow-hidden ${showSource ? "w-1/2" : "flex-1"}`}
                >
                  {/* Runner controls */}
                  <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded ${
                          running
                            ? "bg-blue-100 text-blue-600 animate-pulse"
                            : results.length > 0
                              ? results.every((r) => r.status === "pass")
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-600"
                              : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {running ? (
                          <RotateCw size={14} className="animate-spin" />
                        ) : results.length > 0 ? (
                          results.every((r) => r.status === "pass") ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <XCircle size={14} />
                          )
                        ) : (
                          <FlaskConical size={14} />
                        )}
                      </div>
                      <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                        {results.length > 0 ? "Results" : "Test Plan"}
                      </span>
                    </div>

                    {selectedFile.execLoader && (
                      <button
                        type="button"
                        onClick={runTests}
                        disabled={running}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all shadow-sm ${
                          running
                            ? "bg-stone-100 text-stone-400 cursor-wait"
                            : "bg-stone-900 text-white hover:bg-stone-700 hover:scale-105 active:scale-95"
                        }`}
                      >
                        {running ? (
                          <RotateCw size={11} className="animate-spin" />
                        ) : (
                          <Play size={11} fill="currentColor" />
                        )}
                        {running
                          ? "Running"
                          : results.length > 0
                            ? "Re-run"
                            : "Run All"}
                      </button>
                    )}
                    {!selectedFile.execLoader && (
                      <span className="text-[10px] text-stone-400 italic">
                        E2E — run via CLI
                      </span>
                    )}
                  </div>

                  {/* Suite Tree */}
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    {results.length > 0 ? (
                      <div className="space-y-2">
                        {results.map((suite, i) => (
                          <ResultNode key={i} node={suite} />
                        ))}
                      </div>
                    ) : staticStructure.length > 0 ? (
                      <div className="space-y-2">
                        {staticStructure.map((node, i) => (
                          <StaticNode key={i} node={node} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-stone-300">
                        <BoxSelect size={32} className="mb-2 opacity-20" />
                        <p className="text-xs">No suites parsed</p>
                      </div>
                    )}
                  </div>

                  <SummaryBar
                    results={results}
                    running={running}
                    duration={runDuration}
                  />
                </div>

                {/* Source Panel (toggleable) */}
                {showSource && (
                  <div className="w-1/2 flex flex-col bg-stone-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-stone-200 bg-stone-100/50 flex items-center gap-2 flex-shrink-0">
                      <Code2 size={14} className="text-stone-400" />
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                        Source
                      </span>
                      <span className="ml-auto text-[10px] font-mono text-stone-400">
                        {code.split("\n").length} lines
                      </span>
                    </div>
                    <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed scrollbar-thin">
                      <pre className="whitespace-pre-wrap">
                        {code.split("\n").map((line, i) => (
                          <div key={i} className="flex hover:bg-stone-100/50">
                            <span className="w-8 text-right text-stone-300 select-none pr-3 flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-stone-600">{line}</span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
            <Layout size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Select a test file</p>
          </div>
        )}
      </div>
    </div>
  );
}
