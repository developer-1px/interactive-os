import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    Activity,
    Book,
    CheckCircle2,
    Clock,
    FileText,
    Inbox,
    Library,
    ListTodo,
    Plus,
    Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cleanLabel, buildDocTree, docsModules } from "../../docs-viewer/docsUtils";
import { DocsSidebar } from "../../docs-viewer/DocsSidebar";

export const Route = createFileRoute("/_minimal/playground/design-dashboard-v3")({
    component: DashboardV4,
    staticData: {
        title: "Design: OS Almanac",
        icon: Book,
        location: "global-nav",
        order: 99,
    },
});

interface ProjectStatus {
    id: string;
    title: string;
    lastUpdated: string;
    progress: number;
    phase: string;
    recentLog: { type: "done" | "todo"; text: string }[];
    statusBreakdown: { layer: string; state: "done" | "process" | "todo"; note?: string }[];
}

function useDashboardData() {
    const [activeProject, setActiveProject] = useState<ProjectStatus | null>(null);
    const [areas, setAreas] = useState<{ id: string; title: string; subtitle: string }[]>([]);
    const [feed, setFeed] = useState<{ id: string; title: string; type: string; path: string; time: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const allPaths = Object.keys(docsModules);

            // 1. Identify Projects & Areas
            const projectPaths = allPaths.filter(p => p.includes("/1-project/"));
            const areaPaths = allPaths.filter(p => p.includes("/2-area/"));

            // 2. Parse Areas (Directories)
            const areaMap = new Set<string>();
            areaPaths.forEach(path => {
                const parts = path.split("/2-area/")[1].split("/");
                if (parts.length > 0) areaMap.add(parts[0]);
            });
            const loadedAreas = Array.from(areaMap).map(id => ({
                id,
                title: cleanLabel(id).replace(/^\d+\s/, ""),
                subtitle: "Knowledge Base"
            })).sort((a, b) => a.id.localeCompare(b.id));

            setAreas(loadedAreas);

            // 3. Find Active Project (Look for 2-STATUS.md)
            const statusFile = projectPaths.find(p => p.includes("os-core-refactoring/2-STATUS.md"))
                || projectPaths.find(p => p.includes("/2-STATUS.md"));

            if (statusFile) {
                try {
                    const content = await docsModules[statusFile]() as string;
                    const parsed = parseStatusMarkdown(content);
                    const projectId = statusFile.split("/1-project/")[1].split("/")[0];
                    setActiveProject({
                        id: projectId,
                        title: cleanLabel(projectId),
                        ...parsed
                    });
                } catch (e) {
                    console.error("Failed to load status", e);
                }
            }

            // 4. Build Feed (Recent Files)
            const feedItems = allPaths
                .filter(p => !p.includes("STATUS.md") && !p.includes("README.md"))
                .slice(0, 50)
                .map(path => {
                    const name = path.split("/").pop()?.replace(".md", "") || "";
                    let type = "doc";
                    if (path.includes("proposal")) type = "proposal";
                    if (path.includes("decision") || path.includes("adr")) type = "decision";
                    if (path.includes("analysis")) type = "analysis";

                    return {
                        id: path,
                        title: cleanLabel(name),
                        type,
                        path: path.split("/docs/")[1] || path,
                        time: "Recently"
                    };
                })
                .sort(() => Math.random() - 0.5)
                .slice(0, 6);

            setFeed(feedItems);
            setLoading(false);
        }

        loadData();
    }, []);

    return { activeProject, areas, feed, loading };
}

