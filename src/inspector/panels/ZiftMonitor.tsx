/**
 * ZiftMonitor — ZIFT Runtime Structure Monitor
 *
 * Shows the current page's Zone/Item/Field/Trigger structure
 * as a collapsible card list. Reads directly from OS registries.
 *
 * Expand/collapse via OS accordion pattern (aria-expanded).
 *
 * Data sources:
 * - ZoneRegistry (mounted zones, items, callbacks)
 * - FieldRegistry (field entries, values, dirty state)
 * - TriggerOverlayRegistry (trigger→overlay connections)
 * - os.getState() (focused zone, focused item per zone)
 */

import type { AppState } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { TriggerOverlayRegistry } from "@os-core/engine/registries/triggerRegistry";
import {
  type ZoneEntry,
  ZoneRegistry,
} from "@os-core/engine/registries/zoneRegistry";
import { ensureZone, os } from "@os-sdk/os";
import { produce } from "immer";
import { Ban, ChevronRight, Circle, CircleDot, Link } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { InspectorZiftUI } from "../app";

// ═══════════════════════════════════════════════════════════════════
// Data Collection
// ═══════════════════════════════════════════════════════════════════

interface ZoneCard {
  id: string;
  role: string;
  items: string[];
  focusedItemId: string | null;
  disabledItems: ReadonlySet<string>;
  callbacks: string[];
  commands: readonly string[];
  fields: FieldInfo[];
  triggers: TriggerInfo[];
  isActiveZone: boolean;
}

interface FieldInfo {
  name: string;
  value: string | boolean | number | string[];
  isDirty: boolean;
  isValid: boolean;
  fieldType: string;
}

interface TriggerInfo {
  triggerId: string;
  overlayId: string;
  overlayType: string;
}

interface FocusSlice {
  activeZoneId: string | null;
  zones: AppState["os"]["focus"]["zones"];
}

function collectZoneCards(
  focus: FocusSlice,
  _zoneSnapshot?: number,
): ZoneCard[] {
  const zoneIds = [...ZoneRegistry.keys()];
  const activeZoneId = focus.activeZoneId;
  const fieldState = FieldRegistry.get();

  // Get kernel registry for commands per scope
  const kernelRegistry = os.inspector.getRegistry();

  const cards: ZoneCard[] = [];

  for (const id of zoneIds) {
    const entry = ZoneRegistry.get(id);
    if (!entry) continue;

    const items = ZoneRegistry.resolveItems(id);
    const zoneState = focus.zones[id];

    // Collect callbacks
    const callbacks = collectCallbacks(entry);

    // Collect commands from kernel scope
    const commands = kernelRegistry.commands.get(id as never) ?? [];

    // Collect fields belonging to this zone
    const fields: FieldInfo[] = [];
    if (entry.fieldId) {
      const fieldEntry = fieldState.fields.get(entry.fieldId);
      if (fieldEntry) {
        fields.push({
          name: fieldEntry.config.name,
          value: fieldEntry.state.value,
          isDirty: fieldEntry.state.isDirty,
          isValid: fieldEntry.state.isValid,
          fieldType: fieldEntry.config.fieldType ?? "inline",
        });
      }
    }
    // Also check if any field name matches zone id pattern
    for (const [fieldId, fieldEntry] of fieldState.fields) {
      if (fieldId === entry.fieldId) continue;
      if (fieldId.startsWith(id)) {
        fields.push({
          name: fieldEntry.config.name,
          value: fieldEntry.state.value,
          isDirty: fieldEntry.state.isDirty,
          isValid: fieldEntry.state.isValid,
          fieldType: fieldEntry.config.fieldType ?? "inline",
        });
      }
    }

    // Collect triggers
    const triggers: TriggerInfo[] = [];
    for (const itemId of items) {
      const overlay = TriggerOverlayRegistry.get(itemId);
      if (overlay) {
        triggers.push({
          triggerId: itemId,
          overlayId: overlay.overlayId,
          overlayType: overlay.overlayType,
        });
      }
    }

    cards.push({
      id,
      role: (entry.role as string) ?? "group",
      items,
      focusedItemId: zoneState?.focusedItemId ?? null,
      disabledItems: ZoneRegistry.getDisabledItems(id),
      callbacks,
      commands,
      fields,
      triggers,
      isActiveZone: id === activeZoneId,
    });
  }

  return cards;
}

