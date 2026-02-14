import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Book,
  Brain,
  CheckCircle2,
  Clock,
  Code,
  Command,
  Inbox,
  Layers,
  Library,
  ListTodo,
  Loader2,
  type LucideIcon,
  MessageSquare,
  Play,
  Plus,
  Search,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DocsSidebar } from "../../docs-viewer/DocsSidebar";
import {
  buildDocTree,
  cleanLabel,
  docsModules,
} from "../../docs-viewer/docsUtils";

export const Route = createFileRoute(
  "/_minimal/playground/design-dashboard-v3",
)({
  component: DashboardV4,
  staticData: {
    title: "Design: OS Almanac",
    icon: Book,
    location: "global-nav",
    order: 99,
  },
});

// --- Types & Data ---

interface ProjectStatus {
  id: string;
  title: string;
  lastUpdated: string;
  progress: number;
  phase: string;
  recentLog: { type: "done" | "todo"; text: string }[];
  statusBreakdown: {
    layer: string;
    state: "done" | "process" | "todo";
    note?: string;
  }[];
}

interface WorkflowItem {
  id: string;
  command: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

const COMMON_WORKFLOWS: WorkflowItem[] = [
  {
    id: "wf1",
    command: "/divide",
    label: "Divide",
    desc: "Break down problems",
    icon: Layers,
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    id: "wf2",
    command: "/discussion",
    label: "Discuss",
    desc: "Socratic discovery",
    icon: MessageSquare,
    color: "text-purple-600 bg-purple-50 border-purple-100",
  },
  {
    id: "wf3",
    command: "/fix",
    label: "Fix",
    desc: "Quality gate check",
    icon: Wrench,
    color: "text-orange-600 bg-orange-50 border-orange-100",
  },
  {
    id: "wf4",
    command: "/review",
    label: "Review",
    desc: "Code & Logic audit",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
];

function inferDocType(path: string): string {
  if (path.includes("proposal")) return "proposal";
  if (path.includes("decision") || path.includes("adr")) return "decision";
  if (path.includes("analysis")) return "analysis";
  if (path.includes("report")) return "report";
  return "doc";
}

function useDashboardData() {
  const [activeProject, setActiveProject] = useState<ProjectStatus | null>(
    null,
  );
  const [areas, setAreas] = useState<
    { id: string; title: string; subtitle: string }[]
  >([]);
  const [feed, setFeed] = useState<
    { id: string; title: string; type: string; path: string; time: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const allPaths = Object.keys(docsModules);

      // 1. Identify Projects & Areas
      const projectPaths = allPaths.filter((p) => p.includes("/1-project/"));
      const areaPaths = allPaths.filter((p) => p.includes("/2-area/"));

      // 2. Parse Areas (Directories)
      const areaMap = new Set<string>();
      areaPaths.forEach((path) => {
        const parts = path.split("/2-area/")[1].split("/");
        if (parts.length > 0) areaMap.add(parts[0]);
      });
      const loadedAreas = Array.from(areaMap)
        .map((id) => ({
          id,
          title: cleanLabel(id).replace(/^\d+\s/, ""),
          subtitle: "Knowledge Domain",
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

      setAreas(loadedAreas);

      // 3. Find Active Project (Look for 2-STATUS.md)
      const statusFile =
        projectPaths.find((p) =>
          p.includes("os-core-refactoring/2-STATUS.md"),
        ) || projectPaths.find((p) => p.includes("/2-STATUS.md"));

      if (statusFile) {
        try {
          const content = (await docsModules[statusFile]()) as string;
          const parsed = parseStatusMarkdown(content);
          const projectId = statusFile.split("/1-project/")[1].split("/")[0];
          setActiveProject({
            id: projectId,
            title: cleanLabel(projectId),
            ...parsed,
          });
        } catch (e) {
          console.error("Failed to load status", e);
        }
      }

      // 4. Build Feed (Recent Files)
      const feedItems = allPaths
        .filter((p) => !p.includes("STATUS.md") && !p.includes("README.md"))
        .map((path) => ({
          id: path,
          title: cleanLabel(path.split("/").pop()?.replace(".md", "") || ""),
          type: inferDocType(path),
          path: path.split("/docs/")[1] || path,
          time: "Recently",
        }))
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

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
    if (logCount >= 5) break;
    if (line.trim().startsWith("- [x]")) {
      recentLog.push({
        type: "done" as const,
        text: line.replace("- [x]", "").replace(/\*\*/g, "").trim(),
      });
      logCount++;
    } else if (line.trim().startsWith("- [ ]")) {
      recentLog.push({
        type: "todo" as const,
        text: line.replace("- [ ]", "").replace(/\*\*/g, "").trim(),
      });
      logCount++;
    }
  }

  let phase = "Planning";
  if (progress > 10) phase = "In Progress";
  if (progress > 80) phase = "Polishing";
  if (progress === 100) phase = "Complete";

  return {
    progress,
    lastUpdated,
    recentLog,
    phase,
    statusBreakdown: [],
  };
}

// --- Components ---

function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={14} className="text-stone-400" />}
        {title}
      </h3>
      {action}
    </div>
  );
}

function AlmanacCard({
  children,
  className = "",
  hoverEffect = false,
}: {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}) {
  return (
    <div
      className={`
            bg-white border border-stone-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-lg 
            ${hoverEffect ? "hover:shadow-md hover:border-stone-300 transition-all duration-200 cursor-pointer" : ""}
            ${className}
        `}
    >
      {children}
    </div>
  );
}

function WorkflowLauncher() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {COMMON_WORKFLOWS.map((wf) => (
        <AlmanacCard
          key={wf.id}
          hoverEffect
          className="p-3 flex flex-col justify-between h-24 group relative overflow-hidden"
        >
          <div className="flex justify-between items-start z-10">
            <div
              className={`p-1.5 rounded-md ${wf.color} group-hover:scale-110 transition-transform`}
            >
              <wf.icon size={16} />
            </div>
          </div>
          <div className="z-10">
            <div className="text-xs font-bold text-stone-900 group-hover:text-blue-600 transition-colors">
              {wf.command}
            </div>
            <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
              {wf.label}
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
            <wf.icon size={64} />
          </div>
        </AlmanacCard>
      ))}
    </div>
  );
}

