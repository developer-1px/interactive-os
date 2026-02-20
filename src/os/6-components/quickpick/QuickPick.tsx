/**
 * QuickPick — OS-Level Combobox Primitive
 *
 * A command palette / quick picker composed from OS primitives:
 *   - Dialog (overlay lifecycle)
 *   - Zone with virtualFocus (keyboard navigation stays in input)
 *   - Item (render prop for focus/selection state)
 *
 * Design: "OS provides behavior, app decides form."
 *   - QuickPick provides: overlay, filter, virtual focus, keyboard nav, typeahead
 *   - Apps provide: items, filterFn, renderItem, actions
 *
 * @example Basic usage
 *   <QuickPick
 *     id="file-picker"
 *     isOpen={open}
 *     items={files}
 *     onSelect={(item) => openFile(item.id)}
 *     onClose={() => setOpen(false)}
 *   />
 *
 * @example Advanced (custom filter + render)
 *   <QuickPick
 *     id="command-palette"
 *     isOpen={open}
 *     items={allItems}
 *     filterFn={fuzzyFilter}
 *     renderItem={(item, { isFocused, query }) => <CustomRow ... />}
 *     typeahead={(items, q) => items[0]?.label.slice(q.length) ?? ""}
 *     renderFooter={() => <FooterHints />}
 *     onSelect={handleSelect}
 *     onClose={handleClose}
 *   />
 */

import {
  OS_FOCUS,
  OS_NAVIGATE,
  OS_OVERLAY_CLOSE,
  OS_OVERLAY_OPEN,
} from "@os/3-commands";
import { Kbd } from "@os/6-components/Kbd";
import { Item } from "@os/6-components/primitives/Item";
import { Zone } from "@os/6-components/primitives/Zone";
import { Dialog } from "@os/6-components/radox/Dialog";
import { os } from "@os/kernel";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface QuickPickItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
}

export interface QuickPickRenderState {
  /** Whether this item is logically focused (virtual focus). */
  isFocused: boolean;
  /** Whether this item is selected. */
  isSelected: boolean;
  /** Current search query. */
  query: string;
}

export interface QuickPickProps<T extends QuickPickItem = QuickPickItem> {
  /** Overlay ID for the kernel. Used to open/close programmatically. */
  id?: string;

  /** Items to display and filter. */
  items: T[];

  /** Called when user selects an item (Enter or click). */
  onSelect: (item: T) => void;

  /** Called when the picker should close. */
  onClose?: () => void;

  /** Controlled open state. */
  isOpen?: boolean;

  /** Input placeholder text. */
  placeholder?: string;

  /**
   * Custom filter function. Receives all items and the query string.
   * Must return the filtered (and optionally sorted) items.
   * Default: case-insensitive label/description includes match.
   */
  filterFn?: (items: T[], query: string) => T[];

  /**
   * Custom item renderer. If not provided, uses default rendering.
   * Receives the item and its render state (focus, selection, query).
   */
  renderItem?: (item: T, state: QuickPickRenderState) => React.ReactNode;

  /** Custom empty-state renderer. Default: "No results found". */
  renderEmpty?: (query: string) => React.ReactNode;

  /** Custom footer renderer. */
  renderFooter?: () => React.ReactNode;

  /**
   * Typeahead ghost text completion.
   *   - `true`:  auto-complete from first match's label prefix
   *   - function: custom completion resolver `(filteredItems, query) => suffix`
   */
  typeahead?: boolean | ((items: T[], query: string) => string);

  /** Additional className for the outer dialog. */
  className?: string;

  /** Additional className for the content panel. */
  contentClassName?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Default filter
// ═══════════════════════════════════════════════════════════════════

function defaultFilter<T extends QuickPickItem>(
  items: T[],
  query: string,
): T[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q),
  );
}

// ═══════════════════════════════════════════════════════════════════
// Default typeahead resolver
// ═══════════════════════════════════════════════════════════════════

function defaultTypeahead<T extends QuickPickItem>(
  items: T[],
  query: string,
): string {
  if (!query || items.length === 0) return "";
  const top = items[0];
  if (!top) return "";
  const label = top.label;
  if (label.toLowerCase().startsWith(query.toLowerCase())) {
    return label.slice(query.length);
  }
  return "";
}

// ═══════════════════════════════════════════════════════════════════
// Zone Options (static — prevents re-render)
// ═══════════════════════════════════════════════════════════════════

