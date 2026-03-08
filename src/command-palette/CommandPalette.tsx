/**
 * CommandPalette — ⌘K / Shift+Shift Quick Navigation
 *
 * Spotlight-style command palette built on the OS QuickPick primitive.
 * This is an **App-level** component: it provides data sources (routes, docs)
 * and custom rendering, while QuickPick handles all behavior.
 *
 * Architecture:
 *   CommandPalette (App) → QuickPick (OS) → Dialog + Zone + Item (Primitives)
 */

import { Kbd } from "@inspector/shell/components/Kbd";
import { closeOverlay } from "@os-react/6-project/accessors/useOverlay";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { type FuzzyMatchResult, fuzzyMatch } from "./fuzzyMatch";
import {
  QuickPick,
  type QuickPickItem,
  type QuickPickRenderState,
} from "./QuickPick";
import { useDocsList } from "./useDocsList";
import { useRouteList } from "./useRouteList";

// ═══════════════════════════════════════════════════════════════════
// Palette Item — extends QuickPickItem with match data
// ═══════════════════════════════════════════════════════════════════

interface PaletteItem extends QuickPickItem {
  path: string;
  kind: "route" | "doc";
  pathMatch: FuzzyMatchResult;
  labelMatch: FuzzyMatchResult;
}

const EMPTY_MATCH: FuzzyMatchResult = { score: 0, matchedIndices: [] };

// ═══════════════════════════════════════════════════════════════════
// Fuzzy Filter — plugs into QuickPick's filterFn
// ═══════════════════════════════════════════════════════════════════

function fuzzyFilter(items: PaletteItem[], query: string): PaletteItem[] {
  if (!query.trim()) {
    // Reset match data when no query
    return items.map((item) => ({
      ...item,
      pathMatch: EMPTY_MATCH,
      labelMatch: EMPTY_MATCH,
    }));
  }

  return items
    .map((item) => {
      const pathMatch = fuzzyMatch(query, item.path);
      const labelMatch = fuzzyMatch(query, item.label);
      if (!pathMatch && !labelMatch) return null;
      return {
        ...item,
        pathMatch: pathMatch ?? EMPTY_MATCH,
        labelMatch: labelMatch ?? EMPTY_MATCH,
      };
    })
    .filter((r): r is PaletteItem => r !== null)
    .sort((a, b) => {
      const aScore = Math.max(a.pathMatch.score, a.labelMatch.score);
      const bScore = Math.max(b.pathMatch.score, b.labelMatch.score);
      return bScore - aScore;
    });
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function CommandPalette() {
  const navigate = useNavigate();
  const routes = useRouteList();
  const docs = useDocsList();

  // ── Build items ──
  const items = useMemo<PaletteItem[]>(() => {
    const routeItems: PaletteItem[] = routes.map((r) => ({
      id: `route:${r.path}`,
      label: r.label,
      path: r.path,
      kind: "route" as const,
      pathMatch: EMPTY_MATCH,
      labelMatch: EMPTY_MATCH,
    }));

    const docItems: PaletteItem[] = docs.map((d) => ({
      id: `doc:${d.path}`,
      label: d.label,
      path: d.path,
      kind: "doc" as const,
      category: d.category,
      icon: "📄",
      pathMatch: EMPTY_MATCH,
      labelMatch: EMPTY_MATCH,
    }));

    return [...routeItems, ...docItems];
  }, [routes, docs]);

  // ── Actions ──
  const handleSelect = useCallback(
    (item: PaletteItem) => {
      navigate({ to: item.path });
    },
    [navigate],
  );

  const handleClose = useCallback(() => {
    closeOverlay("command-palette");
  }, []);

  // ── Typeahead resolver (uses fuzzy-matched label) ──
  const typeaheadResolver = useCallback(
    (filtered: PaletteItem[], query: string): string => {
      if (!query || filtered.length === 0) return "";
      const top = filtered[0];
      if (!top) return "";
      if (top.label.toLowerCase().startsWith(query.toLowerCase())) {
        return top.label.slice(query.length);
      }
      return "";
    },
    [],
  );

  // ── Custom item renderer ──
  const renderItem = useCallback(
    (item: PaletteItem, state: QuickPickRenderState) => (
      <PaletteRow item={item} isFocused={state.isFocused} />
    ),
    [],
  );

  // ── Custom footer ──
  const renderFooter = useCallback(
    () => (
      <div className="flex items-center gap-4 px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-500 select-none">
        <span className="flex items-center gap-1.5">
          <Kbd
            keys={["Up"]}
            className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
          />
          <Kbd
            keys={["Down"]}
            className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
          />
          navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd
            keys={["Tab"]}
            className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
          />
          complete
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd
            keys={["Enter"]}
            className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
          />
          go
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd
            keys={["Esc"]}
            className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
          />
          close
        </span>
      </div>
    ),
    [],
  );

  return (
    <QuickPick<PaletteItem>
      id="command-palette"
      items={items}
      filterFn={fuzzyFilter}
      renderItem={renderItem}
      renderFooter={renderFooter}
      typeahead={typeaheadResolver}
      onSelect={handleSelect}
      onClose={handleClose}
      placeholder="Search routes and docs..."
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// Palette Row — custom rendering with fuzzy match highlights
// ═══════════════════════════════════════════════════════════════════

function PaletteRow({
  item,
  isFocused,
}: {
  item: PaletteItem;
  isFocused: boolean;
}) {
  return (
    <div
      role="option"
      tabIndex={-1}
      aria-selected={isFocused}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer mb-[1px]
        ${isFocused ? "bg-zinc-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"}
      `}
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
          text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[40%] text-right
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
          w-[36px] flex justify-end
          ${isFocused ? "opacity-100" : "opacity-0"}
        `}
      >
        <Kbd
          keys={["Enter"]}
          className="shrink-0 text-[10px] text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono shadow-sm"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Highlighted Text — renders fuzzy match indices as <mark>
// ═══════════════════════════════════════════════════════════════════

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
