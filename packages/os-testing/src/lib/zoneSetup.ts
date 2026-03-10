/**
 * zoneSetup — Register zones from bindings and seed initial state.
 *
 * Used by createPage's goto() to set up all app zones in headless mode.
 */

import { Keybindings } from "@os-core/2-resolve/keybindings";
import { type AppState, os } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import type { ZoneOptions } from "@os-core/3-inject/zoneContext";
import { ensureZone } from "@os-core/schema/state/utils";
import { produce } from "immer";
import type { ZoneBindingEntry } from "@os-sdk/app/defineApp/types";
import type { HeadlessEnv } from "./setupHeadlessEnv";

export function registerZones(
  zoneBindingEntries: Map<string, ZoneBindingEntry>,
  env: HeadlessEnv,
): void {
  for (const [zoneName, bindingEntry] of zoneBindingEntries) {
    registerZoneFromBinding(zoneName, bindingEntry, env);
  }
}

function registerZoneFromBinding(
  zoneName: string,
  bindingEntry: ZoneBindingEntry,
  env: HeadlessEnv,
): void {
  const { bindings } = bindingEntry;
  const overrides = { ...bindings.options } as ZoneOptions;
  const config = resolveRole(bindingEntry.role, overrides);
  const entry: import("@os-core/engine/registries/zoneRegistry").ZoneEntry = {
    config,
    element: null,
    parentId: null,
  };
  if (bindingEntry.role) entry.role = bindingEntry.role;
  if (bindings.onAction) entry.onAction = bindings.onAction;
  if (bindings.onCheck) entry.onCheck = bindings.onCheck;
  if (bindings.onDelete) entry.onDelete = bindings.onDelete;
  if (bindings.onCopy) entry.onCopy = bindings.onCopy;
  if (bindings.onCut) entry.onCut = bindings.onCut;
  if (bindings.onPaste) entry.onPaste = bindings.onPaste;
  if (bindings.onMoveUp) entry.onMoveUp = bindings.onMoveUp;
  if (bindings.onMoveDown) entry.onMoveDown = bindings.onMoveDown;
  if (bindings.onUndo) entry.onUndo = bindings.onUndo;
  if (bindings.onRedo) entry.onRedo = bindings.onRedo;
  if (bindings.onSelect) entry.onSelect = bindings.onSelect;
  if (bindings.itemFilter) entry.itemFilter = bindings.itemFilter;
  if (bindings.getItems) {
    entry.getItems = bindings.getItems;
    env.zonesWithBindingGetItems.add(zoneName);
  }
  if (bindings.getExpandableItems)
    entry.getExpandableItems = bindings.getExpandableItems;
  if (bindings.getTreeLevels)
    entry.getTreeLevels = bindings.getTreeLevels;
  ZoneRegistry.register(zoneName, entry);

  if (bindingEntry.triggers) {
    for (const trigger of bindingEntry.triggers) {
      ZoneRegistry.setItemCallback(zoneName, trigger.id, {
        onActivate: trigger.onActivate,
      });
    }
  }

  // Register zone keybindings
  const keybindings = bindingEntry.keybindings ?? [];
  if (keybindings.length > 0) {
    const unreg = Keybindings.registerAll(
      keybindings.map((kb) => ({
        key: kb.key,
        command: kb.command,
        when: "navigating" as const,
      })),
    );
    env.addKeybindings(unreg);
  }

  // Register field
  const field = bindingEntry.field;
  if (field?.fieldName) {
    FieldRegistry.register(field.fieldName, {
      name: field.fieldName,
      ...(field.onCommit !== undefined ? { onCommit: field.onCommit } : {}),
      ...(field.trigger !== undefined ? { trigger: field.trigger } : {}),
      ...(field.schema !== undefined ? { schema: field.schema } : {}),
      ...(field.resetOnSubmit !== undefined
        ? { resetOnSubmit: field.resetOnSubmit }
        : {}),
      mode: "immediate",
      fieldType: "inline",
    });
    const zoneEntry = ZoneRegistry.get(zoneName);
    if (zoneEntry) zoneEntry.fieldId = field.fieldName;
  }
}

export function seedInitialState(zoneName: string): void {
  const zoneEntry = ZoneRegistry.get(zoneName);
  if (!zoneEntry) return;
  const zoneConfig = zoneEntry.config;
  const items = zoneEntry.getItems?.() ?? [];

  // Initial selection
  const selectConfig = zoneConfig?.select;
  if (selectConfig && selectConfig.mode !== "none" && items.length > 0) {
    const explicit = selectConfig.initial;
    const initialIds = explicit
      ? Array.isArray(explicit)
        ? explicit
        : [explicit]
      : selectConfig.disallowEmpty
        ? [items[0]!]
        : [];
    if (initialIds.length > 0) {
      const inputmapValues = zoneConfig?.inputmap
        ? Object.values(zoneConfig.inputmap)
        : [];
      const hasCheckCmd = inputmapValues.some((cmds: unknown[]) =>
        cmds.some(
          (c: unknown) => (c as { type: string }).type === "OS_CHECK",
        ),
      );
      os.setState((s: AppState) =>
        produce(s, (draft) => {
          const z = ensureZone(draft.os, zoneName);
          for (const id of initialIds) {
            if (!z.items[id]) z.items[id] = {};
            if (hasCheckCmd)
              z.items[id] = { ...z.items[id], "aria-checked": true };
            if (selectConfig.mode !== "none")
              z.items[id] = { ...z.items[id], "aria-selected": true };
          }
          z.selectionAnchor = initialIds[0] ?? null;
        }),
      );
    }
  }

  // Initial expand
  const expandConfig = zoneConfig?.expand;
  if (expandConfig && expandConfig.mode !== "none" && expandConfig.initial) {
    os.setState((s: AppState) =>
      produce(s, (draft) => {
        const z = ensureZone(draft.os, zoneName);
        for (const id of expandConfig.initial!) {
          if (!z.items[id]) z.items[id] = {};
          z.items[id] = { ...z.items[id], "aria-expanded": true };
        }
      }),
    );
  }

  // Initial value
  const valueConfig = zoneConfig?.value;
  if (valueConfig?.initial) {
    os.setState((s: AppState) =>
      produce(s, (draft) => {
        const z = ensureZone(draft.os, zoneName);
        for (const [itemId, value] of Object.entries(valueConfig.initial!)) {
          if (z.valueNow[itemId] === undefined) {
            z.valueNow[itemId] = value as number;
          }
        }
      }),
    );
  }
}
