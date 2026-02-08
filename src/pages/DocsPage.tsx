import clsx from "clsx";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cleanLabel, type DocItem, DocsSidebar } from "./docs/DocsSidebar";

// Load all markdown files from the docs directory
const modules = import.meta.glob("../../docs/**/*.md", {
  query: "?raw",
  import: "default",
});

// Helper to build the tree structure
function buildDocTree(paths: string[]): DocItem[] {
  const root: DocItem[] = [];

  paths.forEach((filePath) => {
    const relativePath = filePath.replace("../../docs/", "").replace(".md", "");
    const parts = relativePath.split("/");

    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existingItem = currentLevel.find((item) => item.name === part);

      if (existingItem) {
        if (!existingItem.children) {
          existingItem.children = [];
        }
        currentLevel = existingItem.children;
      } else {
        const newItem: DocItem = {
          name: part,
          path: isFile ? relativePath : parts.slice(0, index + 1).join("/"),
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(newItem);
        if (!isFile) {
          currentLevel = newItem.children!;
        }
      }
    });
  });

  // Sort function: Folders first, then files. Alphabetical within groups.
  const sortItems = (items: DocItem[]) => {
    items.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });
    items.forEach((item) => {
      if (item.children) {
        sortItems(item.children);
      }
    });
  };

  sortItems(root);
  return root;
}

// Flatten tree for next/prev navigation
function flattenTree(items: DocItem[]): DocItem[] {
  let flat: DocItem[] = [];
  items.forEach((item) => {
    if (item.type === "file") {
      flat.push(item);
    }
    if (item.children) {
      flat = flat.concat(flattenTree(item.children));
    }
  });
  return flat;
}

