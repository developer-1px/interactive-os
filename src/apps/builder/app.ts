/**
 * Builder App v5 — defineApp native (createZone + bind).
 *
 * Section-scoped field model: each SectionEntry owns its fields.
 * Paste = structuredClone(section) + new id. No prefix convention needed.
 *
 * Structure:
 *   BuilderApp (defineApp)
 *     ├── Selectors: selectedId, selectedType
 *     └── Zones:
 *         ├── sidebar — collection CRUD + clipboard
 *         └── canvas — grid (updateField, selectElement)
 */

import { produce } from "immer";
import { defineApp } from "@/os/defineApp";
import type { FieldCommandFactory } from "@/os/schemas/command/BaseCommand";
import { type BuilderState, INITIAL_STATE, type PropertyType, type SectionEntry } from "./model/appState";
export type { BuilderState, PropertyType, SectionEntry };
export { INITIAL_STATE };

// ═══════════════════════════════════════════════════════════════════
// App definition
// ═══════════════════════════════════════════════════════════════════

export const BuilderApp = defineApp<BuilderState>("builder", INITIAL_STATE, {
  history: true,
});

// ═══════════════════════════════════════════════════════════════════
// Selectors (v5 branded)
// ═══════════════════════════════════════════════════════════════════

export const selectedId = BuilderApp.selector(
  "selectedId",
  (s) => s.ui.selectedId,
);
export const selectedType = BuilderApp.selector(
  "selectedType",
  (s) => s.ui.selectedType,
);


// ═══════════════════════════════════════════════════════════════════
// Undo / Redo — generic factory (defineApp.undoRedo.ts)
// ═══════════════════════════════════════════════════════════════════

import { createUndoRedoCommands } from "@/os/defineApp.undoRedo";

export const { canUndo, canRedo, undoCommand, redoCommand } =
  createUndoRedoCommands(BuilderApp);

// ═══════════════════════════════════════════════════════════════════
// Sidebar Zone — Collection Zone Facade
// ═══════════════════════════════════════════════════════════════════

import { createCollectionZone } from "@/os/collection/createCollectionZone";

const sidebarCollection = createCollectionZone(BuilderApp, "sidebar", {
  accessor: (s: BuilderState) => s.data.sections,
  extractId: (focusId: string) => focusId.replace("sidebar-", ""),
  onClone: (original, newId) => ({
    ...original,
    id: newId,
    label: `${original.label} (copy)`,
    fields: { ...original.fields },
  }),
  clipboard: {
    accessor: (s: BuilderState) => s.ui.clipboard,
    set: (draft: BuilderState, value) => {
      draft.ui.clipboard = value;
    },
    toText: (items: SectionEntry[]) => items.map((s) => s.label).join("\n"),
    onPaste: (item: SectionEntry) => ({
      ...item,
      id: Math.random().toString(36).slice(2, 10),
      label: `${item.label} (paste)`,
      fields: { ...item.fields },
    }),
  },
});

// Re-export for backward compatibility with existing tests
export const deleteSection = sidebarCollection.remove;
export const duplicateSection = sidebarCollection.duplicate;
export const moveSectionUp = sidebarCollection.moveUp;
export const moveSectionDown = sidebarCollection.moveDown;

// pasteSection is no longer needed — clipboard.onPaste handles
// deep cloning because fields are co-located in SectionEntry.

// Custom command not covered by collection CRUD
export const renameSectionLabel = sidebarCollection.command(
  "renameSectionLabel",
  (ctx, payload: { id: string; label: string }) => ({
    state: produce(ctx.state, (draft) => {
      const section = draft.data.sections.find((s) => s.id === payload.id);
      if (section) section.label = payload.label;
    }),
  }),
);

// Bind with auto-wired CRUD + custom options
const collectionBindings = sidebarCollection.collectionBindings();
export { sidebarCollection };
export const BuilderSidebarUI = sidebarCollection.bind({
  role: "listbox",
  ...collectionBindings,
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  options: {
    navigate: { orientation: "vertical" },
    tab: { behavior: "flow" },
  },
  keybindings: [...collectionBindings.keybindings],
});

// ═══════════════════════════════════════════════════════════════════
// Canvas Zone — v5 native (createZone + bind)
// ═══════════════════════════════════════════════════════════════════

const canvasZone = BuilderApp.createZone("canvas");

/**
 * updateField — 섹션 필드 값 변경.
 * sectionId + field (local key) 로 대상 식별.
 */
