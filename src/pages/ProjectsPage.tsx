import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileText,
    FolderOpen,
    MessageSquare,
    Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MarkdownRenderer } from "../docs-viewer/MarkdownRenderer";
import { docsModules, loadDocContent } from "../docs-viewer/docsUtils";

/* ── Types ─────────────────────────────────────── */

interface ProjectFile {
    role: "discussion" | "prd" | "kpi" | "proposal" | "status" | "other";
    label: string;
    path: string; // relative to docs/, without .md
}

interface Project {
    slug: string;
    label: string;
    files: ProjectFile[];
}

/* ── File role detection ──────────────────────── */

function detectRole(filename: string): ProjectFile["role"] {
    const lower = filename.toLowerCase();
    if (lower.includes("discussion") || lower.includes("journey"))
        return "discussion";
    if (lower.includes("prd")) return "prd";
    if (lower.includes("kpi")) return "kpi";
    if (lower.includes("proposal")) return "proposal";
    if (lower.includes("status")) return "status";
    return "other";
}

const roleOrder: Record<ProjectFile["role"], number> = {
    status: 0,
    prd: 1,
    kpi: 2,
    proposal: 3,
    discussion: 4,
    other: 5,
};

const roleIcon: Record<ProjectFile["role"], typeof FileText> = {
    status: Clock,
    prd: Target,
    kpi: CheckCircle2,
    proposal: FileText,
    discussion: MessageSquare,
    other: FileText,
};

// Simplified monochrome/neutral palette for tags
const roleBadge: Record<ProjectFile["role"], string> = {
    status: "Status",
    prd: "PRD",
    kpi: "KPI",
    proposal: "Proposal",
    discussion: "Discussion",
    other: "Note",
};

/* ── Parse progress from markdown ─────────────── */

function parseProgress(content: string): {
    done: number;
    total: number;
} | null {
    const checked = (content.match(/- \[x\]/gi) || []).length;
    const unchecked = (content.match(/- \[ \]/g) || []).length;
    const total = checked + unchecked;
    if (total === 0) return null;
    return { done: checked, total };
}

/* ── Build project list from glob ─────────────── */

function buildProjects(): Project[] {
    const prefix = "../../docs/1-project/";
    const projectMap = new Map<string, ProjectFile[]>();

    for (const fullPath of Object.keys(docsModules)) {
        if (!fullPath.startsWith(prefix)) continue;

        const relative = fullPath.replace(prefix, "").replace(".md", "");
        const parts = relative.split("/");
        if (parts.length < 2) continue; // skip loose files

        const slug = parts[0]!;
        // skip nested directories like notes/
        if (parts.length > 2) continue;

        const filename = parts[parts.length - 1]!;

        if (!projectMap.has(slug)) projectMap.set(slug, []);
        projectMap.get(slug)!.push({
            role: detectRole(filename),
            label: filename
                .replace(/^\d+-/, "")
                .replace(/^\d{4}-\d{4}-\d{4}-\[[a-z]+\]-/, "")
                .replace(/^\d{4}-\d{2}-\d{2}[-_](\d{4}[-_])?/, "")
                .replace(/[-_]/g, " ")
                .trim(),
            path: `1-project/${relative}`,
        });
    }

    const projects: Project[] = [];
    for (const [slug, files] of projectMap) {
        files.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
        projects.push({
            slug,
            label: slug.replace(/-/g, " "),
            files,
        });
    }

    projects.sort((a, b) => a.label.localeCompare(b.label));
    return projects;
}

/* ── Components ───────────────────────────────── */

function ProgressBar({ done, total }: { done: number; total: number }) {
    const pct = Math.round((done / total) * 100);
    return (
        <div className="flex items-center gap-3 group">
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                <div
                    className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[11px] font-medium text-stone-500 tabular-nums whitespace-nowrap">
                {done}/{total}
            </span>
        </div>
    );
}

