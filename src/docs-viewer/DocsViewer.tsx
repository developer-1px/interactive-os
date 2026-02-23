import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import docsMeta from "virtual:docs-meta";
import { DocsSidebar } from "./DocsSidebar";
import { os } from "@/os/kernel";

// Side-effect: register docs-viewer commands on kernel
import "./app";
import {
  buildDocTree,
  cleanLabel,
  docsModules,
  flattenTree,
  formatRelativeTime,
  isFavorite,
  loadDocContent,
  toggleFavorite,
} from "./docsUtils";
import { type ExternalFolderSource, openExternalFolder } from "./fsAccessUtils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableOfContents } from "./TableOfContents";

/** Parse hash: returns { source: "docs" | "ext", path?, folderName? } */
function parseHash(): {
  source: "docs" | "ext";
  path?: string;
  folderName?: string;
} {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return { source: "docs" };

  if (hash.startsWith("ext:")) {
    const rest = hash.slice(4);
    const slashIdx = rest.indexOf("/");
    if (slashIdx === -1) {
      return { source: "ext", folderName: rest };
    }
    return {
      source: "ext",
      folderName: rest.slice(0, slashIdx),
      path: rest.slice(slashIdx + 1),
    };
  }

  return { source: "docs", path: hash };
}

export function DocsViewer() {
  const [activePath, setActivePath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [externalSource, setExternalSource] =
    useState<ExternalFolderSource | null>(null);
  const [favVersion, setFavVersion] = useState(0);

  // Use ref so event handlers always see the latest external source
  const contentRef = useRef<HTMLDivElement>(null);
  const externalRef = useRef(externalSource);
  externalRef.current = externalSource;

  // --- Section navigation via OS commands (DOCS_NEXT_SECTION / DOCS_PREV_SECTION) ---
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const scrollToHeading = (direction: "next" | "prev") => {
      const headings = Array.from(
        container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
      );
      if (headings.length === 0) return;

      const scrollTop = container.scrollTop;
      const offset = 20;

      if (direction === "prev") {
        for (let i = headings.length - 1; i >= 0; i--) {
          if (headings[i].offsetTop < scrollTop - offset) {
            headings[i].scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
        }
      } else {
        for (const heading of headings) {
          if (heading.offsetTop > scrollTop + offset) {
            heading.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
        }
      }
    };

    // Subscribe to kernel — observe DOCS_NEXT/PREV_SECTION commands
    return os.subscribe(() => {
      const tx = os.inspector.getLastTransaction();
      if (!tx) return;
      if (tx.command.type === "DOCS_NEXT_SECTION") scrollToHeading("next");
      if (tx.command.type === "DOCS_PREV_SECTION") scrollToHeading("prev");
    });
  }, [content]); // re-attach when content changes

  const isExternal = externalSource != null;

  // Built-in docs tree (always available)
  const builtinTree = useMemo(() => buildDocTree(Object.keys(docsModules)), []);
  const builtinFiles = useMemo(() => flattenTree(builtinTree), [builtinTree]);

  // Current tree depends on mode
  const docTree = isExternal ? externalSource.tree : builtinTree;
  const allFiles = isExternal ? externalSource.allFiles : builtinFiles;

  const currentIndex = allFiles.findIndex((f) => f.path === activePath);
  const prevFile = currentIndex > 0 ? allFiles[currentIndex - 1] : null;
  const nextFile =
    currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null;

  // --- Core: load content for a path ---
  const loadContent = useCallback(
    (path: string, source: ExternalFolderSource | null) => {
      if (source) {
        // External: synchronous lookup from in-memory map
        const fileContent = source.files.get(path);
        if (fileContent != null) {
          setContent(fileContent);
          setError(null);
        } else {
          setContent("");
          setError("Document not found in external folder");
        }
      } else {
        // Built-in: async glob loader
        loadDocContent(path)
          .then((raw) => {
            setContent(raw);
            setError(null);
          })
          .catch((err) => {
            console.error(err);
            setError(err.message ?? "Failed to load document");
            setContent("");
          });
      }
    },
    [],
  );

  // --- Update URL without triggering hashchange ---
  const setHash = useCallback((hash: string) => {
    history.replaceState(null, "", hash);
  }, []);

  // --- Select a file (sidebar click, prev/next) ---
  const handleSelect = useCallback(
    (path: string) => {
      const ext = externalRef.current;
      if (ext) {
        setHash(`#ext:${ext.name}/${path}`);
      } else {
        setHash(`#/${path}`);
      }
      setActivePath(path);
      loadContent(path, ext);
      // Scroll content area to top on document switch
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    },
    [loadContent, setHash],
  );

  // Initialize from hash on mount
  useEffect(() => {
    const parsed = parseHash();
    if (parsed.source === "docs" && parsed.path) {
      setActivePath(parsed.path);
      loadContent(parsed.path, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadContent]);

  // Sync hash → state on browser back/forward (popstate only)
  useEffect(() => {
    const onPopState = () => {
      const parsed = parseHash();
      const ext = externalRef.current;
      if (parsed.source === "docs") {
        if (ext) setExternalSource(null);
        setActivePath(parsed.path);
        if (parsed.path) loadContent(parsed.path, null);
      } else if (parsed.source === "ext" && ext) {
        setActivePath(parsed.path);
        if (parsed.path) loadContent(parsed.path, ext);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadContent]);

  // Auto-select first file when tree changes and no active path
  useEffect(() => {
    if (!activePath && allFiles.length > 0) {
      const first = allFiles[0];
      if (first) {
        handleSelect(first.path);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFiles, activePath, handleSelect]);

  // --- Folder open / close ---
  const handleOpenFolder = async () => {
    const result = await openExternalFolder();
    if (!result) return;

    setExternalSource(result);
    externalRef.current = result;
    setActivePath(undefined);
    setContent("");
    setError(null);
    // Auto-select will fire via the allFiles effect
  };

  const handleCloseFolder = () => {
    setExternalSource(null);
    externalRef.current = null;
    setActivePath(undefined);
    setContent("");
    setError(null);
    setHash("#");
  };

  // Sidebar header with source indicator
  const sidebarHeader = (
    <div className="px-5 py-5 flex items-center gap-2 mb-2">
      <div className="p-1 bg-white border border-slate-200 rounded-md shadow-sm">
        {isExternal ? (
          <FolderOpen size={14} className="text-indigo-600" />
        ) : (
          <FileText size={14} className="text-slate-700" />
        )}
      </div>
      <span className="font-semibold text-slate-700 text-sm tracking-tight flex-1 truncate">
        {isExternal ? externalSource.name : "Handbook"}
      </span>
      {isExternal ? (
        <button
          type="button"
          onClick={handleCloseFolder}
          title="Close external folder"
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenFolder}
          title="Open folder"
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <FolderOpen size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <DocsSidebar
        key={favVersion}
        items={docTree}
        allFiles={allFiles}
        activePath={activePath}
        onSelect={handleSelect}
        header={sidebarHeader}
      />

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col bg-white overflow-hidden">
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto relative z-10 custom-scrollbar"
        >
          <div className="px-12 pt-5 pb-12 lg:px-16 w-full max-w-5xl mx-auto">
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
                    if (allFiles[0]) handleSelect(allFiles[0].path);
                  }}
                  className="mt-8 px-6 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <>
                <article className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
                  {/* Document Metadata Header */}
                  <div className="flex items-center gap-2 mb-10 border-b border-slate-50 pb-6">
                    {isExternal && (
                      <>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {externalSource.name}
                        </span>
                        <span className="text-slate-300">/</span>
                      </>
                    )}
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

                    {/* Modification date + Pin */}
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                      {activePath && (
                        <button
                          type="button"
                          onClick={() => {
                            toggleFavorite(activePath);
                            setFavVersion((v) => v + 1);
                          }}
                          className={clsx(
                            "p-1 rounded-md transition-colors",
                            isFavorite(activePath)
                              ? "text-amber-400 hover:text-amber-500"
                              : "text-slate-300 hover:text-slate-400",
                          )}
                          title={isFavorite(activePath) ? "Unpin" : "Pin to sidebar"}
                        >
                          <Star
                            size={13}
                            className={isFavorite(activePath) ? "fill-amber-400" : ""}
                          />
                        </button>
                      )}
                      {activePath && docsMeta[activePath] && (
                        <span
                          className="flex items-center gap-1 text-xs text-slate-400 tabular-nums"
                          title={new Date(docsMeta[activePath].mtime).toLocaleString()}
                        >
                          <Clock size={11} className="text-slate-300" />
                          {formatRelativeTime(docsMeta[activePath].mtime)}
                        </span>
                      )}
                    </div>
                  </div>

                  <MarkdownRenderer content={content} />

                  {/* Navigation Buttons */}
                  <div className="mt-20 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4 max-w-3xl">
                    {prevFile ? (
                      <button
                        type="button"
                        onClick={() => handleSelect(prevFile.path)}
                        className="group flex flex-col items-start gap-1.5 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                      >
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                          <ChevronLeft size={12} strokeWidth={3} />
                          Previous
                        </span>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate w-full text-left">
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
                        className="group flex flex-col items-end gap-1.5 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                      >
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                          Next
                          <ChevronRight size={12} strokeWidth={3} />
                        </span>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate w-full text-right">
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
                <TableOfContents content={content} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
