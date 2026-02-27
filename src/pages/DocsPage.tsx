import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DocsReaderUI } from "../docs-viewer/app";
import { DocsDashboard } from "../docs-viewer/DocsDashboard";
import { DocsSidebar } from "../docs-viewer/DocsSidebar";
import {
  buildDocTree,
  cleanLabel,
  docsModules,
  flattenTree,
  loadDocContent,
} from "../docs-viewer/docsUtils";
import { MarkdownRenderer } from "../docs-viewer/MarkdownRenderer";

export default function DocsPage() {
  const location = useLocation();
  const splat = location.pathname.replace(/^\/docs\/?/, "") || undefined;
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const docTree = useMemo(() => buildDocTree(Object.keys(docsModules)), []);
  const allFiles = useMemo(() => flattenTree(docTree), [docTree]);
  const navigate = useNavigate();

  const currentIndex = allFiles.findIndex((f) => f.path === splat);
  const prevFile = currentIndex > 0 ? allFiles[currentIndex - 1] : null;
  const nextFile =
    currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null;

  useEffect(() => {
    if (!splat) {
      // No more auto-redirect! We show the dashboard instead.
      return;
    }

    loadDocContent(splat)
      .then((raw) => {
        setContent(raw);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message ?? "Failed to load document");
        setContent("");
      });
  }, [splat]);

  // Reset scroll on file change
  // biome-ignore lint/correctness/useExhaustiveDependencies: splat triggers scroll reset on route change
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [splat]);

  // Section navigation handled by OS effect (scrollSection in app.ts)
  // Space/Shift+Space → DOCS_NEXT/PREV_SECTION → kernel dispatches scrollSection effect

  const handleSelect = (path: string) => {
    navigate({ to: `/docs/${path}` });
  };

  return (
    <div className="flex h-full w-full bg-white text-slate-900 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <DocsSidebar items={docTree} activePath={splat} onSelect={handleSelect} />

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col bg-white overflow-hidden">
        <DocsReaderUI.Zone
          data-docs-scroll
          className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pt-6"
        >
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
                  onClick={() => navigate({ to: "/docs" })}
                  className="mt-8 px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <article className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
                {/* Dashboard or Doc Content */}
                {!splat ? (
                  <DocsDashboard allFiles={allFiles} onSelect={handleSelect} />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-10 border-b border-slate-50 pb-6">
                      {splat?.split("/").map((part, i, arr) => (
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
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="mt-20 pt-8 border-t border-slate-100 flex items-center justify-between gap-4 max-w-3xl">
                  {prevFile ? (
                    <Link
                      to={`/docs/${prevFile.path}` as string}
                      data-docs-nav-prev
                      className="group flex flex-col items-start gap-1"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        <ChevronLeft size={12} strokeWidth={3} />
                        Previous
                      </span>
                      <span className="text-base font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {cleanLabel(prevFile.name)}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextFile ? (
                    <Link
                      to={`/docs/${nextFile.path}` as string}
                      data-docs-nav-next
                      className="group flex flex-col items-end gap-1 text-right"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        Next
                        <ChevronRight size={12} strokeWidth={3} />
                      </span>
                      <span className="text-base font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {cleanLabel(nextFile.name)}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Footer Spacer */}
                <div className="h-40" />
              </article>
            )}
          </div>
        </DocsReaderUI.Zone>
      </div>
    </div>
  );
}
