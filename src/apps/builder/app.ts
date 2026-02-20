/**
 * Builder App v5 — defineApp native (createZone + bind).
 *
 * Block-scoped field model: each Block owns its fields.
 * Container blocks (tabs, accordion) have children.
 * Paste = structuredClone(block) + new id. No prefix convention needed.
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
import { os } from "@/os/kernel";
import { type Block, type BuilderState, INITIAL_STATE, type PropertyType, type SectionEntry } from "./model/appState";
import {
  type CollectionNode,
  findAcceptingCollection,
} from "@/os/collection/pasteBubbling";
export type { Block, BuilderState, PropertyType, SectionEntry };
export { INITIAL_STATE };

/** Read current builder state from kernel. */
function getBuilderState(): BuilderState {
  return os.getState().apps["builder"] as BuilderState;
}

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

import { createCollectionZone, _getClipboardPreview } from "@/os/collection/createCollectionZone";
import { OS_EXPAND } from "@/os/3-commands/expand/index";

/** Recursively clone a block tree, assigning new IDs to all descendants. */
function deepCloneBlock(block: Block, newId: string): Block {
  const cloned: Block = {
    ...block,
    id: newId,
    fields: { ...block.fields },
  };
  if (block.children) {
    cloned.children = block.children.map((child) =>
      deepCloneBlock(child, Math.random().toString(36).slice(2, 10)),
    );
  }
  return cloned;
}

export const sidebarCollection = createCollectionZone(BuilderApp, "sidebar", {
  accessor: (s: BuilderState) => s.data.blocks,
  text: (item: Block) => item.label,
  onClone: (original: Block, newId: string) => ({
    ...deepCloneBlock(original, newId),
    label: `${original.label} (copy)`,
  }),
  onPaste: (item: Block) => ({
    ...item,
    label: `${item.label} (paste)`,
  }),
});

// Re-export for backward compatibility with existing tests
export const deleteSection = sidebarCollection.remove;
export const duplicateSection = sidebarCollection.duplicate;
export const moveSectionUp = sidebarCollection.moveUp;
export const moveSectionDown = sidebarCollection.moveDown;

// pasteSection is no longer needed — clipboard.onPaste handles
// deep cloning because fields are co-located in Block.

// Custom command not covered by collection CRUD
export const renameSectionLabel = sidebarCollection.command(
  "renameSectionLabel",
  (ctx, payload: { id: string; label: string }) => ({
    state: produce(ctx.state, (draft) => {
      const section = draft.data.blocks.find((s) => s.id === payload.id);
      if (section) section.label = payload.label;
    }),
  }),
);

// Bind with auto-wired CRUD + custom options
const collectionBindings = sidebarCollection.collectionBindings();

