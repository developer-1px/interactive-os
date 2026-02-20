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

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type PropertyType =
  | "text"
  | "image"
  | "icon"
  | "link"
  | "button"
  | "section"
  | null;

export interface SectionEntry {
  id: string;
  label: string;
  /** Component type for rendering */
  type: "hero" | "news" | "services" | "footer";
  /** Co-located field data — each section owns its fields */
  fields: Record<string, string>;
}

interface HistoryEntry {
  command: { type: string; payload?: unknown };
  timestamp: number;
  snapshot?: Record<string, unknown>;
  groupId?: string;
  focusedItemId?: string | number;
}

export interface BuilderState {
  data: {
    /** Ordered section list — each section owns its fields */
    sections: SectionEntry[];
  };
  ui: {
    /** 현재 선택된 요소의 builder ID */
    selectedId: string | null;
    /** 선택된 요소의 프로퍼티 타입 */
    selectedType: PropertyType;
    /** 사이드바 섹션 클립보드 */
    clipboard: { items: SectionEntry[]; isCut: boolean } | null;
  };
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// Initial State — NCP 블록들의 편집 가능한 필드 초기값
// ═══════════════════════════════════════════════════════════════════

export const INITIAL_STATE: BuilderState = {
  data: {
    sections: [
      {
        id: "ncp-hero",
        label: "Hero",
        type: "hero",
        fields: {
          title: "AI 시대를 위한\n가장 완벽한 플랫폼",
          sub: "네이버클라우드의 기술력으로 완성된\n하이퍼스케일 AI 스튜디오를 경험하세요.",
          brand: "NAVER CLOUD",
          cta: "무료로 시작하기",
          "portal-title": "Global Scale",
          "portal-subtitle": "Hyper-connected infrastructure",
        },
      },
      {
        id: "ncp-news",
        label: "News",
        type: "news",
        fields: {
          title: "네이버클라우드의\n새로운 소식",
          "item-1-title": "Cloud DB for Cache\nRedis 호환성 강화",
          "item-1-desc":
            "Valkey 기반의 인메모리 캐시 서비스를 이제 클라우드에서 만나보세요.",
          "item-1-date": "2024.03.15",
          "item-2-title": "하이퍼클로바X\n기업용 솔루션 공개",
          "item-2-date": "2024.03.10",
          "item-3-title": "AI RUSH 2024\n개발자 컨퍼런스",
          "item-3-date": "2024.03.01",
        },
      },
      {
        id: "ncp-services",
        label: "Services",
        type: "services",
        fields: {
          category: "Service Category",
          title: "비즈니스에 최적화된\n클라우드 서비스",
          "item-title-0": "Server",
          "item-desc-0":
            "고성능 클라우드 서버 인프라를 \n몇 번의 클릭으로 구축하세요.",
          "item-title-1": "Cloud DB for Cache",
          "item-desc-1": "Valkey 기반의 완전 관리형 \n인메모리 캐시 서비스.",
          "item-title-2": "CLOVA Speech",
          "item-desc-2": "비즈니스 환경에 특화된 \n최고 수준의 음성 인식 기술.",
          "item-title-3": "Data Stream",
          "item-desc-3":
            "대용량 데이터의 실시간 수집과 \n처리를 위한 파이프라인.",
          "item-title-4": "Global CDN",
          "item-desc-4": "전 세계 사용자에게 빠르고 \n안정적인 콘텐츠 전송.",
          "item-title-5": "Kubernetes",
          "item-desc-5": "컨테이너화된 애플리케이션의 \n자동화된 배포 및 관리.",
        },
      },
      {
        id: "ncp-footer",
        label: "Footer",
        type: "footer",
        fields: {
          brand: "NAVER CLOUD",
          desc: "네이버클라우드는 기업의 비즈니스 혁신을 위한\n최적의 클라우드 서비스를 제공합니다.",
          copyright: `© ${new Date().getFullYear()} NAVER Cloud Corp. All rights reserved.`,
        },
      },
    ],
  },
  ui: {
    selectedId: null,
    selectedType: null,
    clipboard: null,
  },
  history: {
    past: [],
    future: [],
  },
};

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
/**
 * allFields — Flat view of all section fields (sectionId + "-" + key → value).
 * Used by PropertiesPanel for generic field lookup by DOM element id.
 */
export const allFields = BuilderApp.selector("allFields", (s) => {
  const result: Record<string, string> = {};
  for (const sec of s.data.sections) {
    for (const [k, v] of Object.entries(sec.fields)) {
      result[`${sec.id}-${k}`] = v;
    }
  }
  return result;
});

// ═══════════════════════════════════════════════════════════════════
// Conditions
// ═══════════════════════════════════════════════════════════════════

export const canUndo = BuilderApp.condition(
  "canUndo",
  (s) => (s.history?.past?.length ?? 0) > 0,
);

export const canRedo = BuilderApp.condition(
  "canRedo",
  (s) => (s.history?.future?.length ?? 0) > 0,
);

// ═══════════════════════════════════════════════════════════════════
// Undo / Redo commands
// ═══════════════════════════════════════════════════════════════════

export const undoCommand = BuilderApp.command(
  "undo",
  (ctx) => {
    const past = ctx.state.history.past;
    if (past.length === 0) return { state: ctx.state };

    const lastEntry = past.at(-1)!;
    const groupId = lastEntry.groupId;

    let entriesToPop = 1;
    if (groupId) {
      entriesToPop = 0;
      for (let i = past.length - 1; i >= 0; i--) {
        if (past[i]?.groupId === groupId) entriesToPop++;
        else break;
      }
    }

    const earliestEntry = past[past.length - entriesToPop]!;
    const snap = earliestEntry.snapshot;

    return {
      state: produce(ctx.state, (draft) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { history: _h, ...rest } = ctx.state;
        const entry: HistoryEntry = {
          command: { type: "UNDO_SNAPSHOT" },
          timestamp: Date.now(),
          snapshot: rest as Record<string, unknown>,
        };
        if (groupId) entry.groupId = groupId;
        draft.history.future.push(entry);
        for (let i = 0; i < entriesToPop; i++) {
          draft.history.past.pop();
        }
        if (snap) {
          if (snap["data"]) draft.data = snap["data"] as typeof draft.data;
          if (snap["ui"]) draft.ui = snap["ui"] as typeof draft.ui;
        }
      }),
    };
  },
  { when: canUndo },
);

