import { createFileRoute } from "@tanstack/react-router";
import {
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
} from "lucide-react";
import React from "react";

// --- Mock Data ---
const MOCK_INBOX = [
    { id: 1, title: "Meeting notes: Q1 Roadmap", time: "10:30 AM", tag: "Work" },
    { id: 2, title: "Book idea: The Minimalist Mind", time: "Yesterday", tag: "Personal" },
    { id: 3, title: "Grocery list for weekend", time: "Yesterday", tag: "Personal" },
    { id: 4, title: "React compiler research", time: "2 days ago", tag: "Dev" },
    { id: 5, title: "Design system patterns", time: "3 days ago", tag: "Design" },
];

const MOCK_PROJECTS = [
    { id: 1, title: "Interactive OS", progress: 75, status: "active", updated: "2h ago" },
    { id: 2, title: "Personal Website v4", progress: 30, status: "on-hold", updated: "1d ago" },
    { id: 3, title: "Fitness Tracker", progress: 10, status: "planning", updated: "3d ago" },
    { id: 4, title: "Home Automation", progress: 90, status: "active", updated: "1w ago" },
];

const MOCK_AREAS = [
    { id: 1, title: "Writing", count: 12, icon: "✍️" },
    { id: 2, title: "Development", count: 45, icon: "💻" },
    { id: 3, title: "Finance", count: 8, icon: "💰" },
    { id: 4, title: "Health", count: 15, icon: "❤️" },
];

const MOCK_RECENTS = [
    { id: 1, title: "Weekly Review - Feb 13", path: "0-inbox/weekly-review", type: "doc" },
    { id: 2, title: "Project Spec: Second Brain", path: "1-project/second-brain/spec", type: "doc" },
    { id: 3, title: "2024 Goals", path: "2-area/life/2024-goals", type: "doc" },
    { id: 4, title: "Typography Guidelines", path: "3-resource/design/typography", type: "doc" },
    { id: 5, title: "Meeting Notes - Team Sync", path: "archive/meetings/2024-02-10", type: "doc" },
    { id: 6, title: "Recipe: Sourdough Bread", path: "3-resource/cooking/sourdough", type: "doc" },
];

// --- Components ---

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.06)] hover:border-slate-300/80 transition-all duration-300 ${className}`}>
            {children}
        </div>
    );
}

function SectionHeader({ title, icon: Icon, action }: { title: string; icon?: React.ElementType; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-slate-800 font-semibold tracking-tight">
                {Icon && <Icon size={18} className="text-slate-400" />}
                <span>{title}</span>
            </div>
            {action}
        </div>
    );
}

function ProgressBar({ value, status }: { value: number; status: string }) {
    const color =
        status === "active" ? "bg-indigo-500" :
            status === "planning" ? "bg-amber-400" :
                status === "on-hold" ? "bg-slate-300" : "bg-emerald-500";

    return (
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
        </div>
    );
}

export default function DesignSecondBrain() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 pb-20">
            {/* Search & Navigation Bar */}
            <div className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md border-b border-transparent transition-all duration-300 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" /> {/* Logo Placeholder */}
                </div>
                <div className="flex-1 max-w-md mx-4 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-500">⌘</kbd>
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-500">K</kbd>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <Settings size={20} />
                    </button>
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                        US
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 pt-8 space-y-10">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in slide-in-from-bottom-4 duration-700">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight lg:text-5xl mb-2">
                            {greeting}, User.
                        </h1>
                        <p className="text-lg text-slate-500 font-medium flex items-center gap-2">
                            <span className="text-indigo-500"><Calendar size={18} /></span>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="hidden md:flex flex-col items-end mr-4 border-r border-slate-200 pr-6">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Focus</span>
                            <span className="font-medium text-slate-700">Finish the Dashboard Design</span>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
                            <Plus size={18} />
                            Quick Note
                        </button>
                    </div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">

                    {/* Main Inbox (Span 4) */}
                    <div className="col-span-1 md:col-span-4 row-span-2 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        <SectionHeader title="Inbox" icon={BookOpen} action={<span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{MOCK_INBOX.length}</span>} />
                        <Card className="flex-1 flex flex-col relative group">
                            <div className="w-full h-1 absolute top-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
                                {MOCK_INBOX.map((item) => (
                                    <button key={item.id} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors group/item relative border border-transparent hover:border-slate-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${item.tag === 'Work' ? 'bg-blue-50 text-blue-600' :
                                                item.tag === 'Dev' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.tag === 'Design' ? 'bg-pink-50 text-pink-600' :
                                                        'bg-slate-100 text-slate-500'
                                                }`}>{item.tag}</span>
                                            <span className="text-xs text-slate-400 font-medium">{item.time}</span>
                                        </div>
                                        <h3 className="text-sm font-medium text-slate-700 group-hover/item:text-slate-900 line-clamp-2 leading-relaxed">
                                            {item.title}
                                        </h3>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <ArrowRight size={14} className="text-indigo-500" />
                                        </div>
                                    </button>
                                ))}
                                <button className="w-full p-3 mt-2 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Plus size={14} /> Add to Inbox
                                </button>
                            </div>
                        </Card>
                    </div>

                    {/* Active Projects (Span 5) */}
                    <div className="col-span-1 md:col-span-5 row-span-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        <SectionHeader title="Active Projects" icon={CheckCircle2} action={<button className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">View All</button>} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                            {MOCK_PROJECTS.slice(0, 2).map((project) => (
                                <Card key={project.id} className="p-5 flex flex-col justify-between group h-full cursor-pointer relative">
                                    <div className="absolute top-4 right-4 text-slate-300 group-hover:text-slate-500 transition-colors">
                                        <MoreHorizontal size={16} />
                                    </div>
                                    <div>
                                        <div className={`w-2 h-2 rounded-full mb-3 ${project.status === 'active' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-300'
                                            }`} />
                                        <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                                        <p className="text-xs text-slate-400 font-medium">Updated {project.updated}</p>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                                            <span>Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <ProgressBar value={project.progress} status={project.status} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Areas (Span 3) */}
                    <div className="col-span-1 md:col-span-3 row-span-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                        <SectionHeader title="Areas" />
                        <Card className="p-1 h-full flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-1 h-full">
                                {MOCK_AREAS.map((area) => (
                                    <div key={area.id} className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{area.icon}</span>
                                        <span className="text-xs font-bold text-slate-700">{area.title}</span>
                                        <span className="text-[10px] font-semibold text-slate-400">{area.count} items</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Recent Activity (Span 8) */}
                    <div className="col-span-1 md:col-span-8 row-span-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
                        <SectionHeader title="Jump Back In" icon={Clock} />
                        <Card className="p-0 overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                {MOCK_RECENTS.slice(0, 3).map((recent) => (
                                    <div key={recent.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <BookOpen size={16} strokeWidth={2.5} />
                                            </div>
                                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider line-clamp-1">{recent.path.split('/')[0]}</div>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">{recent.title}</h4>
                                        <p className="text-xs text-slate-400 line-clamp-1">Last edited just now</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Quote / Inspiration (Span 4) */}
                    <div className="col-span-1 md:col-span-4 row-span-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
                        <SectionHeader title="Daily Insight" />
                        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-center h-full relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-6xl font-serif">"</span>
                            </div>
                            <p className="text-lg font-medium leading-relaxed mb-4 relative z-10 font-serif italic opacity-90">
                                "Your mind is for having ideas, not holding them."
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-60 relative z-10">
                                — David Allen
                            </p>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}

export const Route = createFileRoute("/_minimal/playground/design-second-brain")({
    component: DesignSecondBrain,
});
