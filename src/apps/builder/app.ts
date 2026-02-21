/**
 * Builder App v5 — defineApp native (createZone + bind).
 *
 * Block-scoped field model: each Block owns its fields.
 * Container blocks (tabs, accordion) have children.
 * Paste = structuredClone(block) + new id. No prefix convention needed.
 *
 * Structure:
 *   BuilderApp (defineApp)
 *     └── Zones:
 *         ├── sidebar — collection CRUD + clipboard
 *         └── canvas — grid (updateField)
 */

import { produce } from "immer";
import {
  type CollectionNode,
  findAcceptingCollection,
} from "@/os/collection/pasteBubbling";
import { defineApp } from "@/os/defineApp";
import { os } from "@/os/kernel";
import type { FieldCommandFactory } from "@/os/schemas/command/BaseCommand";
import {
  type Block,
  type BuilderState,
  INITIAL_STATE,
  type PropertyType,
  findBlockInfo,
} from "./model/appState";
export type { Block, BuilderState, PropertyType };
export { INITIAL_STATE, findBlockInfo };

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
// Undo / Redo — generic factory (defineApp.undoRedo.ts)
// ═══════════════════════════════════════════════════════════════════

import { createUndoRedoCommands } from "@/os/defineApp.undoRedo";

export const { canUndo, canRedo, undoCommand, redoCommand } =
  createUndoRedoCommands(BuilderApp);

// ═══════════════════════════════════════════════════════════════════
// Sidebar Zone — Collection Zone Facade
// ═══════════════════════════════════════════════════════════════════

import { OS_EXPAND } from "@/os/3-commands/expand/index";
import { createCollectionZone } from "@/os/collection/createCollectionZone";

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

const CANVAS_ZONE_ID = "canvas";

/** Shared collection config — same data accessor for sidebar and canvas */
const collectionConfig = {
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
};

export const sidebarCollection = createCollectionZone(
  BuilderApp,
  "sidebar",
  collectionConfig,
);

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

