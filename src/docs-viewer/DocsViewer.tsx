import clsx from "clsx";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DocsSidebar } from "./DocsSidebar";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  buildDocTree,
  cleanLabel,
  docsModules,
  flattenTree,
  loadDocContent,
} from "./docsUtils";

export function DocsViewer() {
  const [activePath, setActivePath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const docTree = useMemo(
    () => buildDocTree(Object.keys(docsModules)),
    [],
  );
  const allFiles = useMemo(() => flattenTree(docTree), [docTree]);

  const currentIndex = allFiles.findIndex((f) => f.path === activePath);
  const prevFile = currentIndex > 0 ? allFiles[currentIndex - 1] : null;
  const nextFile =
    currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null;

  // Auto-select first file on mount
  useEffect(() => {
    if (!activePath && allFiles.length > 0) {
      const first = allFiles[0];
      if (first) setActivePath(first.path);
    }
  }, [activePath, allFiles]);

  useEffect(() => {
    if (!activePath) return;

    loadDocContent(activePath)
      .then((raw) => {
        setContent(raw);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message ?? "Failed to load document");
        setContent("");
      });
  }, [activePath]);

  const handleSelect = (path: string) => {
    setActivePath(path);
  };

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <DocsSidebar
        items={docTree}
        activePath={activePath}
        onSelect={handleSelect}
      />

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col bg-white overflow-hidden">
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
                  type="button"
                  onClick={() => {
                    if (allFiles[0]) setActivePath(allFiles[0].path);
                  }}
                  className="mt-8 px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <article className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
                {/* Document Metadata Header */}
                <div className="flex items-center gap-2 mb-10 border-b border-slate-50 pb-6">
                  {activePath?.split("/").map((part, i, arr) => (
                    <div key={part} className="flex items-center gap-2">
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

                <MarkdownRenderer content={content} />

                {/* Navigation Buttons */}
                <div className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-between gap-4 max-w-3xl">
                  {prevFile ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(prevFile.path)}
                      className="group flex flex-col items-start gap-1"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        <ChevronLeft size={12} strokeWidth={3} />
                        Previous
                      </span>
                      <span className="text-base font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {cleanLabel(prevFile.name)}
                      </span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextFile ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(nextFile.path)}
                      className="group flex flex-col items-end gap-1 text-right"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        Next
                        <ChevronRight size={12} strokeWidth={3} />
                      </span>
                      <span className="text-base font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {cleanLabel(nextFile.name)}
                      </span>
                    </button>
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