function InboxItem({ text, isNew = false }: { text: string; isNew?: boolean }) {
  return (
    <div className="group flex items-start gap-3 py-2.5 px-3 hover:bg-stone-50 transition-colors cursor-pointer border-b border-stone-100 last:border-0 rounded-md mx-1">
      <div
        className={`mt-1.5 w-2 h-2 rounded-full ${isNew ? "bg-blue-500 ring-2 ring-blue-100" : "bg-stone-300"} group-hover:bg-blue-500 transition-colors`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${isNew ? "text-stone-900 font-semibold" : "text-stone-700 font-medium"} leading-snug group-hover:text-stone-900`}
        >
          {text}
        </p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Command size={12} className="text-stone-400" />
      </div>
    </div>
  );
}

function ProposalEntry({
  item,
}: {
  item: { type: string; title: string; path: string; time: string };
}) {
  const isProposal = item.type === "proposal";
  const isDecision = item.type === "decision";

  return (
    <div className="py-3 px-1 border-b border-stone-100 last:border-0 group hover:bg-stone-50 -mx-1 px-3 transition-colors rounded-md cursor-pointer">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
            isProposal
              ? "bg-blue-50 text-blue-700 border-blue-100"
              : isDecision
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-stone-100 text-stone-600 border-stone-200"
          }`}
        >
          {item.type}
        </span>
        <span className="text-xs text-stone-400 font-mono">
          {item.path.split("/").slice(0, 2).join("/")}
        </span>
        <span className="ml-auto text-[10px] text-stone-400">{item.time}</span>
      </div>
      <h3 className="text-sm font-bold text-stone-900 leading-snug group-hover:text-blue-700 transition-colors mb-1">
        {item.title}
      </h3>
    </div>
  );
}

function ProjectPulse({ project }: { project: ProjectStatus }) {
  return (
    <AlmanacCard className="overflow-hidden">
      <div className="p-5 border-b border-stone-100 bg-gradient-to-br from-white to-stone-50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Active Focus
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              {project.title}
            </h2>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 shadow-sm">
              {project.phase}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-2">
          <div className="flex justify-between text-xs font-medium text-stone-500">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-800 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-5 bg-white">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-4 flex items-center gap-2">
          <span className="w-4 h-px bg-stone-300"></span> Recent Activity
        </h4>
        <ul className="space-y-4 relative ml-2 pl-6 border-l border-stone-200">
          {project.recentLog.map((log, i) => (
            <li
              key={`${log.type}-${log.text.slice(0, 20)}`}
              className="group text-sm relative"
            >
              <span
                className={`absolute -left-[30px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-colors ${
                  log.type === "done"
                    ? "bg-emerald-500"
                    : "bg-white ring-2 ring-stone-200"
                }`}
              />
              <span
                className={`block transition-all ${
                  log.type === "done"
                    ? "text-stone-400 line-through decoration-stone-300"
                    : "text-stone-800 font-medium"
                }`}
              >
                {log.text}
              </span>
            </li>
          ))}
          <li className="text-xs text-stone-400 pl-0 pt-2 italic flex items-center gap-1">
            <Clock size={12} /> Last updated {project.lastUpdated}
          </li>
        </ul>
      </div>
    </AlmanacCard>
  );
}