function parseStatusMarkdown(markdown: string) {
    const checked = (markdown.match(/- \[x\]/gi) || []).length;
    const unchecked = (markdown.match(/- \[ \]/g) || []).length;
    const total = checked + unchecked;
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

    const dateMatch = markdown.match(/\d{4}-\d{2}-\d{2}/);
    const lastUpdated = dateMatch ? dateMatch[0] : "Recently";

    const lines = markdown.split("\n");
    const recentLog = [];
    let logCount = 0;
    for (const line of lines) {
        if (logCount >= 4) break;
        if (line.trim().startsWith("- [x]")) {
            recentLog.push({ type: "done" as const, text: line.replace("- [x]", "").trim() });
            logCount++;
        } else if (line.trim().startsWith("- [ ]")) {
            recentLog.push({ type: "todo" as const, text: line.replace("- [ ]", "").trim() });
            logCount++;
        }
    }

    let phase = "Planning";
    if (progress > 20) phase = "In Progress";
    if (progress > 80) phase = "Polishing";
    if (progress === 100) phase = "Complete";

    return {
        progress,
        lastUpdated,
        recentLog,
        phase,
        statusBreakdown: []
    };
}


// --- Components ---

function SectionHeader({ title, icon: Icon, action }: { title: string; icon?: any; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                {Icon && <Icon size={14} className="text-stone-400" />}
                {title}
            </h3>
            {action}
        </div>
    );
}

function AlmanacCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border border-stone-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-md ${className}`}>
            {children}
        </div>
    );
}

function InboxItem({ text }: { text: string }) {
    return (
        <div className="group flex items-start gap-3 py-2 px-3 hover:bg-stone-50 transition-colors cursor-pointer border-b border-stone-100 last:border-0">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-700 font-medium leading-snug">{text}</p>
            </div>
        </div>
    );
}

function ProjectPulse({ project }: { project: ProjectStatus }) {
    if (!project) return <div className="p-4 text-stone-400 text-sm">No active project status found.</div>;

    return (
        <AlmanacCard className="overflow-hidden">
            <div className="bg-stone-50 p-4 border-b border-stone-100 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Active Focus</span>
                    </div>
                    <h2 className="text-xl font-bold text-stone-900">
                        {project.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                        <Clock size={12} /> Last updated: {project.lastUpdated}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-stone-900 leading-none">{project.progress}%</div>
                    <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium mt-1">{project.phase}</div>
                </div>
            </div>

            <div className="p-5 grid grid-cols-2 gap-6">
                <div className="col-span-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Tasks Snapshot</h4>
                    <ul className="space-y-3 relative border-l border-stone-200 ml-1 pl-4">
                        {project.recentLog.map((log, i) => (
                            <li key={i} className="text-sm relative">
                                <span className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-white ${log.type === 'done' ? 'bg-stone-400' : 'bg-white ring-1 ring-stone-300'}`} />
                                <span className={log.type === 'done' ? 'text-stone-600' : 'text-stone-400'}>{log.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </AlmanacCard>
    );
}