function collectCallbacks(entry: ZoneEntry): string[] {
  const cbs: string[] = [];
  if (entry.onAction) cbs.push("onAction");
  if (entry.onSelect) cbs.push("onSelect");
  if (entry.onCheck) cbs.push("onCheck");
  if (entry.onDelete) cbs.push("onDelete");
  if (entry.onMoveUp) cbs.push("onMoveUp");
  if (entry.onMoveDown) cbs.push("onMoveDown");
  if (entry.onCopy) cbs.push("onCopy");
  if (entry.onCut) cbs.push("onCut");
  if (entry.onPaste) cbs.push("onPaste");
  if (entry.onUndo) cbs.push("onUndo");
  if (entry.onRedo) cbs.push("onRedo");
  if (entry.onReorder) cbs.push("onReorder");
  return cbs;
}

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════

function ZoneCardDetail({ card }: { card: ZoneCard }) {
  return (
    <div className="bg-white">
      {/* Items */}
      {card.items.length > 0 && (
        <div className="px-3 py-1 border-b border-[#f5f5f5]">
          <div className="text-[7px] font-bold text-[#b0b0b0] uppercase tracking-[0.15em] mb-0.5">
            Items
          </div>
          {card.items.map((itemId, idx) => {
            const isFocused = itemId === card.focusedItemId;
            const isDisabled = card.disabledItems.has(itemId);
            return (
              <div
                key={`${itemId}-${idx}`}
                className={`flex items-center gap-1.5 py-px ${
                  isFocused ? "text-[#007acc]" : "text-[#666]"
                }`}
              >
                {isFocused ? (
                  <CircleDot
                    size={7}
                    className="text-[#007acc] flex-shrink-0"
                  />
                ) : isDisabled ? (
                  <Ban size={7} className="text-[#f48771] flex-shrink-0" />
                ) : (
                  <Circle size={7} className="text-[#ccc] flex-shrink-0" />
                )}
                <span
                  className={`text-[8px] font-mono truncate ${
                    isFocused ? "font-bold" : ""
                  } ${isDisabled ? "line-through text-[#ccc]" : ""}`}
                >
                  {itemId}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Commands */}
      {card.commands.length > 0 && (
        <div className="px-3 py-1 border-b border-[#f5f5f5]">
          <div className="text-[7px] font-bold text-[#b0b0b0] uppercase tracking-[0.15em] mb-0.5">
            Commands
          </div>
          {card.commands.map((type) => (
            <div key={type} className="flex items-center gap-1.5 py-px">
              <div className="w-1 h-1 rounded-full bg-[#4ec9b0] flex-shrink-0" />
              <span className="text-[8px] font-mono text-[#444] truncate">
                {type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Callbacks */}
      {card.callbacks.length > 0 && (
        <div className="px-3 py-1 border-b border-[#f5f5f5]">
          <div className="text-[7px] font-bold text-[#b0b0b0] uppercase tracking-[0.15em] mb-0.5">
            Callbacks
          </div>
          <div className="flex flex-wrap gap-1">
            {card.callbacks.map((cb) => (
              <span
                key={cb}
                className="text-[7px] font-mono text-[#ce9178] bg-[#ce9178]/5 px-1 py-0.5 rounded border border-[#ce9178]/20"
              >
                {cb}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fields */}
      {card.fields.length > 0 && (
        <div className="px-3 py-1 border-b border-[#f5f5f5]">
          <div className="text-[7px] font-bold text-[#b0b0b0] uppercase tracking-[0.15em] mb-0.5">
            Fields
          </div>
          {card.fields.map((field) => (
            <div
              key={field.name}
              className="flex items-center justify-between py-px"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[8px] font-mono text-[#444] truncate">
                  {field.name}
                </span>
                <span className="text-[6px] font-mono text-[#ccc]">
                  {field.fieldType}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[8px] font-mono text-[#666] max-w-[100px] truncate">
                  {String(field.value)}
                </span>
                {field.isDirty && (
                  <span className="text-[6px] font-bold text-[#dcdcaa]">
                    dirty
                  </span>
                )}
                {!field.isValid && (
                  <span className="text-[6px] font-bold text-[#f48771]">
                    err
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Triggers */}
      {card.triggers.length > 0 && (
        <div className="px-3 py-1 border-b border-[#f5f5f5]">
          <div className="text-[7px] font-bold text-[#b0b0b0] uppercase tracking-[0.15em] mb-0.5">
            Triggers
          </div>
          {card.triggers.map((t) => (
            <div key={t.triggerId} className="flex items-center gap-1.5 py-px">
              <Link size={7} className="text-[#b0b0b0] flex-shrink-0" />
              <span className="text-[8px] font-mono text-[#444] truncate">
                {t.triggerId}
              </span>
              <span className="text-[6px] text-[#999]">→</span>
              <span className="text-[7px] font-mono text-[#007acc]">
                {t.overlayType}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneCardView({ card }: { card: ZoneCard }) {
  return (
    <section className="border-b border-[#e8e8e8]">
      {/* Zone Header — OS disclosure Item (click toggles aria-expanded via PointerListener) */}
      <InspectorZiftUI.Item
        id={card.id}
        className={`group w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer
          ${card.isActiveZone ? "bg-[#007acc]/5" : "bg-[#f8f8f8] hover:bg-[#f0f0f0]"}`}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            size={10}
            className="text-[#999] flex-shrink-0 transition-transform group-aria-expanded:rotate-90"
          />
          <div
            className={`w-1 h-3 rounded-full opacity-60 ${
              card.isActiveZone ? "bg-[#007acc]" : "bg-[#4ec9b0]"
            }`}
          />
          <span
            className={`text-[8px] font-black tracking-[0.1em] uppercase ${
              card.isActiveZone ? "text-[#007acc]" : "text-[#666]"
            }`}
          >
            {card.id}
          </span>
          <span className="text-[7px] font-mono text-[#b0b0b0]">
            {card.role}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {card.items.length > 0 && (
            <span className="text-[7px] font-mono text-[#999] bg-white px-1 py-0.5 rounded border border-[#e5e5e5]">
              {card.items.length}
            </span>
          )}
          {card.commands.length > 0 && (
            <span className="text-[7px] font-mono text-[#ce9178] bg-white px-1 py-0.5 rounded border border-[#e5e5e5]">
              {card.commands.length}cmd
            </span>
          )}
          {card.fields.length > 0 && (
            <span className="text-[7px] font-mono text-[#dcdcaa] bg-white px-1 py-0.5 rounded border border-[#e5e5e5]">
              {card.fields.length}f
            </span>
          )}
          {card.triggers.length > 0 && (
            <Link size={8} className="text-[#b0b0b0]" />
          )}
        </div>
      </InspectorZiftUI.Item>

      {/* Expanded Detail — OS-driven visibility via Item.Content */}
      <InspectorZiftUI.Item.Content for={card.id}>
        <ZoneCardDetail card={card} />
      </InspectorZiftUI.Item.Content>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Export
// ═══════════════════════════════════════════════════════════════════

export const ZiftMonitor = memo(() => {
  // Re-render when zones change
  const zoneSnapshot = useSyncExternalStore(
    ZoneRegistry.subscribe,
    ZoneRegistry.getSnapshot,
    ZoneRegistry.getSnapshot,
  );

  // Only subscribe to focus slice (activeZoneId + per-zone state)
  const focus = os.useComputed((s: AppState) => s.os.focus);

  const cards = useMemo(
    () => collectZoneCards(focus, zoneSnapshot),
    [zoneSnapshot, focus],
  );

  // Expand all zone cards on first mount (disclosure default = collapsed)
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || cards.length === 0) return;
    didInit.current = true;
    os.setState((s: AppState) =>
      produce(s, (draft) => {
        const z = ensureZone(draft.os, "inspector-zift");
        for (const card of cards) {
          if (!z.items[card.id]) z.items[card.id] = {};
          z.items[card.id]!["aria-expanded"] = true;
        }
      }),
    );
  }, [cards]);

  // Summary
  let totalItems = 0;
  let totalFields = 0;
  for (const c of cards) {
    totalItems += c.items.length;
    totalFields += c.fields.length;
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* Summary header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#fafafa] border-b border-[#e8e8e8]">
        <span className="text-[8px] font-bold text-[#999] uppercase tracking-[0.15em]">
          ZIFT Structure
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-mono text-[#007acc]">
            {cards.length} zones
          </span>
          <span className="text-[7px] font-mono text-[#999]">
            {totalItems} items
          </span>
          {totalFields > 0 && (
            <span className="text-[7px] font-mono text-[#dcdcaa]">
              {totalFields} fields
            </span>
          )}
        </div>
      </div>

      {/* Zone Cards — OS accordion drives expand/collapse */}
      <InspectorZiftUI.Zone>
        {cards.map((card) => (
          <ZoneCardView key={card.id} card={card} />
        ))}
      </InspectorZiftUI.Zone>

      {cards.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[8px] text-[#ccc] font-mono uppercase tracking-wider">
          No zones mounted
        </div>
      )}
    </div>
  );
});