function AreaItem({
  area,
}: {
  area: { id: string; title: string; subtitle: string };
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors group border border-transparent hover:border-stone-200">
      <div className="w-10 h-10 bg-white border border-stone-200 rounded-md shadow-sm flex items-center justify-center group-hover:border-stone-300 transition-colors text-stone-400 group-hover:text-stone-600">
        <Layers size={18} />
      </div>
      <div>
        <div className="text-sm font-bold text-stone-800 leading-tight group-hover:text-blue-700 transition-colors">
          {area.title}
        </div>
        <div className="text-[11px] text-stone-500 mt-0.5">{area.subtitle}</div>
      </div>
    </div>
  );
}

const inbox = [
  { id: "i1", text: "Check workflow automation logic", isNew: true },
  { id: "i2", text: "Review latest UI components" },
];

function QuickResource({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-md cursor-pointer group">
      <Icon
        size={16}
        className="text-stone-400 group-hover:text-stone-600 transition-colors"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-stone-700 group-hover:text-stone-900 truncate">
          {title}
        </div>
        <div className="text-[10px] text-stone-400 truncate">{desc}</div>
      </div>
    </div>
  );
}

function DashboardV4() {
  const { activeProject, areas, feed, loading } = useDashboardData();
  const navigate = useNavigate();

  // Sidebar Data
  const docTree = useMemo(() => buildDocTree(Object.keys(docsModules)), []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-stone-400 bg-[#F5F5F4] flex-col gap-4">
        <Loader2 className="animate-spin text-stone-300" size={32} />
        <span className="text-sm font-medium">Loading Workspace...</span>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F7F7F6] overflow-hidden font-sans selection:bg-stone-200 text-stone-900">
      {/* Sidebar */}
      <DocsSidebar
        items={docTree}
        activePath={undefined}
        onSelect={(path) => navigate({ to: `/docs/${path}` })}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation / Branding */}
        <div className="bg-white/80 backdrop-blur-sm z-10 flex-shrink-0 border-b border-stone-200/50 sticky top-0">
          <div className="max-w-[1600px] mx-auto px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 text-stone-900">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Book size={16} />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight leading-none">
                  Interactive OS
                </h1>
                <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                  The Almanac
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-stone-100 px-3 py-1.5 rounded-lg border border-transparent focus-within:bg-white focus-within:border-stone-300 focus-within:ring-2 ring-stone-100 transition-all w-80">
                <Search size={14} className="text-stone-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search knowledge base (Cmd+K)"
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-12 gap-10">
            {/* 1. Left Pane: Input & Actions (25%) */}
            <div className="col-span-3 space-y-8">
              {/* Workflow Shortcuts */}
              <section>
                <SectionHeader title="Workflow Launcher" icon={Play} />
                <WorkflowLauncher />
              </section>

              {/* Inbox */}
              <section>
                <SectionHeader
                  title="Inbox"
                  icon={Inbox}
                  action={
                    <button
                      type="button"
                      className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  }
                />
                <AlmanacCard className="p-1">
                  {inbox.map((item) => (
                    <InboxItem
                      key={item.id}
                      text={item.text}
                      isNew={item.isNew}
                    />
                  ))}
                  <div className="px-4 py-2.5">
                    <input
                      type="text"
                      placeholder="Capture a thought..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
                    />
                  </div>
                </AlmanacCard>
              </section>
            </div>

            {/* 2. Center Pane: Current Focus (50%) */}
            <div className="col-span-6 space-y-10">
              {/* Active Project Pulse */}
              <section>
                <SectionHeader title="Current Focus" icon={Activity} />
                {activeProject ? (
                  <ProjectPulse project={activeProject} />
                ) : (
                  <AlmanacCard className="p-8 text-center text-stone-400">
                    <p>No active project selected.</p>
                  </AlmanacCard>
                )}
              </section>

              {/* The Feed */}
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    Activity Stream
                  </h2>
                  <div className="flex gap-1">
                    {["All", "Proposals", "Decisions"].map((filter, i) => (
                      <button
                        type="button"
                        key={filter}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${i === 0 ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100"}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  {feed.map((item) => (
                    <ProposalEntry key={item.id} item={item} />
                  ))}
                </div>
              </section>
            </div>

            {/* 3. Right Pane: Reference (25%) */}
            <div className="col-span-3 space-y-8">
              {/* Areas */}
              <section>
                <SectionHeader title="Domains" icon={Layers} />
                <div className="space-y-1">
                  {areas.map((area) => (
                    <AreaItem key={area.id} area={area} />
                  ))}
                </div>
              </section>

              {/* Quick Reference */}
              <section>
                <SectionHeader title="Quick Reference" icon={Library} />
                <AlmanacCard className="p-2">
                  <QuickResource
                    icon={Brain}
                    title="Project Philosophy"
                    desc="Core values & principles"
                  />
                  <QuickResource
                    icon={Code}
                    title="Coding Standards"
                    desc="TypeScript & React patterns"
                  />
                  <QuickResource
                    icon={ListTodo}
                    title="Workflow Guide"
                    desc="Process documentation"
                  />
                </AlmanacCard>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
