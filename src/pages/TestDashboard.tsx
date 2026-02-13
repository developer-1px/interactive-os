/**
 * TestDashboard — Project health dashboard via test structure discovery
 *
 * Discovers all tests via import.meta.glob on the standardized
 * {slice}/tests/{unit,testbot,e2e}/ structure.
 * Groups by project, shows layer coverage, overall health.
 */

import { useMemo, useState, useEffect } from "react";
import {
    TestTube2,
    FlaskConical,
    Bot,
    Theater,
    CheckCircle2,
    XCircle,
    MinusCircle,
    FileCode2,
    Layout,
    Search,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Folder,
    Code2,
    BoxSelect,
    PlayCircle,
    Check,
    Split,
    Play,
    RotateCw,
    AlertCircle,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// Discovery — build-time glob
// ═══════════════════════════════════════════════════════════════════

const unitFiles = import.meta.glob("/src/**/tests/unit/**/*.test.ts", {
    query: "?raw",
    eager: false,
});
const e2eFiles = import.meta.glob("/src/**/tests/e2e/**/*.spec.ts", {
    query: "?raw",
    eager: false,
});

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface TestFile {
    path: string;
    filename: string;
    layer: "unit" | "testbot" | "e2e";
    loader: () => Promise<any>;
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
// Test Parser (Regex-based Static Analysis)
// ═══════════════════════════════════════════════════════════════════

type TestStatus = "idle" | "running" | "pass" | "fail";

interface SuiteNode {
    type: "suite";
    name: string;
    children: (SuiteNode | TestNode)[];
    status?: TestStatus; // Mock status
}

interface TestNode {
    type: "test";
    name: string;
    status?: TestStatus; // Mock status
}

function parseTestStructure(code: string): SuiteNode[] {
    const lines = code.split("\n");

    const structure: SuiteNode[] = [];
    const suiteStack: { node: SuiteNode, indent: number }[] = [];

    // Root pseudo-node
    const rootSuite: SuiteNode = { type: "suite", name: "ROOT", children: [] };
    suiteStack.push({ node: rootSuite, indent: -1 });

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const indent = line.search(/\S/);
        if (indent === -1) continue; // Empty line

        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

        // Detect suite
        const descMatch = trimmed.match(/^describe\s*\(\s*["'`)(](.*?)["'`)]/);
        if (descMatch) {
            const name = descMatch[1];
            const newNode: SuiteNode = { type: "suite", name, children: [], status: "idle" };

            // Find parent: closest suite with strictly less indentation
            while (suiteStack.length > 1 && suiteStack[suiteStack.length - 1].indent >= indent) {
                suiteStack.pop();
            }

            suiteStack[suiteStack.length - 1].node.children.push(newNode);
            suiteStack.push({ node: newNode, indent });
            continue;
        }

        // Detect test
        const testMatch = trimmed.match(/^(it|test)\s*\(\s*["'`)(](.*?)["'`)]/);
        if (testMatch) {
            const name = testMatch[2];
            const newNode: TestNode = { type: "test", name, status: "idle" };

            // Find parent: closest suite with strictly less indentation
            while (suiteStack.length > 1 && suiteStack[suiteStack.length - 1].indent >= indent) {
                suiteStack.pop();
            }

            suiteStack[suiteStack.length - 1].node.children.push(newNode);
        }
    }

    return rootSuite.children[0]?.type === "suite" ? rootSuite.children : rootSuite.children as any;
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
            category: match[1].charAt(0).toUpperCase() + match[1].slice(1),
            name: match[2]
        };
    }

    const firstDir = normalized.split("/")[1];
    return { category: "Other", name: firstDir || "Unknown" };
}

function buildGroups(
    unitModules: Record<string, () => Promise<any>>,
    e2eModules: Record<string, () => Promise<any>>,
): ProjectGroup[] {
    const groupMap = new Map<string, ProjectGroup>();

    const addFile = (path: string, layer: "unit" | "testbot" | "e2e", loader: () => Promise<any>) => {
        const { category, name } = extractProjectInfo(path);
        const slug = `${category.toLowerCase()}-${name}`;
        const filename = path.split("/").pop() || path;

        if (!groupMap.has(slug)) {
            groupMap.set(slug, {
                name: name,
                slug: slug,
                category: category,
                tests: [],
                layers: { unit: [], testbot: [], e2e: [] },
            });
        }

        const file: TestFile = { path, filename, layer, loader };
        const group = groupMap.get(slug)!;
        group.tests.push(file);
        group.layers[layer].push(file);
    };

    for (const [path, loader] of Object.entries(unitModules)) addFile(path, "unit", loader);
    for (const [path, loader] of Object.entries(e2eModules)) addFile(path, "e2e", loader);

    return Array.from(groupMap.values()).sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
    });
}

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════

const LAYER_META = {
    unit: { icon: FlaskConical, label: "Unit", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    testbot: { icon: Bot, label: "TestBot", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    e2e: { icon: Theater, label: "E2E", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
} as const;

function HealthIcon({ group, size = 16 }: { group: ProjectGroup, size?: number }) {
    const hasUnit = group.layers.unit.length > 0;
    const hasE2E = group.layers.e2e.length > 0;

    if (hasUnit && hasE2E) return <CheckCircle2 size={size} className="text-emerald-500" />;
    if (hasUnit || hasE2E) return <MinusCircle size={size} className="text-amber-500" />;
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
            return <PlayCircle size={14} className="text-stone-300 hover:text-stone-500 transition-colors" />;
    }
}

function SuiteNodeRenderer({ node, depth = 0, onRun }: { node: SuiteNode | TestNode, depth?: number, onRun: (node: SuiteNode | TestNode) => void }) {
    const status = node.status || "idle";

    if (node.type === "test") {
        return (
            <div className="group flex items-center justify-between py-1 text-sm rounded-md hover:bg-stone-50 pr-2 transition-colors" style={{ paddingLeft: depth * 16 }}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <button onClick={() => onRun(node)} disabled={status === 'running'}>
                        <StatusIcon status={status} />
                    </button>
                    <span className={`truncate ${status === 'fail' ? 'text-red-600' : status === 'pass' ? 'text-stone-400' : 'text-stone-600'}`}>
                        {node.name}
                    </span>
                </div>
                {status === 'fail' && <span className="text-[10px] text-red-500 font-bold px-1.5 py-0.5 bg-red-50 rounded">FAIL</span>}
                {status === 'pass' && <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-50 rounded">PASS</span>}
            </div>
        );
    }

    return (
        <div className="mb-1">
            <div className="group flex items-center justify-between py-1 text-sm font-bold text-stone-800 rounded-md hover:bg-stone-50 pr-2 transition-colors" style={{ paddingLeft: depth * 16 }}>
                <div className="flex items-center gap-2">
                    <button onClick={() => onRun(node)} disabled={status === 'running'}>
                        {status === 'running' ? <RotateCw size={14} className="text-blue-500 animate-spin" /> :
                            status === 'pass' ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                                status === 'fail' ? <XCircle size={14} className="text-red-500" /> :
                                    <BoxSelect size={14} className="text-stone-400 group-hover:text-stone-600 transition-colors" />}
                    </button>
                    <span className="truncate">{node.name}</span>
                </div>
            </div>
            <div>
                {node.children.map((child, i) => (
                    <SuiteNodeRenderer key={i} node={child} depth={depth + 1} onRun={onRun} />
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════

export function TestDashboard() {
    const groups = useMemo(() => buildGroups(unitFiles, e2eFiles), []);

    const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(groups[0] || null);
    const [selectedFile, setSelectedFile] = useState<TestFile | null>(null);
    const [code, setCode] = useState<string>("");
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // Mock State for Test Execution
    const [testResults, setTestResults] = useState<Record<string, TestStatus>>({});
    const [running, setRunning] = useState(false);

    // Group projects by category
    const categorizedGroups = useMemo(() => {
        const map = new Map<string, ProjectGroup[]>();
        for (const group of groups) {
            if (!map.has(group.category)) map.set(group.category, []);
            map.get(group.category)!.push(group);
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
            const firstFile = selectedGroup.layers.unit[0] ?? selectedGroup.layers.e2e[0] ?? selectedGroup.tests[0];
            if (firstFile) setSelectedFile(firstFile);
        }
    }, [selectedGroup]);

    // Load code when file changes
    useEffect(() => {
        if (selectedFile) {
            selectedFile.loader().then((mod) => {
                setCode(typeof mod === 'string' ? mod : mod.default || "");
            });
            // Reset mocks when file changes
            setTestResults({});
        } else {
            setCode("");
        }
    }, [selectedFile]);

    const structure = useMemo(() => {
        const nodes = parseTestStructure(code);
        // Apply mock status
        const applyStatus = (nodes: (SuiteNode | TestNode)[]) => {
            nodes.forEach(node => {
                if (testResults[node.name]) {
                    node.status = testResults[node.name];
                }
                if (node.type === 'suite' && node.children) {
                    applyStatus(node.children);
                }
            });
        }
        applyStatus(nodes);
        return nodes;
    }, [code, testResults]);

    // Mock Runner Logic
    const runTest = (name: string) => {
        setTestResults(prev => ({ ...prev, [name]: 'running' }));
        setTimeout(() => {
            setTestResults(prev => ({
                ...prev,
                [name]: Math.random() > 0.3 ? 'pass' : 'fail'
            }));
        }, 600 + Math.random() * 1000);
    };

    const runAll = () => {
        setRunning(true);
        const allNames: string[] = [];
        const collectNames = (nodes: (SuiteNode | TestNode)[]) => {
            nodes.forEach(node => {
                allNames.push(node.name);
                if (node.type === 'suite') collectNames(node.children);
            });
        }
        collectNames(structure);

        // Set all to running
        const runningState = allNames.reduce((acc, name) => ({ ...acc, [name]: 'running' as TestStatus }), {});
        setTestResults(runningState);

        // Settle one by one
        allNames.forEach((name, i) => {
            setTimeout(() => {
                setTestResults(prev => ({
                    ...prev,
                    [name]: Math.random() > 0.2 ? 'pass' : 'fail'
                }));
                if (i === allNames.length - 1) setRunning(false);
            }, 800 + i * 200);
        });
    };


    return (
        <div className="flex h-full bg-stone-50 overflow-hidden">

            {/* 1. Projects Sidebar */}
            <div className="w-64 border-r border-stone-200 bg-white flex flex-col flex-shrink-0">
                <div className="h-14 flex items-center px-4 border-b border-stone-200 gap-2 flex-shrink-0">
                    <div className="p-1.5 bg-violet-100 rounded-md">
                        <TestTube2 size={18} className="text-violet-600" />
                    </div>
                    <span className="font-bold text-stone-900">Tests</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {Array.from(categorizedGroups.entries()).map(([category, categoryGroups]) => {
                        const isCollapsed = collapsedCategories.has(category);
                        return (
                            <div key={category} className="mb-1">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-md transition-colors uppercase tracking-wide group"
                                >
                                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                    {category == "Apps" ? <Layout size={12} className="opacity-70" /> :
                                        category == "Os" ? <Bot size={12} className="opacity-70" /> :
                                            <FolderOpen size={12} className="opacity-70" />}
                                    <span>{category}</span>
                                    <span className="ml-auto text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-400 group-hover:text-stone-600">
                                        {categoryGroups.length}
                                    </span>
                                </button>

                                {!isCollapsed && (
                                    <div className="mt-0.5 space-y-px pl-2 relative">
                                        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-stone-100" />
                                        {categoryGroups.map(group => (
                                            <button
                                                key={group.slug}
                                                onClick={() => setSelectedGroup(group)}
                                                className={`relative w-full flex items-center gap-2.5 px-3 py-[5px] text-[13px] rounded-md transition-all text-left ml-1 ${selectedGroup === group
                                                        ? "bg-violet-50 text-violet-900 font-semibold shadow-sm ring-1 ring-violet-100"
                                                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                                                    }`}
                                            >
                                                <HealthIcon group={group} size={12} />
                                                <span className="truncate flex-1 leading-none">{group.name}</span>
                                                {group.tests.length > 0 && (
                                                    <span className={`text-[9px] font-mono opacity-60 ${selectedGroup === group ? "text-violet-700" : "text-stone-400"}`}>
                                                        {group.tests.length}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 2. File List (Middle Pane) */}
            <div className="w-72 border-r border-stone-200 bg-stone-50/50 flex flex-col flex-shrink-0">
                {selectedGroup ? (
                    <>
                        <div className="h-14 flex items-center px-4 border-b border-stone-200 bg-white flex-shrink-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-stone-500 bg-stone-100 mr-2`}>
                                {selectedGroup.category}
                            </span>
                            <h2 className="font-bold text-stone-800 truncate">{selectedGroup.name}</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-6">
                            {(['unit', 'e2e'] as const).map(layer => {
                                const files = selectedGroup.layers[layer];
                                if (files.length === 0) return null;
                                const meta = LAYER_META[layer];
                                const Icon = meta.icon;

                                return (
                                    <div key={layer}>
                                        <div className={`flex items-center gap-2 px-2 mb-2 text-xs font-bold uppercase tracking-widest ${meta.color} bg-white/50 py-1 rounded border border-transparent`}>
                                            <Icon size={12} /> {meta.label} ({files.length})
                                        </div>
                                        <div className="space-y-px">
                                            {files.map(file => (
                                                <button
                                                    key={file.path}
                                                    onClick={() => setSelectedFile(file)}
                                                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-mono border ${selectedFile === file
                                                            ? "bg-white border-stone-300 shadow-sm text-stone-900 font-semibold scale-[1.02] origin-left"
                                                            : "border-transparent text-stone-500 hover:bg-stone-200/50 hover:text-stone-700"
                                                        }`}
                                                >
                                                    <FileCode2 size={12} className={selectedFile === file ? "text-stone-500" : "text-stone-300 scale-90"} />
                                                    <span className="truncate direction-rtl text-left flex-1">{file.filename}</span>
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

            {/* 3. Main Split View (Suite | Code) */}
            <div className="flex-1 bg-white flex flex-col min-w-0">
                {selectedFile ? (
                    <>
                        <div className="h-14 flex items-center justify-between px-6 border-b border-stone-100 bg-white flex-shrink-0">
                            <div className="flex items-center gap-2 text-sm text-stone-600 font-mono truncate">
                                <FileCode2 size={16} className="text-stone-400" />
                                {selectedFile.path.replace(/^\/src\//, '')}
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${LAYER_META[selectedFile.layer].bg} ${LAYER_META[selectedFile.layer].color}`}>
                                {selectedFile.layer}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-row overflow-hidden">
                            {/* Left: Suite Visualization (40%) */}
                            <div className="w-[40%] flex flex-col border-r border-stone-200 bg-white overflow-hidden">
                                <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded ${running ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-emerald-50 text-emerald-600"}`}>
                                            <Check size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">Test Plan</span>
                                    </div>
                                    <button
                                        onClick={runAll}
                                        disabled={running}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all shadow-sm ${running
                                                ? "bg-stone-100 text-stone-400 cursor-wait"
                                                : "bg-stone-900 text-white hover:bg-stone-700 hover:scale-105 active:scale-95"
                                            }`}
                                    >
                                        {running ? <RotateCw size={10} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
                                        Run All
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                                    {structure.length > 0 ? (
                                        <div className="space-y-4">
                                            {structure.map((node, i) => (
                                                <SuiteNodeRenderer
                                                    key={i}
                                                    node={node}
                                                    onRun={(n) => runTest(n.name)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-stone-300">
                                            <BoxSelect size={32} className="mb-2 opacity-20" />
                                            <p className="text-xs">No suites parsed</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Code Preview (60%) */}
                            <div className="flex-1 flex flex-col bg-stone-50 overflow-hidden">
                                <div className="px-4 py-2 border-b border-stone-200 bg-stone-100/50 flex items-center gap-2">
                                    <Code2 size={14} className="text-stone-400" />
                                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Source</span>
                                </div>
                                <div className="flex-1 p-4 overflow-auto font-mono text-xs text-stone-600 leading-relaxed scrollbar-thin">
                                    <pre className="whitespace-pre-wrap">{code}</pre>
                                </div>
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