export const redoCommand = BuilderApp.command(
  "redo",
  (ctx) => {
    const future = ctx.state.history.future;
    if (future.length === 0) return { state: ctx.state };

    const entry = future.at(-1)!;
    return {
      state: produce(ctx.state, (draft) => {
        draft.history.future.pop();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { history: _, ...rest } = ctx.state;
        draft.history.past.push({
          command: { type: "REDO_SNAPSHOT" },
          timestamp: Date.now(),
          snapshot: rest as Record<string, unknown>,
        });
        if (entry.snapshot) {
          if (entry.snapshot["data"])
            draft.data = entry.snapshot["data"] as typeof draft.data;
          if (entry.snapshot["ui"])
            draft.ui = entry.snapshot["ui"] as typeof draft.ui;
        }
      }),
    };
  },
  { when: canRedo },
);

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
 * builderUpdateField — Imperative helper for PropertiesPanel.
 */
export function builderUpdateField(
  sectionId: string,
  field: string,
  value: string,
) {
  kernel.dispatch(updateField({ sectionId, field, value }));
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
 * resolveFieldAddress — DOM element id → { sectionId, field }.
 *
 * Given "ncp-hero-title", finds section "ncp-hero" and returns
 * { sectionId: "ncp-hero", field: "title" }.
 * Returns null if no matching section is found.
 */
export function resolveFieldAddress(
  domId: string,
  sections: SectionEntry[],
): { sectionId: string; field: string } | null {
  // Match the longest section id prefix
  let best: SectionEntry | null = null;
  for (const sec of sections) {
    if (domId.startsWith(`${sec.id}-`)) {
      if (!best || sec.id.length > best.id.length) best = sec;
    }
  }
  if (!best) return null;
  return { sectionId: best.id, field: domId.slice(best.id.length + 1) };
}

/**
 * useFieldByDomId — Read a field value using its DOM element id.
 * Used by PropertiesPanel where fieldName = DOM id.
 */
export function useFieldByDomId(domId: string): string {
  return BuilderApp.useComputed((s) => {
    const addr = resolveFieldAddress(domId, s.data.sections);
    if (!addr) return "";
    const sec = s.data.sections.find((sec) => sec.id === addr.sectionId);
    return sec?.fields[addr.field] ?? "";
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
    updateField({ sectionId: addr.sectionId, field: addr.field, value }),
  );
}