// ... MarkdownComponents ...
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MarkdownComponents: Record<string, React.FC<any>> = {
  h1: (props) => (
    <h1
      className="text-3xl font-extrabold tracking-tight mb-6 mt-4 text-slate-900 leading-[1.2] max-w-2xl"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="text-xl font-bold text-slate-850 mt-10 mb-5 tracking-tight border-b border-slate-100 pb-2.5 max-w-2xl"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="text-lg font-bold text-slate-800 mt-8 mb-3.5 tracking-tight max-w-2xl"
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className="text-[15px] font-bold text-slate-800 mt-6 mb-3 tracking-tight max-w-2xl"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="text-slate-600 leading-[1.65] mb-4 text-[14px] font-normal max-w-2xl"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="list-disc list-outside ml-6 mb-5 text-slate-600 space-y-1.5 text-[14px] marker:text-indigo-400 max-w-2xl"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="list-decimal list-outside ml-6 mb-5 text-slate-600 space-y-1.5 text-[14px] marker:text-indigo-400 font-medium max-w-2xl"
      {...props}
    />
  ),
  li: (props) => <li className="pl-2" {...props} />,
  strong: (props) => <strong className="font-bold text-slate-900" {...props} />,
  a: (props) => (
    <a
      className="text-indigo-600 font-medium hover:text-indigo-700 transition-all border-b border-indigo-200 hover:border-indigo-500 pb-0.5"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-indigo-500 pl-6 py-3 my-6 bg-slate-50 text-slate-700 italic rounded-r-xl text-[14px] font-medium max-w-2xl"
      {...props}
    />
  ),
  hr: (props) => <hr className="border-slate-100 my-8 max-w-2xl" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ className, children, ...props }: any) => {
    return (
      <code
        className={clsx(
          "bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-medium border border-slate-200/50",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pre: ({ children, ...props }: any) => (
    <div className="rounded-xl overflow-hidden my-8 border border-slate-200 bg-[#fbfcfd] shadow-sm relative group max-w-4xl">
      <div className="flex items-center px-4 py-2 border-b border-slate-100 bg-slate-50/50 justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
        </div>
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
          Snippet
        </div>
      </div>
      <pre
        className="p-5 overflow-x-auto text-[12px] text-slate-700 font-mono leading-relaxed [&>code]:bg-transparent [&>code]:text-inherit [&>code]:p-0 [&>code]:rounded-none [&>code]:border-none"
        {...props}
      >
        {children}
      </pre>
    </div>
  ),
  table: (props) => (
    <div className="my-8 overflow-x-auto max-w-4xl border border-slate-200 rounded-lg">
      <table className="w-full border-collapse text-[13px]" {...props} />
    </div>
  ),
  thead: (props) => (
    <thead className="bg-slate-50/80 border-b border-slate-200" {...props} />
  ),
  th: (props) => (
    <th
      className="px-5 py-3 text-left font-bold text-slate-900 uppercase tracking-wider text-[10px]"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="px-5 py-3 border-b border-slate-100 text-slate-600"
      {...props}
    />
  ),
};

export default function DocsPage() {
  const { "*": splat } = useParams();
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const docTree = useMemo(() => buildDocTree(Object.keys(modules)), []);
  const allFiles = useMemo(() => flattenTree(docTree), [docTree]);
  const navigate = useNavigate();

  const currentIndex = allFiles.findIndex((f) => f.path === splat);
  const prevFile = currentIndex > 0 ? allFiles[currentIndex - 1] : null;
  const nextFile =
    currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null;

  useEffect(() => {
    if (!splat) {
      const firstFile = allFiles[0];
      if (firstFile) {
        navigate(`/docs/${firstFile.path}`, { replace: true });
      }
      return;
    }

    const loadContent = async () => {
      try {
        const filePath = `../../docs/${splat}.md`;
        const loader = modules[filePath];

        if (!loader) {
          setError("Document not found");
          setContent("");
          return;
        }

        const raw = (await loader()) as string;
        setContent(raw);
        setError(null);
      } catch (error) {
        console.error(error);
        setError("Failed to load document");
      }
    };

    loadContent();
  }, [splat, navigate, allFiles]);

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <DocsSidebar items={docTree} />

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col bg-white overflow-hidden">
        {/* Decorative Background Elements */}
        {/* <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none opacity-50" />
        <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] pointer-events-none opacity-40" /> */}

        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pt-6">
          <div className="px-12 py-12 lg:px-16 w-full max-w-5xl mx-auto">
            {error ? (
              <div className="flex flex-col items-center justify-center py-40 text-slate-300">
                <FileText
                  size={64}
                  strokeWidth={1}
                  className="mb-6 opacity-20"
                />
                <p className="text-xl font-medium text-slate-400">{error}</p>
                <button
                  onClick={() => navigate("/docs")}
                  className="mt-8 px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <article className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
                {/* Document Metadata Header */}
                <div className="flex items-center gap-2 mb-10 border-b border-slate-50 pb-6">
                  {splat?.split("/").map((part, i, arr) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-slate-300">/</span>}
                      <span
                        className={clsx(
                          "text-sm font-medium",
                          i === arr.length - 1
                            ? "text-slate-900"
                            : "text-slate-400",
                        )}
                      >
                        {cleanLabel(part)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="docs-content max-w-3xl">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={MarkdownComponents}
                  >
                    {content}
                  </ReactMarkdown>
                </div>

                {/* Navigation Buttons */}
                <div className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-between gap-4 max-w-3xl">
                  {prevFile ? (
                    <NavLink
                      to={`/docs/${prevFile.path}`}
                      className="group flex flex-col items-start gap-1"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        <ChevronLeft size={12} strokeWidth={3} />
                        Previous
                      </span>
                      <span className="text-base font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {cleanLabel(prevFile.name)}
                      </span>
                    </NavLink>
                  ) : (
                    <div />
                  )}

                  {nextFile ? (
                    <NavLink
                      to={`/docs/${nextFile.path}`}
                      className="group flex flex-col items-end gap-1 text-right"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        Next
                        <ChevronRight size={12} strokeWidth={3} />
                      </span>
                      <span className="text-base font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {cleanLabel(nextFile.name)}
                      </span>
                    </NavLink>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Footer Spacer */}
                <div className="h-40" />
              </article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
