import clsx from "clsx";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Inbox,
  Layout,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import type { DocItem } from "./docsUtils";
import { cleanLabel } from "./docsUtils";

interface DocsDashboardProps {
  allFiles: DocItem[];
  onSelect: (path: string) => void;
}

export function DocsDashboard({ allFiles, onSelect }: DocsDashboardProps) {
  // --- 1. Data Processing (Real + Mock) ---

  // Inbox: Filter for docs/0-inbox
  const inboxItems = allFiles
    .filter((f) => f.path.includes("0-inbox"))
    .slice(0, 5);

  // Projects: Filter for docs/1-project
  // MOCK: Adding status and progress to project folders for visualization
  const projectFolders = Array.from(
    new Set(
      allFiles
        .filter((f) => f.path.includes("1-project"))
        .map((f) => f.path.split("/")[2]), // Extract project name
    ),
  )
    .filter(Boolean)
    .map((name) => ({
      name: cleanLabel(name),
      path: `1-project/${name}`,
      // Mock data for "feeling"
      progress: Math.floor(Math.random() * 100),
      status: ["On Track", "At Risk", "Completed"][
        Math.floor(Math.random() * 3)
      ],
      lastUpdated: new Date(
        Date.now() - Math.floor(Math.random() * 1000000000),
      ).toLocaleDateString(),
    }))
    .slice(0, 6);

  // Recents: Sort by mock date (since we don't have file stats yet)
  // In a real implementation, we'd parse the YYYY-MMDD prefix or use git stats
  const recentFiles = [...allFiles]
    .sort(() => 0.5 - Math.random()) // Shuffle for mock variety
    .slice(0, 8)
    .map((f) => ({
      ...f,
      editedAt: new Date(
        Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000),
      ), // Random time within 5 days
    }));

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* --- Header Section --- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, User
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Calendar size={14} />
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            • Ready to organize your second brain?
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Quick Capture
          </button>
        </div>
      </div>

      {/* --- Bento Grid Layout --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 1. Inbox Widget (Span 4) */}
        <div className="col-span-1 md:col-span-4 flex flex-col bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Inbox size={18} className="text-indigo-500" />
              <span>Inbox</span>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                {inboxItems.length}
              </span>
            </div>
            <ArrowRight
              size={16}
              className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => onSelect("0-inbox")}
            />
          </div>

          <div className="flex-1 space-y-2">
            {inboxItems.length > 0 ? (
              inboxItems.map((item) => (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => onSelect(item.path)}
                  className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group/item"
                >
                  <div className="font-medium text-slate-700 text-sm truncate group-hover/item:text-indigo-700">
                    {cleanLabel(item.name)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 truncate opacity-70">
                    Captured just now
                  </div>
                </button>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                <Inbox size={32} className="mb-2 opacity-20" />
                All clear!
              </div>
            )}
          </div>
        </div>

        {/* 2. Active Projects (Span 8) */}
        <div className="col-span-1 md:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Layout size={18} className="text-emerald-500" />
              <span>Active Projects</span>
            </div>
            <button
              type="button"
              onClick={() => onSelect("1-project")}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectFolders.map((project) => (
              <div
                key={project.path}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelect(project.path)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div
                    className={clsx(
                      "w-2 h-2 rounded-full mt-1.5",
                      project.status === "On Track"
                        ? "bg-emerald-500"
                        : project.status === "At Risk"
                          ? "bg-rose-500"
                          : "bg-slate-300",
                    )}
                  />
                  <MoreHorizontal
                    size={14}
                    className="text-slate-300 hover:text-slate-600"
                  />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-emerald-700 truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Updated {project.lastUpdated}
                </p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}

            {/* New Project Placeholder */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer h-full min-h-[120px]">
              <Plus size={24} className="mb-2 opacity-50" />
              <span className="text-sm font-medium">New Project</span>
            </div>
          </div>
        </div>

        {/* 3. Recent Activity (Span 12) */}
        <div className="col-span-1 md:col-span-12 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-6">
            <Clock size={18} className="text-blue-500" />
            <span>Recent Activity</span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentFiles.map((file, _i) => (
              <div
                key={file.path}
                className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg -mx-2 transition-colors cursor-pointer group"
                onClick={() => onSelect(file.path)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {cleanLabel(file.name)}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="text-slate-400">
                        {file.path.split("/")[0]}
                      </span>
                      <span>•</span>
                      <span>Edited {file.editedAt.toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {file.editedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
