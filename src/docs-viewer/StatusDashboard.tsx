/**
 * StatusDashboard — Structured visualization of STATUS.md.
 *
 * Replaces MarkdownRenderer when activePath points to STATUS.md.
 * Uses parseStatusMd to transform raw markdown → structured data.
 */
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowRight,
  Flame,
  FolderOpen,
  Layers,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { DocsReaderUI } from "./app";
import { parseStatusMd, type StatusData } from "./docsUtils";

interface StatusDashboardProps {
  content: string;
}

export function StatusDashboard({ content }: StatusDashboardProps) {
  const data: StatusData = useMemo(() => parseStatusMd(content), [content]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Active Focus */}
      {data.activeFocus.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <Flame size={18} className="text-orange-500" />
            Active Focus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.activeFocus.map((focus) => (
              <DocsReaderUI.Item
                key={`${focus.domain}/${focus.project}`}
                id={`1-project/${focus.domain}/${focus.project}/BOARD`}
                asChild
              >
                <button
                  type="button"
                  className="text-left p-4 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                      {focus.domain}
                    </span>
                    {focus.weight && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {focus.weight}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-orange-700">
                    {focus.project}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {focus.description}
                  </p>
                </button>
              </DocsReaderUI.Item>
            ))}
          </div>
        </section>
      )}

      {/* Domains */}
      {data.domains.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <Layers size={18} className="text-indigo-500" />
            Domains
          </h2>
          <div className="space-y-6">
            {data.domains.map((domain) => (
              <div
                key={domain.name}
                className="rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <FolderOpen size={14} className="text-indigo-400" />
                  <h3 className="font-semibold text-slate-800 text-sm">
                    {domain.name}
                  </h3>
                  {domain.description && (
                    <span className="text-xs text-slate-400 ml-2">
                      {domain.description}
                    </span>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs">
                      <th className="text-left px-4 py-2 font-medium">
                        Project
                      </th>
                      <th className="text-left px-4 py-2 font-medium">Phase</th>
                      <th className="text-left px-4 py-2 font-medium">
                        Last Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {domain.projects.map((project) => (
                      <DocsReaderUI.Item
                        key={project.name}
                        id={`1-project/${domain.name}/${project.name}/BOARD`}
                        asChild
                      >
                        <tr className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {project.isFocus && (
                                <Flame
                                  size={12}
                                  className="text-orange-500 shrink-0"
                                />
                              )}
                              <span
                                className={clsx(
                                  "font-medium",
                                  project.isFocus
                                    ? "text-orange-700"
                                    : "text-slate-700",
                                )}
                              >
                                {project.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {project.phase}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={clsx(
                                "text-xs",
                                project.lastActivity.includes("⚠️")
                                  ? "text-amber-600 font-medium"
                                  : "text-slate-400",
                              )}
                            >
                              {project.lastActivity}
                            </span>
                          </td>
                        </tr>
                      </DocsReaderUI.Item>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Migrations */}
      {data.migrations.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <Zap size={18} className="text-amber-500" />
            Active Migrations
          </h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs">
                  <th className="text-left px-4 py-2 font-medium">
                    Old Pattern
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    <ArrowRight size={12} className="inline" /> New Pattern
                  </th>
                  <th className="text-left px-4 py-2 font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {data.migrations.map((migration, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">
                      {migration.oldPattern}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">
                      {migration.newPattern}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {migration.remaining}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Summary */}
      {data.summary.size > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <AlertTriangle size={18} className="text-slate-400" />
            Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(data.summary.entries()).map(([metric, value]) => (
              <div
                key={metric}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-center"
              >
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{metric}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-20" />
    </div>
  );
}