function JournalEntry({ item }: { item: { type: string; title: string; path: string; time: string } }) {
    return (
        <div className="py-3 border-b border-stone-200 last:border-0 group">
            <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${item.type === 'proposal' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        item.type === 'decision' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                    {item.type}
                </span>
                <span className="text-xs text-stone-400 italic">
                    {item.time}
                </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1 group-hover:text-blue-700 transition-colors cursor-pointer truncate">
                {item.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-stone-400 font-mono truncate">
                <FileText size={12} />
                {item.path}
            </div>
        </div>
    )
}

function AreaItem({ area }: { area: { id: string; title: string; subtitle: string } }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-100 cursor-pointer transition-colors group">
            <div className="w-8 h-10 bg-stone-200 rounded-sm shadow-sm flex items-center justify-center border-l-2 border-stone-300 group-hover:bg-white transition-colors">
                <span className="font-bold text-stone-500 text-xs">{area.id.substring(0, 2)}</span>
            </div>
            <div>
                <div className="text-sm font-bold text-stone-800 leading-tight">{area.title}</div>
                <div className="text-xs text-stone-500">{area.subtitle}</div>
            </div>
        </div>
    );
}

const inbox = [
    { id: "i1", text: "Review Dashboard Design" },
    { id: "i2", text: "Check core refactoring status" },
];
const todos = [
    { id: "t1", text: "Fix import analysis bug", done: false, project: "Dev" },
];

function DashboardV4() {
    const { activeProject, areas, feed, loading } = useDashboardData();
    const navigate = useNavigate();

    // Sidebar Data
    const docTree = useMemo(() => buildDocTree(Object.keys(docsModules)), []);

    if (loading) return <div className="flex items-center justify-center min-h-screen text-stone-400">Loading Dashboard...</div>;

    return (
        <div className="flex h-screen bg-[#F5F5F4] overflow-hidden font-sans selection:bg-stone-200">
            {/* Sidebar */}
            <DocsSidebar items={docTree} activePath={undefined} onSelect={(path) => navigate({ to: `/docs/${path}` })} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Navigation / Branding */}
                <div className="border-b border-stone-200 bg-white z-10 flex-shrink-0">
                    <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-stone-900">
                            <Book className="text-stone-900" size={20} />
                            <span className="font-bold text-lg tracking-tight">Interactive OS</span>
                            <span className="text-stone-300 mx-2 text-sm">/</span>
                            <span className="text-sm font-medium text-stone-500">The Almanac</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200 w-64">
                                <Search size={14} className="text-stone-400 mr-2" />
                                <input type="text" placeholder="Search knowledge base..." className="bg-transparent border-none outline-none text-xs w-full" />
                                <span className="text-[9px] font-bold text-stone-400 border border-stone-200 px-1 rounded bg-white">⌘K</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Dashboard Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-12 gap-8">

                        {/* 1. Left Pane: The Desk (25%) */}
                        <div className="col-span-3 space-y-8">
                            {/* Inbox */}
                            <section>
                                <SectionHeader title="Inbox" icon={Inbox} action={<Plus size={14} className="text-stone-400 hover:text-stone-900 cursor-pointer" />} />
                                <AlmanacCard>
                                    <div className="p-1">
                                        {inbox.map(item => <InboxItem key={item.id} text={item.text} />)}
                                    </div>
                                    <div className="px-3 py-2 bg-stone-50 border-t border-stone-100">
                                        <input type="text" placeholder="Capture a thought..." className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400" />
                                    </div>
                                </AlmanacCard>
                            </section>

                            {/* Today's Focus */}
                            <section>
                                <SectionHeader title="Active Tasks" icon={ListTodo} />
                                <AlmanacCard>
                                    <div className="p-3 text-sm text-stone-500 text-center">
                                        No active tasks in queue.
                                    </div>
                                </AlmanacCard>
                            </section>
                        </div>

                        {/* 2. Center Pane: The Journal (50%) */}
                        <div className="col-span-6 space-y-8">

                            {/* Active Project Pulse */}
                            <section>
                                <SectionHeader title="Active Project Pulse" icon={Activity} />
                                {activeProject && <ProjectPulse project={activeProject} />}
                            </section>

                            {/* The Feed */}
                            <section>
                                <div className="flex items-end justify-between mb-4 border-b-2 border-stone-900 pb-2">
                                    <h2 className="text-2xl font-bold text-stone-900">The Stream</h2>
                                    <div className="flex gap-4 text-sm font-medium text-stone-500">
                                        <button className="text-stone-900 hover:text-stone-900">All</button>
                                        <button className="hover:text-stone-900">Proposals</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {feed.map(item => <JournalEntry key={item.id} item={item} />)}
                                </div>
                            </section>
                        </div>

                        {/* 3. Right Pane: The Library (25%) */}
                        <div className="col-span-3 space-y-8">
                            {/* Areas */}
                            <section>
                                <SectionHeader title="Knowledge Base" icon={Book} />
                                <div className="space-y-2">
                                    {areas.map(area => <AreaItem key={area.id} area={area} />)}
                                </div>
                            </section>

                            {/* Resources */}
                            <section>
                                <SectionHeader title="Reference" icon={Library} />
                                <AlmanacCard className="p-3">
                                    <div className="text-sm text-stone-500">
                                        Scanning for resources...
                                    </div>
                                </AlmanacCard>
                            </section>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
