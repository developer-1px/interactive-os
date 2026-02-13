import { createFileRoute } from "@tanstack/react-router";
import {
    Archive,
    ArrowUpRight,
    BookOpen,
    BrainCircuit,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    FileText,
    Hash,
    Inbox,
    LayoutDashboard,
    Library,
    ListTodo,
    MoreHorizontal,
    Plus,
    Search,
    Tag,
    Target,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_minimal/playground/design-desktop-dashboard")({
    component: SecondBrainDashboard,
    staticData: {
        title: "Design: Second Brain",
        icon: BrainCircuit,
        location: "global-nav",
        order: 99,
    },
});

// --- Mock Data ---

const inbox = [
    { id: "i1", text: "Look into Framer Motion for animations", time: "10m" },
    { id: "i2", text: "Update documentation for v2.0", time: "1h" },
    { id: "i3", text: "Call mom", time: "3h" },
];

const projects = [
    {
        id: "p1",
        title: "Desktop Dashboard",
        progress: 65,
        status: "active",
        tags: ["dev", "ui"],
    },
    {
        id: "p2",
        title: "Kernel v2 Migration",
        progress: 20,
        status: "active",
        tags: ["core", "refactor"],
    },
    {
        id: "p3",
        title: "Q1 Hiring Plan",
        progress: 90,
        status: "review",
        tags: ["ops"],
    },
    {
        id: "p4",
        title: "Mobile Responsiveness",
        progress: 5,
        status: "planning",
        tags: ["dev"],
    },
];

const tasks = [
    { id: "t1", text: "Fix import analysis bug", done: false, area: "Dev" },
    { id: "t2", text: "Draft weekly update", done: true, area: "Ops" },
    { id: "t3", text: "Review PR #124", done: false, area: "Dev" },
    { id: "t4", text: "Plan weekend trip", done: false, area: "Life" },
];

const areas = [
    { id: "a1", icon: "🏠", title: "Home", color: "bg-orange-100 text-orange-700" },
    { id: "a2", icon: "💼", title: "Work", color: "bg-blue-100 text-blue-700" },
    { id: "a3", icon: "💪", title: "Health", color: "bg-green-100 text-green-700" },
    { id: "a4", icon: "💰", title: "Finance", color: "bg-yellow-100 text-yellow-700" },
    { id: "a5", icon: "📚", title: "Study", color: "bg-purple-100 text-purple-700" },
    { id: "a6", icon: "🎨", title: "Hobby", color: "bg-pink-100 text-pink-700" },
];

const resources = [
    { id: "r1", title: "Design System Guidelines", type: "Docs" },
    { id: "r2", title: "React 19 Alpha Notes", type: "Web" },
    { id: "r3", title: "Project Template 2026", type: "Template" },
    { id: "r4", title: "Brand Assets", type: "File" },
    { id: "r5", title: "Meeting Notes Q1", type: "Note" },
];

// --- Components ---

function BentoCard({
    children,
    className = "",
    title,
    icon: Icon,
    action,
}: {
    children: React.ReactNode;
    className?: string;
    title?: string;
    icon?: any;
    action?: React.ReactNode;
}) {
    return (
        <div className={`bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden ${className}`}>
            {title && (
                <div className="px-5 py-4 flex items-center justify-between border-b border-stone-100/50">
                    <div className="flex items-center gap-2.5 text-stone-700">
                        {Icon && <Icon size={16} className="text-stone-400" />}
                        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
                    </div>
                    {action}
                </div>
            )}
            <div className="p-5 flex-1 min-h-0">{children}</div>
        </div>
    );
}

function InboxItem({ item }: { item: any }) {
    return (
        <div className="flex items-start gap-3 py-2 border-b border-stone-50 last:border-0 group cursor-pointer hover:bg-stone-50/50 -mx-2 px-2 rounded-lg transition-colors">
            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 group-hover:scale-125 transition-transform" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-700 leading-snug font-medium">{item.text}</p>
                <span className="text-[10px] text-stone-400 font-medium">{item.time} ago</span>
            </div>
            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded text-stone-400 transition-all">
                <CheckSquare size={14} />
            </button>
        </div>
    );
}