const QUICKPICK_ZONE_OPTIONS = {
  project: { virtualFocus: true, autoFocus: true },
  navigate: { orientation: "vertical" as const, loop: true },
  select: { mode: "single" as const, followFocus: true },
};

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function QuickPick<T extends QuickPickItem = QuickPickItem>({
  id = "quickpick",
  items,
  onSelect,
  onClose,
  isOpen,
  placeholder = "Type to search...",
  filterFn,
  renderItem,
  renderEmpty,
  renderFooter,
  typeahead,
  className,
  contentClassName,
}: QuickPickProps<T>) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoneId = `${id}-list`;

  // ── Overlay sync ──
  useEffect(() => {
    if (isOpen) {
      os.dispatch(OS_OVERLAY_OPEN({ id, type: "dialog" }));
    } else {
      os.dispatch(OS_OVERLAY_CLOSE({ id }));
    }
  }, [isOpen, id]);

  // Detect external close (Esc via DialogZone) → sync back to parent
  const isOverlayOpen = os.useComputed((s) =>
    s.os.overlays.stack.some((o) => o.id === id),
  );

  useEffect(() => {
    if (isOpen && !isOverlayOpen && onClose) {
      onClose();
    }
  }, [isOverlayOpen, isOpen, onClose]);

  // ── Auto-focus input on open + activate zone ──
  // FocusGroup autoFocus (RAF) may race with Dialog zone in nested overlays.
  // setTimeout(0) runs after RAF, ensuring items are in the DOM.
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      // Activate the QuickPick zone by focusing the first item.
      // This sets activeZoneId so OS_NAVIGATE works correctly.
      const containerEl = containerRef.current;
      if (containerEl) {
        const firstItem =
          containerEl.querySelector<HTMLElement>("[data-item-id]");
        if (firstItem) {
          const itemId = firstItem.getAttribute("data-item-id");
          if (itemId) {
            os.dispatch(OS_FOCUS({ zoneId, itemId }));
          }
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, zoneId]);

  // ── Filtering ──
  const filter = filterFn ?? defaultFilter;
  const filteredItems = useMemo(
    () => filter(items, query),
    [items, query, filter],
  );

  // ── Typeahead ──
  const completion = useMemo(() => {
    if (!typeahead || !query) return "";
    const resolver =
      typeof typeahead === "function" ? typeahead : defaultTypeahead;
    return resolver(filteredItems, query);
  }, [typeahead, filteredItems, query]);

  // ── Focus trap: keep focus on input ──
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== inputRef.current) {
      e.preventDefault();
    }
  }, []);

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
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

  // ── Close helper ──
  const handleClose = useCallback(() => {
    os.dispatch(OS_OVERLAY_CLOSE({ id }));
    onClose?.();
  }, [id, onClose]);

  // ── Select from virtual focus ──
  const handleAction = useCallback(() => {
    const state = os.getState();
    const zone = state.os.focus.zones[zoneId];
    const focusedId = zone?.focusedItemId;

    if (focusedId) {
      const item = filteredItems.find((r) => r.id === focusedId);
      if (item) {
        handleClose();
        onSelect(item);
      }
    }
  }, [filteredItems, zoneId, handleClose, onSelect]);

  // ── Navigate from input → virtual zone ──
  // NOTE: KeyboardListener skips role="combobox" inputs entirely,
  //       so QuickPick is responsible for dispatching kernel commands.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab" || (e.key === "ArrowRight" && completion)) {
        // Accept typeahead
        e.preventDefault();
        if (completion) {
          setQuery((q) => q + completion);
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // Direct kernel dispatch — virtualFocus keeps DOM focus on input
        e.preventDefault();
        os.dispatch(
          OS_NAVIGATE({
            direction: e.key === "ArrowDown" ? "down" : "up",
          }),
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleAction();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    },
    [completion, handleAction, handleClose],
  );

  if (!isOpen) return null;

  return (
    <Dialog id={id}>
      <Dialog.Content
        title=""
        className={
          className ??
          "fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 bg-black/20 z-50 p-0 flex items-center justify-center"
        }
        contentClassName={
          contentClassName ??
          "w-[640px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-black/5 flex flex-col overflow-hidden text-zinc-900"
        }
      >
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
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleInputBlur}
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-expanded={filteredItems.length > 0}
                aria-controls={zoneId}
                aria-autocomplete={typeahead ? "both" : "list"}
              />
              {completion && (
                <div className="absolute inset-0 pointer-events-none flex items-center overflow-hidden whitespace-pre text-[16px] leading-6 font-normal">
                  <span className="opacity-0">{query}</span>
                  <span className="text-zinc-400 opacity-60">{completion}</span>
                </div>
              )}
            </div>
            <Kbd
              shortcut="Esc"
              className="shrink-0 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-mono shadow-sm"
            />
          </div>

          {/* Item List */}
          <Zone
            id={zoneId}
            role="listbox"
            options={QUICKPICK_ZONE_OPTIONS}
            className="min-h-[380px] max-h-[380px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar"
          >
            {filteredItems.length === 0
              ? (renderEmpty?.(query) ?? (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    No results found
                  </div>
                ))
              : filteredItems.map((item) => (
                  <Item key={item.id} id={item.id}>
                    {({ isFocused, isSelected }) =>
                      renderItem ? (
                        renderItem(item, { isFocused, isSelected, query })
                      ) : (
                        <DefaultQuickPickRow
                          item={item}
                          isFocused={isFocused}
                          onClick={() => {
                            handleClose();
                            onSelect(item);
                          }}
                        />
                      )
                    }
                  </Item>
                ))}
          </Zone>

          {/* Footer */}
          {renderFooter ? (
            renderFooter()
          ) : (
            <div className="flex items-center gap-4 px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-500 select-none">
              <span className="flex items-center gap-1.5">
                <Kbd
                  shortcut="Up"
                  className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
                />
                <Kbd
                  shortcut="Down"
                  className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
                />
                navigate
              </span>
              {typeahead && (
                <span className="flex items-center gap-1.5">
                  <Kbd
                    shortcut="Tab"
                    className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
                  />
                  complete
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Kbd
                  shortcut="Enter"
                  className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
                />
                select
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd
                  shortcut="Esc"
                  className="bg-zinc-200 text-zinc-700 px-1 rounded text-[10px] min-w-[16px] text-center"
                />
                close
              </span>
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Default Row
// ═══════════════════════════════════════════════════════════════════

function DefaultQuickPickRow({
  item,
  isFocused,
  onClick,
}: {
  item: QuickPickItem;
  isFocused: boolean;
  onClick: () => void;
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
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
      {item.icon && <span className="text-base opacity-70">{item.icon}</span>}
      <span className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        {item.label}
      </span>
      {item.description && (
        <span
          className={`text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[40%] text-right ${
            isFocused ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          {item.description}
        </span>
      )}
    </div>
  );
}
