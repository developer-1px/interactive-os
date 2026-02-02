
import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// Load all markdown files from the docs directory
const modules = import.meta.glob('../../docs/**/*.md', { query: '?raw', import: 'default' });

interface TreeNode {
    name: string;
    path: string;
    fullPath?: string;
    children: Record<string, TreeNode>;
    isFile: boolean;
}

// Helper to build tree from file paths
function buildTree(paths: string[]): Record<string, TreeNode> {
    const root: Record<string, TreeNode> = {};

    paths.forEach(filePath => {
        // filePath is like "../../docs/00_projects/foo.md"
        // Remove prefix and extension to get route path parts
        const relativePath = filePath.replace('../../docs/', '').replace('.md', '');
        const parts = relativePath.split('/');

        let current = root;
        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = {
                    name: part,
                    path: parts.slice(0, index + 1).join('/'),
                    fullPath: filePath,
                    children: {},
                    isFile: index === parts.length - 1
                };
            }
            if (index < parts.length - 1) {
                current = current[part].children;
            }
        });
    });

    return root;
}

const TreeItem = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = Object.keys(node.children).length > 0;

    return (
        <div className="select-none">
            {node.isFile ? (
                <NavLink
                    to={`/docs/${node.path}`}
                    className={({ isActive }) => clsx(
                        "flex items-center gap-2 py-1 px-2 rounded-md text-sm transition-colors cursor-pointer",
                        "hover:bg-white/5",
                        isActive ? "text-indigo-400 bg-indigo-500/10 font-medium" : "text-slate-400"
                    )}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    <FileText size={14} className={clsx("opacity-70", { "text-indigo-400": node.path })} />
                    <span className="truncate">{node.name}</span>
                </NavLink>
            ) : (
                <>
                    <div
                        className={clsx(
                            "flex items-center gap-1 py-1 px-2 text-sm font-medium text-slate-300 cursor-pointer hover:bg-white/5 rounded-md",
                        )}
                        style={{ paddingLeft: `${depth * 12}px` }}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {hasChildren && (
                            <span className="p-0.5 rounded hover:bg-white/10 text-slate-500">
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                        )}
                        {!hasChildren && <span className="w-4" />}
                        <Folder size={14} className="text-slate-500" />
                        <span className="truncate">{node.name}</span>
                    </div>
                    {isOpen && hasChildren && (
                        <div>
                            {Object.values(node.children)
                                .sort((a, b) => {
                                    // Folders first, then files
                                    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
                                    return a.isFile ? 1 : -1;
                                })
                                .map((child) => (
                                    <TreeItem key={child.path} node={child} depth={depth + 1} />
                                ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const MarkdownComponents: any = {
    h1: ({ node, ...props }: any) => <h1 className="text-4xl font-light tracking-tight mb-8 mt-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-2xl font-semibold text-white mt-12 mb-6 tracking-tight border-b border-white/5 pb-2" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-xl font-medium text-slate-100 mt-8 mb-4" {...props} />,
    h4: ({ node, ...props }: any) => <h4 className="text-lg font-medium text-indigo-300 mt-6 mb-3" {...props} />,
    p: ({ node, ...props }: any) => <p className="text-slate-300 leading-7 mb-4 font-light" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-6 mb-4 text-slate-300 marker:text-indigo-500" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-6 mb-4 text-slate-300 marker:text-indigo-500" {...props} />,
    li: ({ node, ...props }: any) => <li className="mb-2 pl-1" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-bold text-white drop-shadow-sm" {...props} />,
    a: ({ node, ...props }: any) => <a className="text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-indigo-500/30 underline-offset-4" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-indigo-500/30 pl-6 py-2 my-6 bg-white/[0.02] text-slate-400 italic rounded-r border-t border-b border-r border-transparent" {...props} />,
    hr: ({ node, ...props }: any) => <hr className="border-white/10 my-10" {...props} />,
    code: ({ node, className, children, ...props }: any) => {
        return (
            <code
                className={clsx(
                    "bg-white/10 text-indigo-200 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-white/5",
                    className
                )}
                {...props}
            >
                {children}
            </code>
        )
    },
    pre: ({ node, children, ...props }: any) => (
        <div className="rounded-xl overflow-hidden my-8 border border-white/5 bg-[#0D0F14] shadow-2xl relative group">
            <div className="flex items-center px-4 py-2 border-b border-white/5 bg-white/[0.02] justify-between">
                <div className="flex gap-1.5 opacity-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-500/20" />
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Code</div>
            </div>
            <pre
                className="p-4 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed [&>code]:bg-transparent [&>code]:text-inherit [&>code]:p-0 [&>code]:rounded-none [&>code]:text-inherit [&>code]:border-none"
                {...props}
            >
                {children}
            </pre>
        </div>
    )
};

export default function DocsPage() {
    const { "*": splat } = useParams();
    const [content, setContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const fileTree = useMemo(() => buildTree(Object.keys(modules)), []);
    const navigate = useNavigate();

    useEffect(() => {
        // If no path selected, find first file
        if (!splat) {
            const firstFile = Object.keys(modules)[0];
            if (firstFile) {
                const relativePath = firstFile.replace('../../docs/', '').replace('.md', '');
                navigate(`/docs/${relativePath}`, { replace: true });
            }
            return;
        }

        const loadContent = async () => {
            try {
                const filePath = `../../docs/${splat}.md`;
                const loader = modules[filePath];

                if (!loader) {
                    setError('File not found');
                    setContent('');
                    return;
                }

                const raw = await loader() as string;
                setContent(raw);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Failed to load document');
            }
        };

        loadContent();
    }, [splat, navigate]);

    return (
        <div className="flex h-screen w-full bg-[#090A0C] text-slate-200 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-72 border-r border-white/5 flex flex-col bg-[#090A0C] z-20">
                <div className="p-6 border-b border-white/5 font-semibold text-slate-100 flex items-center gap-3">
                    <span className="w-3 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                    <span className="text-lg tracking-tight">Documentation</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    <div className="space-y-0.5">
                        {Object.values(fileTree)
                            .sort((a, b) => {
                                if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
                                return a.isFile ? 1 : -1;
                            })
                            .map((node) => (
                                <TreeItem key={node.path} node={node} />
                            ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative flex flex-col bg-[#090A0C]">
                {/* Ambient Background */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 relative z-10 custom-scrollbar">
                    <div className="max-w-4xl mx-auto p-12 lg:p-16">
                        {error ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <FileText size={48} strokeWidth={1} className="mb-4 opacity-50" />
                                <p className="text-lg">{error}</p>
                            </div>
                        ) : (
                            <article className="animate-in fade-in cursor-text space-y-2">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={MarkdownComponents}
                                >
                                    {content}
                                </ReactMarkdown>
                            </article>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

