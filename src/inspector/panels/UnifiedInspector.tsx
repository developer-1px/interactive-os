/**
 * UnifiedInspector — Unified Sections (Refined v10)
 *
 * Modified to include standard state management inspector features:
 * - Search & Filtering
 * - Time Delta (∆ms)
 * - Session Export (JSON Download)
 * - Expand/Collapse All
 */

import type { Transaction } from "@kernel/core/transaction";
import { os } from "@os-sdk/os";
import {
  ChevronDown,
  ClipboardCopy,
  Layers,
  ListMinus,
  ListTree,
  Package,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearSearchQuery,
  InspectorApp,
  InspectorFiltersUI,
  InspectorScrollUI,
  InspectorSearchUI,
  type InspectorState,
  safeDisabledGroups,
  selectFilteredTransactions,
  setScrollState,
  toggleGroup,
} from "../app";
import { InspectorScroll } from "../app";
import { inferSignal } from "../utils/inferSignal";
import { copyAllToClipboard } from "../utils/inspectorFormatters";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { TransactionList } from "./components/TransactionList";

function highlightElement(id: string, active: boolean) {
  const el = document.getElementById(id);
  if (!el) return;

  if (active) {
    el.style.outline = "2px solid #f06595";
    el.style.outlineOffset = "2px";
    el.dataset["inspectorHighlight"] = "true";
  } else {
    el.style.outline = "";
    el.style.outlineOffset = "";
    delete el.dataset["inspectorHighlight"];
  }
}

// ─── Component ───