export const BuilderSidebarUI = sidebarCollection.bind({
  role: "tree",
  ...collectionBindings,
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  options: {
    navigate: { orientation: "vertical" },
    select: { mode: "single", followFocus: true },
    tab: { behavior: "flow" },
  },
  keybindings: [
    ...collectionBindings.keybindings,
    { key: "ArrowLeft", command: () => OS_EXPAND({ action: "collapse" }) },
    { key: "ArrowRight", command: () => OS_EXPAND({ action: "expand" }) },
  ],
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
      const section = draft.data.blocks.find(
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

const CANVAS_ZONE_ID = "canvas";
/**
 * Canvas clipboard — uses pasteBubbling to find the right collection.
 *
 * Architecture:
 *   onCopy/onCut: find nearest dynamic ancestor of focused item → copy that
 *   onPaste: findAcceptingCollection → sidebarCollection.paste (tree-aware)
 */


/** Build collection hierarchy from current block tree for paste bubbling. */
function buildCanvasCollections(): CollectionNode[] {
  const blocks = getBuilderState().data.blocks;

  const nodes: CollectionNode[] = [
    // Root: section collection
    {
      id: "sidebar",
      parentId: null,
      accept: (data: unknown) => {
        // Accept any block (section-level paste always works)
        if (data && typeof data === "object" && "id" in data) return data;
        return null;
      },
      containsItem: (itemId: string) =>
        blocks.some((b) => b.id === itemId),
    },
  ];

  // Dynamic child collections: blocks with accept + children
  for (const block of blocks) {
    if (block.accept && block.children) {
      nodes.push({
        id: `${block.id}:children`,
        parentId: "sidebar",
        accept: (data: unknown) => {
          const d = data as Block;
          if (d?.type && block.accept!.includes(d.type)) return data;
          return null;
        },
        containsItem: (itemId: string) =>
          block.children!.some((c) => c.id === itemId),
      });

      // Nested: children with their own accept
      for (const child of block.children) {
        if (child.accept && child.children) {
          nodes.push({
            id: `${child.id}:children`,
            parentId: `${block.id}:children`,
            accept: (data: unknown) => {
              const d = data as Block;
              if (d?.type && child.accept!.includes(d.type)) return data;
              return null;
            },
            containsItem: (itemId: string) =>
              child.children!.some((c) => c.id === itemId),
          });
        }
      }
    }
  }

  return nodes;
}

/**
 * Resolve which block to copy/cut from the canvas focus.
 * Walks up from the focused item to the nearest dynamic collection item.
 */
function resolveCanvasCopyTarget(focusId: string): string | null {
  const blocks = getBuilderState().data.blocks;

  // Direct match: focused on a root block
  if (blocks.some((b) => b.id === focusId)) return focusId;

  // Check if it's a child of a container block (dynamic collection item)
  for (const block of blocks) {
    if (block.children?.some((c) => c.id === focusId)) return focusId;
    if (block.children) {
      for (const child of block.children) {
        if (child.children?.some((gc) => gc.id === focusId)) return focusId;
      }
    }
  }

  // Static item (e.g., ncp-hero-title): bubble to parent section
  const addr = resolveFieldAddress(focusId, blocks);
  return addr?.section.id ?? null;
}

export const BuilderCanvasUI = canvasZone.bind({
  role: "grid",
  onAction: createDrillDown(CANVAS_ZONE_ID),
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  onCopy: (cursor) => {
    const targetId = resolveCanvasCopyTarget(cursor.focusId);
    if (!targetId) return [];
    return sidebarCollection.copy({ ids: [targetId] });
  },
  onCut: (cursor) => {
    const targetId = resolveCanvasCopyTarget(cursor.focusId);
    if (!targetId) return [];
    return sidebarCollection.cut({ ids: [targetId], focusId: targetId });
  },
  onPaste: (cursor) => {
    const collections = buildCanvasCollections();
    // Read clipboard data for type-checking (imported from createCollectionZone)
    const clipData = _getClipboardPreview();
    if (!clipData) return [];

    const bubbleResult = findAcceptingCollection(
      cursor.focusId,
      clipData,
      collections,
    );
    if (!bubbleResult) return []; // No collection accepts → no-op

    // Tree-aware paste: sidebarCollection.paste handles insertChild
    const targetId = resolveCanvasCopyTarget(cursor.focusId);
    return sidebarCollection.paste({ afterId: targetId ?? "" });
  },
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

/**
 * createFieldCommit — Section-aware FieldCommandFactory.
 *
 * Usage in NCP blocks:
 *   <Field.Editable onCommit={createFieldCommit(sectionId, "title")} ... />
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
    (s) => s.data.blocks.find((b) => b.id === sectionId)?.fields ?? {},
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
  sections: Block[],
): { section: Block; field: string } | null {
  // Match the longest block id prefix
  let best: Block | null = null;
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
    const addr = resolveFieldAddress(domId, s.data.blocks);
    if (!addr) return "";
    return addr.section.fields[addr.field] ?? "";
  }) as unknown as string;
}

/**
 * updateFieldByDomId — Write a field value using DOM element id.
 * Resolves domId → { section, field } inside the handler (ctx.state).
 * Used by PropertiesPanel's imperative onChange handlers.
 */
export const updateFieldByDomId = canvasZone.command(
  "updateFieldByDomId",
  (ctx, payload: { domId: string; value: string }) => {
    const addr = resolveFieldAddress(payload.domId, ctx.state.data.blocks);
    if (!addr) return undefined;
    return {
      state: produce(ctx.state, (draft) => {
        const section = draft.data.blocks.find(
          (s) => s.id === addr.section.id,
        );
        if (section) section.fields[addr.field] = payload.value;
      }),
    };
  },
);
