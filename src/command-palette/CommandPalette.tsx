/**
 * CommandPalette — ⌘K Quick Navigation
 *
 * Spotlight-style command palette (Light Premium Minimal Pro)
 * Built on OS components, styled with Tailwind CSS.
 */

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OVERLAY_CLOSE } from "@/os/3-commands";
import { OS } from "@/os/AntigravityOS";
import { kernel } from "@/os/kernel";
import { type FuzzyMatchResult, fuzzyMatch } from "./fuzzyMatch";
import { type RouteEntry, useRouteList } from "./useRouteList";

interface MatchedRoute extends RouteEntry {
  pathMatch: FuzzyMatchResult;
  labelMatch: FuzzyMatchResult;
}

export function CommandPalette() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const routes = useRouteList();

  // ── Overlay State (kernel) ──
  const isOpen = kernel.useComputed((s) =>
    s.os.overlays.stack.some((e) => e.id === "command-palette"),
  );

  // ── Filtered Routes ──
  const filteredRoutes = useMemo<MatchedRoute[]>(() => {
    const empty: FuzzyMatchResult = { score: 0, matchedIndices: [] };
    if (!query.trim()) {
      return routes.map((r) => ({
        ...r,
        pathMatch: empty,
        labelMatch: empty,
      }));
    }
    return routes
      .map((r) => {
        const pathMatch = fuzzyMatch(query, r.path);
        const labelMatch = fuzzyMatch(query, r.label);
        if (!pathMatch && !labelMatch) return null;
        return {
          ...r,
          pathMatch: pathMatch ?? empty,
          labelMatch: labelMatch ?? empty,
        };
      })
      .filter((r): r is MatchedRoute => r !== null)
      .sort((a, b) => {
        const aScore = Math.max(a.pathMatch.score, a.labelMatch.score);
        const bScore = Math.max(b.pathMatch.score, b.labelMatch.score);
        return bScore - aScore;
      });
  }, [query, routes]);

  // ── Auto-focus input on open ──
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // ── Navigate to route ──
  const handleAction = useCallback(() => {
    // Get focused item from kernel
    const state = kernel.getState();
    const zoneId = "command-palette-list";
    const zone = state.os.focus.zones[zoneId];
    const focusedId = zone?.focusedItemId;

    if (focusedId) {
      const route = filteredRoutes.find((r) => r.path === focusedId);
      if (route) {
        kernel.dispatch(OVERLAY_CLOSE({ id: "command-palette" }));
        // biome-ignore lint/suspicious/noExplicitAny: TanStack Router path type
        navigate({ to: route.path as any });
      }
    }
  }, [filteredRoutes, navigate]);

  // ── Handle input keydown ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
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
    [handleAction],
  );

  if (!isOpen) return null;

  return (
    <OS.Dialog id="command-palette">
      <OS.Dialog.Content
        title=""
        className="fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 bg-black/20 z-50 p-0 flex items-center justify-center"
        contentClassName="w-[640px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-black/5 flex flex-col overflow-hidden text-zinc-900"
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
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-[16px] leading-6 font-normal text-zinc-900 placeholder:text-zinc-400 caret-blue-600"
            placeholder="Type a route to navigate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <OS.Kbd
            shortcut="Esc"
            className="shrink-0 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-mono shadow-sm"
          />
        </div>

        {/* Route List */}
        <OS.Zone
          id="command-palette-list"
          role="listbox"
          // biome-ignore lint/suspicious/noExplicitAny: Zone onAction
          onAction={{ type: "COMMAND_PALETTE_ACTION" } as any}
          options={{ project: { autoFocus: true } }}
          className="max-h-[380px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar"
        >
          {filteredRoutes.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No matching routes
            </div>
          ) : (
            filteredRoutes.map((route) => (
              <OS.Item key={route.path} id={route.path}>
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
                      // biome-ignore lint/suspicious/noExplicitAny: TanStack Router path type
                      navigate({ to: route.path as any });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        kernel.dispatch(
                          OVERLAY_CLOSE({ id: "command-palette" }),
                        );
                        // biome-ignore lint/suspicious/noExplicitAny: TanStack Router path type
                        navigate({ to: route.path as any });
                      }
                    }}
                  >
                    <span className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      <HighlightedText
                        text={route.label}
                        indices={route.labelMatch.matchedIndices}
                      />
                    </span>
                    <span
                      className={`
                      text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[40%] text-right transition-colors
                      ${isFocused ? "text-zinc-500" : "text-zinc-400"}
                    `}
                    >
                      <HighlightedText
                        text={route.path}
                        indices={route.pathMatch.matchedIndices}
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
            ))
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
      </OS.Dialog.Content>
    </OS.Dialog>
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
