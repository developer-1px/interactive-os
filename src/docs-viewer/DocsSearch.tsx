/**
 * DocsSearch — docs-viewer internal search overlay.
 *
 * Triggered by `/` key (OS keybinding → OPEN_SEARCH).
 * Controlled by DocsApp.searchOpen state.
 * Fuzzy matches file names from allFiles.
 */
import { os } from "@os-core/engine/kernel";
import clsx from "clsx";
import { FileText, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { closeSearch, DocsApp, selectDoc } from "./app";
import { cleanLabel, type DocItem } from "./docsUtils";

/** Simple fuzzy match: all query chars appear in order */
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function DocsSearch({ allFiles }: { allFiles: DocItem[] }) {
  const searchOpen = DocsApp.useComputed((s) => s.searchOpen);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter files by fuzzy match on clean label + path
  const results = useMemo(() => {
    if (!query.trim()) return allFiles.slice(0, 20);
    return allFiles.filter(
      (f) => fuzzyMatch(query, cleanLabel(f.name)) || fuzzyMatch(query, f.path),
    );
  }, [query, allFiles]);

  // Reset state when opening
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Focus input after overlay renders
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [searchOpen]);

  // Clamp selectedIndex when results change
  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, results.length - 1)));
  }, [results.length]);

  const handleSelect = useCallback((path: string) => {
    os.dispatch(selectDoc({ id: path }));
    os.dispatch(closeSearch());
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        os.dispatch(closeSearch());
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) handleSelect(selected.path);
      }
    },
    [results, selectedIndex, handleSelect],
  );

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) os.dispatch(closeSearch());
      }}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search docs..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No results
            </div>
          ) : (
            results.map((file, i) => (
              <button
                key={file.path}
                type="button"
                onClick={() => handleSelect(file.path)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                  i === selectedIndex
                    ? "bg-indigo-50 text-indigo-900"
                    : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <FileText
                  size={14}
                  className={clsx(
                    "shrink-0",
                    i === selectedIndex ? "text-indigo-400" : "text-slate-300",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {cleanLabel(file.name)}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {file.path}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
          <span>
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">
              ↑↓
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">↵</kbd>{" "}
            open
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px]">
              esc
            </kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}