export const updateField = canvasZone.command(
  "updateField",
  (
    ctx,
    payload: { sectionId: string; field: string; value: string },
  ) => ({
    state: produce(ctx.state, (draft) => {
      const section = draft.data.sections.find(
        (s) => s.id === payload.sectionId,
      );
      if (section) section.fields[payload.field] = payload.value;
    }),
  }),
);

/**
 * selectElement — 요소 선택 상태 변경.
 * kernel focus와 동기화하여 패널에 해당 요소 데이터를 표시.
 */
export const selectElement = canvasZone.command(
  "selectElement",
  (
    ctx,
    payload: { id: string | null; type: PropertyType },
  ) => ({
    state: produce(ctx.state, (draft) => {
      draft.ui.selectedId = payload.id;
      draft.ui.selectedType = payload.type;
    }),
  }),
);

// Zone binding — hierarchical navigation (section/group/item)
import {
  createCanvasItemFilter,
  createDrillDown,
  createDrillUp,
} from "@/apps/builder/features/hierarchicalNavigation";

const CANVAS_ZONE_ID = "builder-canvas";

export const BuilderCanvasUI = canvasZone.bind({
  role: "grid",
  onAction: createDrillDown(CANVAS_ZONE_ID),
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  options: {
    navigate: { orientation: "corner" },
    tab: { behavior: "trap" },
  },
  itemFilter: createCanvasItemFilter(CANVAS_ZONE_ID),
  keybindings: [{ key: "\\", command: createDrillUp(CANVAS_ZONE_ID) }],
});

// ═══════════════════════════════════════════════════════════════════
// Helpers for Field ↔ State bridging
// ═══════════════════════════════════════════════════════════════════

import { kernel } from "@/os/kernel";

/**
 * createFieldCommit — Section-aware FieldCommandFactory.
 *
 * Usage in NCP blocks:
 *   <Field onCommit={createFieldCommit(sectionId, "title")} ... />
 */
export function createFieldCommit(
  sectionId: string,
  field: string,
): FieldCommandFactory {
  const factory = (payload: { text: string }) =>
    updateField({ sectionId, field, value: payload.text });
  factory.id = `builder:commitField:${sectionId}:${field}`;
  return factory as FieldCommandFactory;
}



/**
 * useSectionFields — Subscribe to a section's fields (targeted re-render).
 *
 * @example
 *   const fields = useSectionFields("ncp-hero");
 *   // fields.title, fields.sub, fields.brand ...
 */
export function useSectionFields(sectionId: string): Record<string, string> {
  return BuilderApp.useComputed(
    (s) => s.data.sections.find((sec) => sec.id === sectionId)?.fields ?? {},
  ) as unknown as Record<string, string>;
}

/**
 * resolveFieldAddress — DOM element id → { section, field }.
 *
 * Given "ncp-hero-title", finds section "ncp-hero" and returns
 * the matching section object and field key "title".
 * Returns null if no matching section is found.
 */
export function resolveFieldAddress(
  domId: string,
  sections: SectionEntry[],
): { section: SectionEntry; field: string } | null {
  // Match the longest section id prefix
  let best: SectionEntry | null = null;
  for (const sec of sections) {
    if (domId.startsWith(`${sec.id}-`)) {
      if (!best || sec.id.length > best.id.length) best = sec;
    }
  }
  if (!best) return null;
  return { section: best, field: domId.slice(best.id.length + 1) };
}

/**
 * useFieldByDomId — Read a field value using its DOM element id.
 * Used by PropertiesPanel where fieldName = DOM id.
 */
export function useFieldByDomId(domId: string): string {
  return BuilderApp.useComputed((s) => {
    const addr = resolveFieldAddress(domId, s.data.sections);
    if (!addr) return "";
    return addr.section.fields[addr.field] ?? "";
  }) as unknown as string;
}

/**
 * builderUpdateFieldByDomId — Write a field value using its DOM element id.
 * Used by PropertiesPanel's imperative onChange handlers.
 */
export function builderUpdateFieldByDomId(domId: string, value: string) {
  const appState = kernel.getState().apps["builder"] as
    | BuilderState
    | undefined;
  if (!appState) return;
  const addr = resolveFieldAddress(domId, appState.data.sections);
  if (!addr) return;
  kernel.dispatch(
    updateField({ sectionId: addr.section.id, field: addr.field, value }),
  );
}
