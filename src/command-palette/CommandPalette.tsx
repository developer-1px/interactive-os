/**
 * CommandPalette — ⌘K / Shift+Shift Quick Navigation
 *
 * Spotlight-style command palette (Light Premium Minimal Pro)
 * Built on OS components, styled with Tailwind CSS.
 * Searches both routes and docs files.
 */

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OVERLAY_CLOSE } from "@/os/3-commands";
import { OS } from "@/os/AntigravityOS";
import { kernel } from "@/os/kernel";
import { type FuzzyMatchResult, fuzzyMatch } from "./fuzzyMatch";
import { useDocsList } from "./useDocsList";
import { useRouteList } from "./useRouteList";

interface MatchedItem {
  id: string;
  path: string;
  label: string;
  kind: "route" | "doc";
  category?: string;
  pathMatch: FuzzyMatchResult;
  labelMatch: FuzzyMatchResult;
}

export function CommandPalette() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const routes = useRouteList();
  const docs = useDocsList();

  // ── Overlay State (kernel) ──
  const isOpen = kernel.useComputed((s) =>
    s.os.overlays.stack.some((e) => e.id === "command-palette"),
  );

  // ── Filtered Items (Routes + Docs) ──
  const { matchedRoutes, matchedDocs } = useMemo(() => {
    const empty: FuzzyMatchResult = { score: 0, matchedIndices: [] };

    const matchItems = (
      items: { path: string; label: string; category?: string }[],
      kind: "route" | "doc",
    ): MatchedItem[] => {
      if (!query.trim()) {
        return items.map(
          (item) =>
            ({
              id: `${kind}:${item.path}`,
              path: item.path,
              label: item.label,
              kind,
              ...(item.category != null ? { category: item.category } : {}),
              pathMatch: empty,
              labelMatch: empty,
            }) as MatchedItem,
        );
      }
      return items
        .map((item) => {
          const pathMatch = fuzzyMatch(query, item.path);
          const labelMatch = fuzzyMatch(query, item.label);
          if (!pathMatch && !labelMatch) return null;
          return {
            id: `${kind}:${item.path}`,
            path: item.path,
            label: item.label,
            kind,
            category: item.category,
            pathMatch: pathMatch ?? empty,
            labelMatch: labelMatch ?? empty,
          } as MatchedItem;
        })
        .filter((r): r is MatchedItem => r !== null)
        .sort((a, b) => {
          const aScore = Math.max(a.pathMatch.score, a.labelMatch.score);
          const bScore = Math.max(b.pathMatch.score, b.labelMatch.score);
          return bScore - aScore;
        });
    };

    return {
      matchedRoutes: matchItems(routes, "route"),
      matchedDocs: matchItems(docs, "doc"),
    };
  }, [query, routes, docs]);

  const allItems = useMemo(
    () => [...matchedRoutes, ...matchedDocs],
    [matchedRoutes, matchedDocs],
  );

  // ── Typeahead Logic ──
  const completion = useMemo(() => {
    if (!query || allItems.length === 0) return "";
    const topMatch = allItems[0];
    if (!topMatch) return "";
    const label = topMatch.label;
    if (label.toLowerCase().startsWith(query.toLowerCase())) {
      // Return the suffix with the original casing from the label
      return label.slice(query.length);
    }
    return "";
  }, [query, allItems]);

  // ── Auto-focus input on open ──
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // ── Combobox focus trap: keep focus on input ──
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent clicks within the palette from stealing focus from the input
    if (e.target !== inputRef.current) {
      e.preventDefault();
    }
  }, []);

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // If focus moves within the palette container, reclaim it
      if (
        containerRef.current &&
        e.relatedTarget instanceof Node &&
        containerRef.current.contains(e.relatedTarget)
      ) {
        inputRef.current?.focus();
      }
    },
    [],
  );

  // ── Navigate to selected item ──
  const handleAction = useCallback(() => {
    const state = kernel.getState();
    const zoneId = "command-palette-list";
    const zone = state.os.focus.zones[zoneId];
    const focusedId = zone?.focusedItemId;

    if (focusedId) {
      const item = allItems.find((r) => r.id === focusedId);
      if (item) {
        kernel.dispatch(OVERLAY_CLOSE({ id: "command-palette" }));
        // biome-ignore lint/suspicious/noExplicitAny: TanStack Router path type
        navigate({ to: item.path as any });
      }
    }
  }, [allItems, navigate]);

  // ── Handle input keydown ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab" || (e.key === "ArrowRight" && completion)) {
        e.preventDefault();
        if (completion) {
          setQuery((q) => q + completion);
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // Prevent cursor movement in input, let Zone handle navigation
        e.preventDefault();
        // Dispatch to the zone's keyboard handler
        const zoneEl = document.querySelector(
          '[data-zone-id="command-palette-list"]',
        );
        if (zoneEl) {
          zoneEl.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: e.key,
              bubbles: true,
              cancelable: true,
            }),
          );
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleAction();
      }
    },
    [completion, handleAction],
  );

  if (!isOpen) return null;

  return (
    <OS.Dialog id="command-palette">
      <OS.Dialog.Content
        title=""
        className="fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 bg-black/20 z-50 p-0 flex items-center justify-center"
        contentClassName="w-[640px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-black/5 flex flex-col overflow-hidden text-zinc-900"
      >
        {/* Focus trap wrapper — prevents clicks from stealing input focus */}
        <div
          ref={containerRef}
          onMouseDown={handleContainerMouseDown}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
            <svg
              className="w-[18px] h-[18px] text-zinc-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <title>Search</title>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent border-none outline-none text-[16px] leading-6 font-normal text-zinc-900 placeholder:text-zinc-400 caret-blue-600 relative z-10"
                placeholder="Search routes and docs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleInputBlur}
                autoComplete="off"
                spellCheck={false}
              />
              {completion && (
                <div className="absolute inset-0 pointer-events-none flex items-center overflow-hidden whitespace-pre text-[16px] leading-6 font-normal">
                  <span className="opacity-0">{query}</span>
                  <span className="text-zinc-400 opacity-60">{completion}</span>
                </div>
              )}
            </div>
            <OS.Kbd
              shortcut="Esc"
              className="shrink-0 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-mono shadow-sm"
            />
          </div>

          {/* Item List */}
          <OS.Zone
            id="command-palette-list"
            role="listbox"
            // biome-ignore lint/suspicious/noExplicitAny: Zone onAction
            onAction={{ type: "COMMAND_PALETTE_ACTION" } as any}
            options={PALETTE_ZONE_OPTIONS}
            className="max-h-[380px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar"
          >
            {allItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No matching results
              </div>
            ) : (
              <>
                {matchedRoutes.length > 0 && (
                  <>
                    {query.trim() && matchedDocs.length > 0 && (
                      <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Routes
                      </div>
                    )}
                    {matchedRoutes.map((item) => (
                      <PaletteItem
                        key={item.id}
                        item={item}
                        navigate={navigate}
                      />
                    ))}
                  </>
                )}
                {matchedDocs.length > 0 && (
                  <>
                    {query.trim() && matchedRoutes.length > 0 && (
                      <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        Docs
                      </div>
                    )}
                    {matchedDocs.slice(0, query.trim() ? 10 : 5).map((item) => (
                      <PaletteItem
                        key={item.id}
                        item={item}
                        navigate={navigate}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </OS.Zone>

          {/* Footer Hints */}
          <div className="flex items-center gap-4 px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-500 select-none">
            <span className="flex items-center gap-1.5">
              <OS.Kbd
                shortcut="Up"
                className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
              />
              <OS.Kbd
                shortcut="Down"
                className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
              />
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <OS.Kbd
                shortcut="Tab"
                className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
              />
              complete
            </span>
            <span className="flex items-center gap-1.5">
              <OS.Kbd
                shortcut="Enter"
                className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
              />
              go
            </span>
            <span className="flex items-center gap-1.5">
              <OS.Kbd
                shortcut="Esc"
                className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
              />
              close
            </span>
          </div>
        </div>
      </OS.Dialog.Content>
    </OS.Dialog>
  );
}

// ── Palette Item ──
function PaletteItem({
  item,
  navigate,
}: {
  item: MatchedItem;
  // biome-ignore lint/suspicious/noExplicitAny: TanStack Router navigate type
  navigate: (opts: { to: any }) => void;
}) {
  return (
    <OS.Item key={item.id} id={item.id}>
      {({ isFocused }) => (
        <div
          role="option"
          tabIndex={-1}
          aria-selected={isFocused}
          className={`
            flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-100 mb-[1px]
            ${isFocused ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"}
          `}
          onClick={() => {
            kernel.dispatch(OVERLAY_CLOSE({ id: "command-palette" }));
            navigate({ to: item.path });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              kernel.dispatch(OVERLAY_CLOSE({ id: "command-palette" }));
              navigate({ to: item.path });
            }
          }}
        >
          {item.kind === "doc" && (
            <span className="text-[10px] text-zinc-400 font-mono">📄</span>
          )}
          <span className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            <HighlightedText
              text={item.label}
              indices={item.labelMatch.matchedIndices}
            />
          </span>
          <span
            className={`
            text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[40%] text-right transition-colors
            ${isFocused ? "text-zinc-500" : "text-zinc-400"}
          `}
          >
            <HighlightedText
              text={item.path}
              indices={item.pathMatch.matchedIndices}
            />
          </span>
          <div
            className={`
            w-[36px] flex justify-end transition-opacity duration-100
            ${isFocused ? "opacity-100" : "opacity-0"}
          `}
          >
            <OS.Kbd
              shortcut="Enter"
              className="shrink-0 text-[10px] text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono shadow-sm"
            />
          </div>
        </div>
      )}
    </OS.Item>
  );
}

// ── Highlighted Text ──
function HighlightedText({
  text,
  indices,
}: {
  text: string;
  indices: number[];
}) {
  if (indices.length === 0) return <>{text}</>;

  const indexSet = new Set(indices);
  const parts: React.ReactNode[] = [];
  let current = "";
  let inMatch = false;

  for (let i = 0; i < text.length; i++) {
    const isMatch = indexSet.has(i);
    if (isMatch !== inMatch) {
      if (current) {
        parts.push(
          inMatch ? (
            <mark
              key={`m-${i}`}
              className="text-blue-600 bg-transparent font-semibold p-0"
            >
              {current}
            </mark>
          ) : (
            <span key={`s-${i}`}>{current}</span>
          ),
        );
      }
      current = "";
      inMatch = isMatch;
    }
    current += text[i];
  }
  if (current) {
    parts.push(
      inMatch ? (
        <mark
          key={`m-${text.length}`}
          className="text-blue-600 bg-transparent font-semibold p-0"
        >
          {current}
        </mark>
      ) : (
        <span key={`s-${text.length}`}>{current}</span>
      ),
    );
  }

  return <>{parts}</>;
}

const PALETTE_ZONE_OPTIONS = { project: { autoFocus: true } };