function ProjectCard({
    project,
    progress,
    onClick,
}: {
    project: Project;
    progress: { done: number; total: number } | null;
    onClick: () => void;
}) {
    const fileCount = project.files.length;

    // Status badges are now text-only or very subtle
    const hasStatus = project.files.some((f) => f.role === "status");

    return (
        <button
            type="button"
            onClick={onClick}
            className="group text-left w-full bg-white rounded-xl border border-stone-200 p-5 hover:border-stone-400/70 hover:shadow-sm transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
            {/* Top accent bar for active projects */}
            {hasStatus && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-80" />
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-4 mt-1">
                <div className="flex items-center gap-3">
                    {/* Clean Avatar */}
                    <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 text-base font-bold">
                        {project.label.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-stone-900 capitalize leading-tight group-hover:text-emerald-700 transition-colors">
                            {project.label}
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5 font-medium">
                            {fileCount} document{fileCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress */}
            {progress && (
                <div className="mb-4">
                    <ProgressBar done={progress.done} total={progress.total} />
                </div>
            )}

            {/* File tags - Uniform pills */}
            <div className="flex flex-wrap gap-2">
                {project.files.slice(0, 6).map((f) => {
                    const Icon = roleIcon[f.role];
                    const isMain = f.role === 'status' || f.role === 'prd';
                    return (
                        <span
                            key={f.path}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border transition-colors
                                ${isMain
                                    ? "bg-stone-50 border-stone-200 text-stone-700"
                                    : "bg-white border-stone-100 text-stone-500"
                                }`}
                        >
                            {/* Only show icon for key roles to reduce clutter */}
                            {isMain && <Icon size={10} className="text-stone-400" />}
                            {roleBadge[f.role]}
                        </span>
                    );
                })}
                {project.files.length > 6 && (
                    <span className="inline-flex items-center px-1.5 text-[10px] text-stone-400 font-medium">
                        +{project.files.length - 6}
                    </span>
                )}
            </div>
        </button>
    );
}

function ProjectDetail({
    project,
    onBack,
}: {
    project: Project;
    onBack: () => void;
}) {
    const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState<{
        done: number;
        total: number;
    } | null>(null);

    const handleFileClick = useCallback(
        async (file: ProjectFile) => {
            if (selectedFile?.path === file.path) {
                // Don't deselect, just return (keeps document open)
                return;
            }
            setSelectedFile(file);
            setLoading(true);
            try {
                const md = await loadDocContent(file.path);
                setContent(md);
                if (file.role === "status") {
                    setProgress(parseProgress(md));
                }
            } catch {
                setContent("_Failed to load document._");
            }
            setLoading(false);
        },
        [selectedFile?.path],
    );

    // Auto-load status on mount
    useEffect(() => {
        const statusFile = project.files.find((f) => f.role === "status");
        if (statusFile) handleFileClick(statusFile);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.slug]);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header Bar - Clean and crisp */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="group flex items-center gap-1.5 px-3 py-1.5 -ml-2 rounded-md hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-600" />
                        Back
                    </button>
                    <div className="h-6 w-px bg-stone-200" /> {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-stone-800 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {project.label.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-900 capitalize leading-none">
                                {project.label}
                            </h2>
                        </div>
                    </div>
                </div>

                {progress && (
                    <div className="w-64">
                        {/* Compact progress in header */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Progress</span>
                            <div className="flex-1 h-2 bg-stone-100 rounded-full border border-stone-200 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-stone-700">{Math.round((progress.done / progress.total) * 100)}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Body: Sidebar + Content */}
            <div className="flex-1 flex min-h-0">
                {/* Left sidebar: File list - File tree style */}
                <div className="w-64 flex-shrink-0 border-r border-stone-200 overflow-y-auto bg-stone-50/50">
                    <div className="p-4 space-y-6">
                        {/* Group by 'Phase' conceptually, but for now just list */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Documents</h3>
                            <div className="space-y-0.5">
                                {project.files.map((file) => {
                                    const Icon = roleIcon[file.role];
                                    const isActive = selectedFile?.path === file.path;
                                    return (
                                        <button
                                            key={file.path}
                                            type="button"
                                            onClick={() => handleFileClick(file)}
                                            className={`w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg transition-all text-sm ${isActive
                                                ? "bg-white border border-stone-200 shadow-sm text-emerald-700 font-semibold"
                                                : "text-stone-600 hover:bg-stone-100 border border-transparent"
                                                }`}
                                        >
                                            <Icon
                                                size={16}
                                                className={`mt-0.5 flex-shrink-0 ${isActive ? "text-emerald-500" : "text-stone-400"
                                                    }`}
                                            />
                                            <div className="min-w-0 leading-snug">
                                                <div className="capitalize">
                                                    {file.label.length > 30 ? file.label.slice(0, 30) + "..." : file.label}
                                                </div>
                                                <div className="text-[10px] text-stone-400 font-medium mt-0.5 uppercase tracking-wide">
                                                    {roleBadge[file.role]}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Content - Document style */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-4xl mx-auto px-8 py-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 space-y-3">
                                <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
                                <span className="text-sm text-stone-400">Loading document...</span>
                            </div>
                        ) : content ? (
                            <div className="prose prose-stone prose-lg max-w-none">
                                <MarkdownRenderer content={content} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-60 text-stone-400 border-2 border-dashed border-stone-100 rounded-xl m-10">
                                <FolderOpen size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium text-stone-300">Select a document to view</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ────────────────────────────────── */

export function ProjectsPage() {
    const projects = useMemo(() => buildProjects(), []);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [progressMap, setProgressMap] = useState<
        Map<string, { done: number; total: number }>
    >(new Map());

    // Load progress for all projects on mount
    useEffect(() => {
        const loadAllProgress = async () => {
            const map = new Map<string, { done: number; total: number }>();
            for (const project of projects) {
                const statusFile = project.files.find((f) => f.role === "status");
                if (statusFile) {
                    try {
                        const md = await loadDocContent(statusFile.path);
                        const prog = parseProgress(md);
                        if (prog) map.set(project.slug, prog);
                    } catch {
                        // skip
                    }
                }
            }
            setProgressMap(map);
        };
        loadAllProgress();
    }, [projects]);

    if (selectedProject) {
        return (
            <div className="h-full bg-white">
                <ProjectDetail
                    project={selectedProject}
                    onBack={() => setSelectedProject(null)}
                />
            </div>
        );
    }

    // --- Project List (Refined Basecamp-style) ---
    const withProgress = projects.filter((p) => progressMap.has(p.slug));
    const withoutProgress = projects.filter((p) => !progressMap.has(p.slug));

    return (
        <div className="h-full overflow-y-auto bg-stone-50">
            <div className="max-w-6xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">
                        Projects HQ
                    </h1>
                    <p className="text-stone-500 font-medium text-sm">
                        {projects.length} active initiatives
                    </p>
                </div>

                {/* Active Projects (with progress) */}
                {withProgress.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-widest">
                                In Progress
                            </h2>
                            <div className="h-px bg-stone-200 flex-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {withProgress.map((p) => (
                                <ProjectCard
                                    key={p.slug}
                                    project={p}
                                    progress={progressMap.get(p.slug) ?? null}
                                    onClick={() => setSelectedProject(p)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Other Projects */}
                {withoutProgress.length > 0 && (
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                                Backlog & Archives
                            </h2>
                            <div className="h-px bg-stone-200 flex-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {withoutProgress.map((p) => (
                                <ProjectCard
                                    key={p.slug}
                                    project={p}
                                    progress={null}
                                    onClick={() => setSelectedProject(p)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