export function UnifiedInspector({
  transactions,
  storeState,
  onClear,
}: {
  transactions: Transaction[];
  storeState?: Record<string, unknown>;
  onClear?: () => void;
}) {
  const disabledGroups = InspectorApp.useComputed(safeDisabledGroups);
  const searchQuery = InspectorApp.useComputed(
    (s: InspectorState) => s.searchQuery,
  );
  const isUserScrolled = InspectorApp.useComputed(
    (s: InspectorState) => s.isUserScrolled,
  );
  const scrollTick = InspectorApp.useComputed(
    (s: InspectorState) => s.scrollTick,
  );
  const filteredTx = InspectorApp.useComputed((s) =>
    selectFilteredTransactions(s, transactions),
  );
  const [traceOpen, setTraceOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(false);
  const [manualToggles, setManualToggles] = useState<Set<string>>(new Set());

  // Discover all groups from the actual transactions (kernel is source of truth)
  const allGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const tx of transactions) {
      groups.add(inferSignal(tx).group);
    }
    return Array.from(groups).sort();
  }, [transactions]);

  const handleToggleGroup = (group: string) => {
    os.dispatch(toggleGroup({ group }));
  };

  // --- End of Component State ---

  const latestTxId =
    filteredTx.length > 0
      ? String(filteredTx[filteredTx.length - 1]!.id)
      : undefined;
  const expandedIds = new Set(manualToggles);

  // Auto-expand latest only if user hasn't manually collapsed it & no active search
  if (
    latestTxId !== undefined &&
    !manualToggles.has(latestTxId) &&
    !searchQuery
  ) {
    expandedIds.add(latestTxId);
  }

  // ── Discord/Slack-style auto-scroll ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLatestId = useRef<string | undefined>(undefined);
  const prevScrollTick = useRef(0);
  const isProgrammaticScroll = useRef(false);

  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    const lastNode = el.querySelector(`[data-tx-index]:last-of-type`);
    if (lastNode) {
      lastNode.scrollIntoView({ block: "start", behavior: "auto" });
    } else {
      el.scrollTop = el.scrollHeight;
    }

    // ZIFT Handler triggers DOM manipulation directly when observed state (scrollTick) changes.
    // The state `isUserScrolled` is updated in the app using the scroll command.
    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false;
    });
  }, []);

  const handleScroll = useCallback(() => {
    // Ignore scroll events caused by our own programmatic scrolling
    if (isProgrammaticScroll.current) return;
    const UserScrolled = !isAtBottom();
    if (isUserScrolled !== UserScrolled) {
      os.dispatch(setScrollState({ isUserScrolled: !!UserScrolled }));
    }
  }, [isAtBottom, isUserScrolled]);

  // React to OS_SCROLL commands via scrollTick change
  useEffect(() => {
    if (scrollTick > prevScrollTick.current) {
      prevScrollTick.current = scrollTick;
      // Double rAF: first waits for React commit, second waits for layout
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      });
    }
  }, [scrollTick, scrollToBottom]);

  // Auto-scroll logic: scroll directly when new transaction arrives.
  // NOTE: Must NOT dispatch a command here — dispatching creates a new kernel
  // transaction, which changes latestTxId, re-triggering this effect → ∞ loop.
  useEffect(() => {
    if (latestTxId === undefined || latestTxId === prevLatestId.current) return;
    prevLatestId.current = latestTxId;

    if (!isUserScrolled && !searchQuery) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      });
    }
  }, [latestTxId, isUserScrolled, searchQuery, scrollToBottom]);

  const expandAll = () => {
    const all = new Set(filteredTx.map((t) => String(t.id)));
    setManualToggles(all);
  };

  const collapseAll = () => {
    // If we collapse all, we also add the very latest to manualToggles so it doesn't auto-expand
    const next = new Set<string>();
    if (latestTxId !== undefined) next.add(latestTxId);
    setManualToggles(next);
  };

  const handleHighlight = (id: string, active: boolean) => {
    highlightElement(id, active);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white text-[#333] font-sans text-[10px]">
      <div className="flex flex-col border-b border-[#e0e0e0] bg-white z-20 shrink-0 sticky top-0">
        {/* Top Header Row */}
        <div className="h-7 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-[#007acc]" />
            <span className="font-bold text-[#555] text-[10px]">Inspector</span>
            <span className="text-[#999] text-[9px] font-mono">
              {filteredTx.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => copyAllToClipboard(transactions)}
              className="p-1 rounded text-[#94a3b8] hover:text-[#333] hover:bg-[#f5f5f5] cursor-pointer"
              title="Copy All to Clipboard"
            >
              <ClipboardCopy size={11} />
            </button>

            {onClear && transactions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setManualToggles(new Set());
                  os.dispatch(clearSearchQuery());
                  // TODO: add command for clearDisabledGroups if needed
                }}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold text-[#999] hover:text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer border border-[#e5e5e5]"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Group Filter Pills — dynamically discovered from kernel scopes */}
        {allGroups.length > 0 && (
          <InspectorFiltersUI.Zone className="flex items-center gap-1 px-2 py-1 border-t border-[#f0f0f0] bg-[#fafafa] overflow-x-auto">
            {allGroups.map((group) => {
              const active = !disabledGroups.has(group);
              return (
                <InspectorFiltersUI.Item
                  key={group}
                  id={`groupBtn-${group}`}
                  asChild
                >
                  {() => (
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(group)}
                      className={`px-1.5 py-px rounded text-[8px] font-semibold cursor-pointer border transition-colors whitespace-nowrap ${active
                          ? "bg-[#1e293b] text-white border-[#1e293b]"
                          : "bg-white text-[#b0b0b0] border-[#e0e0e0] line-through"
                        }`}
                    >
                      {group}
                    </button>
                  )}
                </InspectorFiltersUI.Item>
              );
            })}
          </InspectorFiltersUI.Zone>
        )}

        {/* Search & Actions Row */}
        <InspectorSearchUI.Zone className="h-6 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center px-1.5 gap-1">
          <div className="flex-1 relative">
            <Search
              size={9}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] z-10"
            />
            <InspectorSearchUI.Field
              name="search-input"
              value={searchQuery}
              placeholder="Filter..."
              className="w-full text-[9px] bg-white border border-[#e0e0e0] focus:border-[#3b82f6] rounded pl-5 pr-4 py-0.5 outline-none text-[#334155] placeholder:text-[#ccc]"
            />
            {searchQuery && (
              <InspectorSearchUI.Item id="clearBtn" asChild>
                {() => (
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#ef4444] text-[8px] leading-none z-10"
                  >
                    ✕
                  </button>
                )}
              </InspectorSearchUI.Item>
            )}
          </div>
          <button
            type="button"
            onClick={expandAll}
            className="p-0.5 text-[#b0b0b0] hover:text-[#3b82f6] rounded"
            title="Expand All"
          >
            <ListTree size={11} />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="p-0.5 text-[#b0b0b0] hover:text-[#333] rounded z-10 relative"
            title="Collapse All"
          >
            <ListMinus size={11} />
          </button>
        </InspectorSearchUI.Zone>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto"
        >
          {/* ── Trace Log Section ── */}
          <TransactionList
            filteredTx={filteredTx.map((tx, idx) => ({ tx, index: idx }))}
            searchQuery={searchQuery}
            expandedTxs={expandedIds}
            setExpandedTxs={setManualToggles}
            traceOpen={traceOpen}
            setTraceOpen={setTraceOpen}
            scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
            handleScroll={handleScroll}
            highlightElement={handleHighlight}
          />

          {/* ── Store State Section ── */}
          {storeState && (
            <CollapsibleSection
              title="Store State"
              icon={<Package size={9} />}
              open={storeOpen}
              onToggle={() => setStoreOpen(!storeOpen)}
            >
              <div className="p-1.5 bg-[#1e293b] overflow-x-auto">
                <pre className="text-[9px] font-mono text-[#e2e8f0] leading-snug whitespace-pre-wrap break-all">
                  {JSON.stringify(storeState, null, 2)}
                </pre>
              </div>
            </CollapsibleSection>
          )}

          {/* Bottom spacer */}
          {transactions.length > 0 && (
            <div style={{ height: "80%" }} aria-hidden />
          )}
        </div>

        {/* Jump to latest */}
        {isUserScrolled && (
          <InspectorScrollUI.Zone>
            <InspectorScrollUI.Item id="scrollToBottomBtn">
              <button
                type="button"
                {...InspectorScroll.triggers.ScrollToBottom()}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#334155] text-white text-[9px] font-semibold hover:bg-[#1e293b] cursor-pointer border-none"
              >
                <ChevronDown size={10} />
                Latest
              </button>
            </InspectorScrollUI.Item>
          </InspectorScrollUI.Zone>
        )}
      </div>
    </div>
  );
}