/** Add a block from a preset template. Deep clones with unique IDs. */
export const addBlock = sidebarCollection.command(
  "addBlock",
  (ctx, payload: { block: Block; afterId?: string }) => {
    const uid = () =>
      `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newBlock = deepCloneBlock(payload.block, uid());
    return {
      state: produce(ctx.state, (draft) => {
        if (payload.afterId) {
          const idx = draft.data.blocks.findIndex(
            (b) => b.id === payload.afterId,
          );
          draft.data.blocks.splice(idx + 1, 0, newBlock);
        } else {
          draft.data.blocks.push(newBlock);
        }
      }),
    };
  },
);

/** Replace all blocks with a page preset. */
export const loadPagePreset = sidebarCollection.command(
  "loadPagePreset",
  (ctx, payload: { blocks: Block[] }) => {
    const uid = () =>
      `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const cloned = payload.blocks.map((b) => deepCloneBlock(b, uid()));
    return {
      state: produce(ctx.state, (draft) => {
        draft.data.blocks = cloned;
        draft.history.past = [];
        draft.history.future = [];
      }),
    };
  },
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
// Canvas Zone — own collection (same data accessor, own focus scope)
// ═══════════════════════════════════════════════════════════════════

const canvasCollection = createCollectionZone(
  BuilderApp,
  CANVAS_ZONE_ID,
  collectionConfig,
);

/**
 * updateField — 섹션 필드 값 변경.
 * sectionId + field (local key) 로 대상 식별.
 */
export const updateField = canvasCollection.command(
  "updateField",
  (ctx, payload: { sectionId: string; field: string; value: string }) => ({
    state: produce(ctx.state, (draft) => {
      let target: Block | null = null;
      function traverse(blocks: Block[]) {
        for (const b of blocks) {
          if (b.id === payload.sectionId) {
            target = b as Block;
            return;
          }
          if (b.children) traverse(b.children);
        }
      }
      traverse(draft.data.blocks as Block[]);
      if (target) {
        (target as Block).fields[payload.field] = payload.value;
      }
    }),
  }),
);

// Zone binding — hierarchical navigation (section/group/item)
import {
  createCanvasItemFilter,
  createDrillDown,
  createDrillUp,
} from "@/apps/builder/features/hierarchicalNavigation";

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
      containsItem: (itemId: string) => blocks.some((b) => b.id === itemId),
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

/**
 * Check if focusId is a dynamic collection item (section/card/tab)
 * vs a static field item (title, icon, etc.)
 */
function isDynamicItem(focusId: string): boolean {
  const blocks = getBuilderState().data.blocks;
  // Root block
  if (blocks.some((b) => b.id === focusId)) return true;
  // Child of container
  for (const block of blocks) {
    if (block.children?.some((c) => c.id === focusId)) return true;
    if (block.children) {
      for (const child of block.children) {
        if (child.children?.some((gc) => gc.id === focusId)) return true;
      }
    }
  }
  return false;
}

/** Read field text value for a static item (e.g., "ncp-hero-title" → field value) */
function getStaticItemTextValue(focusId: string): string | null {
  const blocks = getBuilderState().data.blocks;
  const addr = resolveFieldAddress(focusId, blocks);
  if (!addr) return null;
  return addr.section.fields[addr.field] ?? null;
}

export const canvasOnCopy = (
  cursor: import("@/os/2-contexts/zoneRegistry").ZoneCursor,
) => {
  if (isDynamicItem(cursor.focusId)) {
    // Dynamic item → structural copy (section/card/tab)
    return canvasCollection.copy({ ids: [cursor.focusId] });
  }
  // Static item → copy field text value via OS clipboard write
  const text = getStaticItemTextValue(cursor.focusId);
  if (text) {
    canvasCollection.copyText(text);
    return { clipboardWrite: { text } };
  }
  return [];
};

export const canvasOnCut = (
  cursor: import("@/os/2-contexts/zoneRegistry").ZoneCursor,
) => {
  if (!isDynamicItem(cursor.focusId)) {
    // Static item → cut not allowed (PRD 1.3)
    return [];
  }
  return canvasCollection.cut({
    ids: [cursor.focusId],
    focusId: cursor.focusId,
  });
};

export const canvasOnPaste = (
  cursor: import("@/os/2-contexts/zoneRegistry").ZoneCursor,
) => {
  const collections = buildCanvasCollections();
  const clipData = canvasCollection.readClipboard();
  if (!clipData) return [];

  // Static item text paste handling
  if (
    (clipData as { type?: string }).type === "text" &&
    !isDynamicItem(cursor.focusId)
  ) {
    return [
      updateFieldByDomId({
        domId: cursor.focusId,
        value: (clipData as { value: string }).value,
      }),
    ];
  }

  const bubbleResult = findAcceptingCollection(
    cursor.focusId,
    clipData,
    collections,
  );
  if (!bubbleResult) return [];

  const targetId = resolveCanvasCopyTarget(cursor.focusId);
  return canvasCollection.paste({ afterId: targetId ?? "" });
};

// Guard: collection ops only for dynamic items (sections/cards), static fields → no-op
const canvasBindings = canvasCollection.collectionBindings({
  guard: (cursor) => isDynamicItem(cursor.focusId),
});

export const BuilderCanvasUI = canvasCollection.bind({
  role: "grid",
  onAction: createDrillDown(CANVAS_ZONE_ID),
  onUndo: undoCommand(),
  onRedo: redoCommand(),
  ...canvasBindings,
  // Override: static text copy/cut/paste support
  onCopy: canvasOnCopy,
  onCut: canvasOnCut,
  onPaste: canvasOnPaste,
  options: {
    navigate: { orientation: "corner" },
    tab: { behavior: "trap" },
  },
  itemFilter: createCanvasItemFilter(CANVAS_ZONE_ID),
  keybindings: [
    { key: "\\", command: createDrillUp(CANVAS_ZONE_ID) },
    ...canvasBindings.keybindings,
  ],
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
  // Match the longest block id prefix recursively
  let best: Block | null = null;

  function traverse(blocks: Block[]) {
    for (const sec of blocks) {
      if (domId.startsWith(`${sec.id}-`)) {
        if (!best || sec.id.length > best.id.length) best = sec;
      }
      if (sec.children) {
        traverse(sec.children);
      }
    }
  }

  traverse(sections);
  if (!best) return null;
  const bestBlock = best as Block;
  return { section: bestBlock, field: domId.slice(bestBlock.id.length + 1) };
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
export const updateFieldByDomId = canvasCollection.command(
  "updateFieldByDomId",
  (ctx, payload: { domId: string; value: string }) => {
    const addr = resolveFieldAddress(payload.domId, ctx.state.data.blocks);
    if (!addr) return undefined;
    return {
      state: produce(ctx.state, (draft) => {
        let target: Block | null = null;
        function traverse(blocks: Block[]) {
          for (const b of blocks) {
            if (b.id === addr!.section.id) {
              target = b as Block;
              return;
            }
            if (b.children) traverse(b.children);
          }
        }
        traverse(draft.data.blocks as Block[]);
        if (target) {
          (target as Block).fields[addr.field] = payload.value;
        }
      }),
    };
  },
);