function ProjectCompact({ project }: { project: any }) {
    return (
        <div className="flex flex-col gap-2 p-3 bg-stone-50/50 rounded-xl border border-stone-100 hover:border-stone-300 hover:shadow-sm cursor-pointer transition-all group">
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm text-stone-800 leading-tight group-hover:text-blue-600 transition-colors">
                    {project.title}
                </h4>
                {project.status === "review" && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${project.progress > 80
                            ? "bg-emerald-500"
                            : project.progress > 40
                                ? "bg-blue-500"
                                : "bg-stone-400"
                            }`}
                        style={{ width: `${project.progress}%` }}
                    />
                </div>
            </div>

            <div className="flex gap-1 mt-1">
                {project.tags.map((t: string) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-500">
                        #{t}
                    </span>
                ))}
            </div>
        </div>
    );
}

function TaskItem({ task }: { task: any }) {
    return (
        <div className="flex items-center gap-3 py-2 group">
            <button className={`
                w-5 h-5 rounded border flex items-center justify-center transition-all
                ${task.done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-stone-300 hover:border-emerald-500 text-transparent hover:bg-emerald-50"}
            `}>
                <CheckCircle2 size={12} fill="currentColor" className={task.done ? "text-emerald-500 bg-white rounded-full" : "opacity-0"} />
            </button>
            <span className={`flex-1 text-sm transition-all ${task.done ? "text-stone-400 line-through" : "text-stone-700"}`}>
                {task.text}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">
                {task.area}
            </span>
        </div>
    );
}

function SecondBrainDashboard() {
    return (
        <div className="min-h-screen bg-stone-100 p-6 font-sans text-stone-800 flex justify-center overflow-y-auto">
            <div className="w-full max-w-7xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                            <BrainCircuit className="text-stone-400" />
                            Second Brain
                        </h1>
                        <p className="text-stone-500 text-sm mt-1 font-medium">Everything under control.</p>
                    </div>

                    <div className="flex items-center bg-white rounded-full border border-stone-200 shadow-sm px-4 py-2 w-96 gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
                        <Search size={18} className="text-stone-400" />
                        <input
                            type="text"
                            placeholder="Type to search..."
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-stone-400"
                        />
                        <span className="text-[10px] font-bold text-stone-400 border border-stone-200 rounded px-1.5 py-0.5 bg-stone-50">⌘K</span>
                    </div>

                    <div className="flex gap-2">
                        <button className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-stone-500/20 transition-all flex items-center gap-2">
                            <Plus size={16} /> Capture
                        </button>
                    </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

                    {/* 1. Inbox - Quick Capture (Tall) */}
                    <BentoCard
                        title="Inbox"
                        icon={Inbox}
                        className="md:col-span-1 md:row-span-2 border-l-4 border-l-blue-500"
                        action={<span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">3</span>}
                    >
                        <div className="space-y-1">
                            {inbox.map(i => <InboxItem key={i.id} item={i} />)}
                        </div>
                        <div className="mt-4 pt-4 border-t border-stone-100">
                            <input
                                type="text"
                                placeholder="Add a thought..."
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 focus:bg-white transition-all"
                            />
                        </div>
                    </BentoCard>

                    {/* 2. Active Projects (Wide) */}
                    <BentoCard
                        title="Active Projects"
                        icon={Target}
                        className="md:col-span-2 md:row-span-1"
                        action={<button className="text-xs text-stone-400 hover:text-stone-600 font-medium flex items-center gap-1">View All <ArrowUpRight size={12} /></button>}
                    >
                        <div className="grid grid-cols-2 gap-4 h-full">
                            {projects.slice(0, 4).map(p => <ProjectCompact key={p.id} project={p} />)}
                        </div>
                    </BentoCard>

                    {/* 3. Areas (Small Tile) */}
                    <BentoCard title="Areas" icon={LayoutDashboard} className="md:col-span-1 md:row-span-1">
                        <div className="grid grid-cols-2 gap-2 h-full content-start">
                            {areas.map(a => (
                                <div key={a.id} className={`flex flex-col items-center justify-center p-2 rounded-lg ${a.color} bg-opacity-20 hover:bg-opacity-30 cursor-pointer transition-all aspect-video`}>
                                    <span className="text-xl mb-1">{a.icon}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{a.title}</span>
                                </div>
                            ))}
                        </div>
                    </BentoCard>

                    {/* 4. Today's Focus (Wide) */}
                    <BentoCard
                        title="Today's Focus"
                        icon={ListTodo}
                        className="md:col-span-2 md:row-span-1"
                    >
                        <div className="space-y-1">
                            {tasks.map(t => <TaskItem key={t.id} task={t} />)}
                        </div>
                    </BentoCard>

                    {/* 5. Library / Resources (Square) */}
                    <BentoCard title="Library" icon={Library} className="md:col-span-1 md:row-span-2">
                        <div className="space-y-2">
                            {resources.map(r => (
                                <div key={r.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg group cursor-pointer transition-colors">
                                    <div className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded text-stone-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        {r.type === 'File' ? <FileText size={16} /> : r.type === 'Web' ? <BrowserIcon /> : <BookOpen size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-stone-700 truncate">{r.title}</div>
                                        <div className="text-[10px] text-stone-400">{r.type}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </BentoCard>

                    {/* 6. Archives (Small) */}
                    <BentoCard title="Archives" icon={Archive} className="md:col-span-1 md:row-span-1 bg-stone-50/50">
                        <div className="h-full flex flex-col justify-center items-center text-stone-400 gap-2 cursor-pointer hover:text-stone-600 transition-colors">
                            <Archive size={32} strokeWidth={1.5} />
                            <span className="text-xs font-medium">Browse History</span>
                        </div>
                    </BentoCard>

                    {/* 7. Stats / Quote */}
                    <BentoCard className="md:col-span-1 md:row-span-1 bg-stone-900 text-stone-200 flex flex-col justify-center items-center text-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                        <div className="text-3xl font-bold text-white mb-2">85%</div>
                        <div className="text-xs text-stone-400 uppercase tracking-widest font-bold">Weekly Goal</div>
                        <div className="mt-4 w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[85%]" />
                        </div>
                    </BentoCard>

                </div>
            </div>
        </div>
    );
}

function BrowserIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}
