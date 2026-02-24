import {
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  Layout,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BuilderApp,
  BuilderPanelUI,
  renameSectionLabel,
  updateField,
} from "@/apps/builder/app";
import type { Block } from "@/apps/builder/model/appState";
import { getPropertyDef } from "@/apps/builder/model/blockSchemas";
import { useExpanded } from "@/os/5-hooks/useExpanded";
import { useFocusedItem } from "@/os/5-hooks/useFocusedItem";
import { os } from "@/os/kernel";
import { getWidget } from "./widgets/PropertyWidgets";

const CANVAS_ZONE_ID = "canvas";
const PANEL_ZONE_ID = "panel";

// ═══════════════════════════════════════════════════════════════════
// Panel Highlight Context — panel field focus → canvas highlight
//
// Separate from OS focus: edit stays in each context,
// only visual highlight syncs bidirectionally.
// ═══════════════════════════════════════════════════════════════════

const HighlightContext = createContext<{
  highlightedItemId: string | null;
  setHighlightedItemId: (id: string | null) => void;
}>({
  highlightedItemId: null,
  setHighlightedItemId: () => {},
});

// ═══════════════════════════════════════════════════════════════════
// PropertiesPanel — Page Configuration Form (Accordion)
//
// T15: blocks[] → AccordionSection per block
// T16-1: OS Zone/Item for accordion keyboard navigation
// T16-2: Panel field focus → Canvas highlight (bidirectional sync)
// T16-3: Auto-scroll = section header unit only
// ═══════════════════════════════════════════════════════════════════

export function PropertiesPanel() {
  const blocks = BuilderApp.useComputed((s) => s.data.blocks);
  const focusedCanvasId = useFocusedItem(CANVAS_ZONE_ID);

  // All blocks are expandable accordion sections
  const getExpandableItems = useCallback(() => {
    const expandable = new Set<string>();
    function traverse(bs: Block[]) {
      for (const b of bs) {
        expandable.add(b.id);
        if (b.children) traverse(b.children);
      }
    }
    traverse(blocks);
    return expandable;
  }, [blocks]);

  // ── Panel highlight: field focus → canvas highlight ──
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );

  // ── Section header refs for scroll ──
  const headerRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Canvas sync: auto-expand + scroll to section HEADER on canvas focus ──
  useEffect(() => {
    if (!focusedCanvasId) return;

    // Find the block that owns this focused item
    const ownerBlockId = resolveOwnerBlockId(focusedCanvasId, blocks);
    if (!ownerBlockId) return;

    // Expand ancestors via OS_EXPAND
    const ancestors = resolveAncestorIds(ownerBlockId, blocks);
    for (const id of ancestors) {
      os.dispatch({
        type: "OS_EXPAND",
        payload: { itemId: id, zoneId: PANEL_ZONE_ID, action: "expand" },
      });
    }

    // T16-3: Scroll to SECTION HEADER only (not to individual fields)
    requestAnimationFrame(() => {
      const headerEl = headerRefs.current[ownerBlockId];
      if (headerEl) {
        headerEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }, [focusedCanvasId, blocks]);

  const setHeaderRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      headerRefs.current[id] = el;
    },
    [],
  );

  return (
    <HighlightContext.Provider
      value={{ highlightedItemId, setHighlightedItemId }}
    >
      <div className="w-80 border-l border-slate-200 bg-white h-full flex flex-col shadow-xl z-20">
        <PanelActionBar />

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-scroll custom-scrollbar">
          {/* ── Page Meta (hardcoded, always visible) ── */}
          <PageMetaSection />

          {/* ── Block Accordion Tree (OS Zone) — OS auto-provides expand/collapse ── */}
          <BuilderPanelUI.Zone
            className="flex flex-col"
            aria-label="Block Properties"
            getExpandableItems={getExpandableItems}
          >
            <PanelContent
              blocks={blocks}
              focusedCanvasId={focusedCanvasId}
              setHeaderRef={setHeaderRef}
            />
          </BuilderPanelUI.Zone>
        </div>
      </div>
    </HighlightContext.Provider>
  );
}

/** Inner component — child of Zone so useExpanded reads correct context */
function PanelContent({
  blocks,
  focusedCanvasId,
  setHeaderRef,
}: {
  blocks: Block[];
  focusedCanvasId: string | null;
  setHeaderRef: (id: string) => (el: HTMLElement | null) => void;
}) {
  const { isExpanded } = useExpanded();

  return (
    <>
      {blocks.map((block) => (
        <BlockAccordionSection
          key={block.id}
          block={block}
          depth={0}
          focusedCanvasId={focusedCanvasId}
          isExpanded={isExpanded}
          setHeaderRef={setHeaderRef}
        />
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BlockAccordionSection — OS Item + Accordion + Fields Form
// ═══════════════════════════════════════════════════════════════════

function BlockAccordionSection({
  block,
  depth,
  focusedCanvasId,
  isExpanded,
  setHeaderRef,
}: {
  block: Block;
  depth: number;
  focusedCanvasId: string | null;
  isExpanded: (id: string) => boolean;
  setHeaderRef: (id: string) => (el: HTMLElement | null) => void;
}) {
  const expanded = isExpanded(block.id);
  const isActive = focusedCanvasId?.startsWith(block.id) ?? false;
  const isRoot = depth === 0;

  return (
    <>
      <BuilderPanelUI.Item
        id={block.id}
        className="outline-none group focus:outline-none"
      >
        {/* ── Section Header — chevron on RIGHT for keyline preservation ── */}
        <div
          ref={setHeaderRef(block.id)}
          className={`
            w-full flex items-center justify-between px-4 cursor-pointer
            transition-colors
            group-focus:ring-2 group-focus:ring-inset group-focus:ring-indigo-500/40
            ${
              isRoot
                ? `py-2.5 border-t border-slate-200 ${isActive ? "bg-indigo-50" : "bg-slate-50/80"}`
                : `py-2 ${isActive ? "bg-indigo-50/50" : "hover:bg-slate-50"}`
            }
          `}
          style={{ paddingLeft: `${16 + depth * 16}px` }}
        >
          {/* Left: Icon + Label + Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`shrink-0 ${isActive ? "text-indigo-500" : "text-slate-400"}`}
            >
              <Layout size={isRoot ? 14 : 12} />
            </span>
            <span
              className={`
                truncate
                ${isRoot ? "text-[12px] font-bold" : "text-[11px] font-semibold"}
                ${isActive ? "text-indigo-700" : "text-slate-700"}
              `}
            >
              {block.label}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-400 uppercase tracking-wider shrink-0">
              {block.type}
            </span>
          </div>

          {/* Right: Chevron — does not affect left keyline */}
          <span
            className={`shrink-0 ml-2 transition-transform duration-200 ${isActive ? "text-indigo-400" : "text-slate-300"}`}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>
      </BuilderPanelUI.Item>

      {/* ── Content (outside Item — clicks here don't trigger OS_ACTIVATE) ── */}
      {expanded && (
        <div
          className={isRoot ? "bg-white" : "bg-white/50"}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <BlockFieldsForm
            block={block}
            isExpanded={isExpanded}
            setHeaderRef={setHeaderRef}
            focusedCanvasId={focusedCanvasId}
          />
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BlockFieldsForm — Generic field editor for a block's fields
// ═══════════════════════════════════════════════════════════════════

function BlockFieldsForm({
  block,
  isExpanded,
  setHeaderRef,
  focusedCanvasId,
}: {
  block: Block;
  isExpanded: (id: string) => boolean;
  setHeaderRef: (id: string) => (el: HTMLElement | null) => void;
  focusedCanvasId: string | null;
}) {
  const fields = BuilderApp.useComputed((s) => {
    function find(blocks: Block[]): Block | null {
      for (const b of blocks) {
        if (b.id === block.id) return b;
        if (b.children) {
          const r = find(b.children);
          if (r) return r;
        }
      }
      return null;
    }
    return find(s.data.blocks)?.fields ?? {};
  }) as unknown as Record<string, string>;

  const entries = Object.entries(fields);
  const hasContent =
    entries.length > 0 || (block.children && block.children.length > 0);

  if (!hasContent) {
    return (
      <div className="px-4 py-3 text-[11px] text-slate-400 italic">
        No editable fields
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-2.5">
      {/* Section label (editable) */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Section Name
        </label>
        <input
          type="text"
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-medium text-slate-700"
          value={block.label}
          onChange={(e) =>
            os.dispatch(
              renameSectionLabel({ id: block.id, label: e.target.value }),
            )
          }
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-1" />

      {/* Fields */}
      {entries.map(([key, val]) => (
        <FieldInput
          key={key}
          blockId={block.id}
          blockType={block.type}
          fieldKey={key}
          value={val}
        />
      ))}

      {/* Children as inline card fields — same label pattern */}
      {block.children && block.children.length > 0 && (
        <>
          <div className="border-t border-slate-100 my-1" />
          <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Items ({block.children.length})
          </label>
          <div className="space-y-1.5">
            {block.children.map((child, i) => (
              <ChildCardField
                key={child.id}
                child={child}
                index={i}
                isExpanded={isExpanded}
                setHeaderRef={setHeaderRef}
                focusedCanvasId={focusedCanvasId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ChildCardField — Inline expandable card within parent form
// Same label style as regular fields, compact preview as widget
// ═══════════════════════════════════════════════════════════════════

function ChildCardField({
  child,
  index,
  isExpanded,
  setHeaderRef,
  focusedCanvasId,
}: {
  child: Block;
  index: number;
  isExpanded: (id: string) => boolean;
  setHeaderRef: (id: string) => (el: HTMLElement | null) => void;
  focusedCanvasId: string | null;
}) {
  const expanded = isExpanded(child.id);
  const isActive = focusedCanvasId?.startsWith(child.id) ?? false;

  // Use item-title field if available, otherwise label
  const title = child.fields?.["item-title"] || child.label;
  const badge = child.fields?.["badge"];

  return (
    <>
      <BuilderPanelUI.Item
        id={child.id}
        className="outline-none group focus:outline-none"
      >
        {/* Card preview row — clickable, same keyline as form labels */}
        <div
          ref={setHeaderRef(child.id)}
          className={`
            flex items-center justify-between px-2 py-2 rounded-md cursor-pointer
            border transition-colors
            group-focus:ring-2 group-focus:ring-indigo-500/40
            ${
              isActive
                ? "border-indigo-200 bg-indigo-50/50"
                : expanded
                  ? "border-slate-200 bg-slate-50/50"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
            }
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-slate-400 font-mono w-4 shrink-0">
              {index + 1}
            </span>
            <span
              className={`text-[12px] truncate ${isActive ? "text-indigo-700 font-semibold" : "text-slate-700 font-medium"}`}
            >
              {title}
            </span>
            {badge && (
              <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-indigo-100 text-indigo-500 uppercase tracking-wider shrink-0">
                {badge}
              </span>
            )}
          </div>
          <span
            className={`shrink-0 ml-1 ${isActive ? "text-indigo-400" : "text-slate-300"}`}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        </div>
      </BuilderPanelUI.Item>

      {/* Expanded: inline form fields (outside Item) */}
      {expanded && (
        <div
          className="pl-6 pr-1 py-2 space-y-2"
          onKeyDown={(e) => e.stopPropagation()}
        >
          {Object.entries(child.fields ?? {}).map(([key, val]) => (
            <FieldInput
              key={key}
              blockId={child.id}
              blockType={child.type}
              fieldKey={key}
              value={val as string}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FieldInput — Schema-driven field editor (OCP)
// Reads PropertyDef from Block Schema → dispatches to Widget Registry.
// No if/else branching. New type = new widget, nothing changes here.
// ═══════════════════════════════════════════════════════════════════

function FieldInput({
  blockId,
  blockType,
  fieldKey,
  value,
}: {
  blockId: string;
  blockType: string;
  fieldKey: string;
  value: string;
}) {
  const { setHighlightedItemId } = useContext(HighlightContext);

  const handleChange = (newValue: string) => {
    os.dispatch(
      updateField({ sectionId: blockId, field: fieldKey, value: newValue }),
    );
  };

  const domItemId = `${blockId}-${fieldKey}`;
  const handleFocus = () => setHighlightedItemId(domItemId);
  const handleBlur = () => setHighlightedItemId(null);

  // Schema-driven: block type + field key → property definition
  const def = getPropertyDef(blockType, fieldKey);
  const Widget = getWidget(def.type);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-slate-500 font-medium tracking-wide">
        {def.label}
      </label>
      <Widget
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        def={def}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PageMetaSection — Hardcoded top section (slug, description, keywords)
// ═══════════════════════════════════════════════════════════════════

function PageMetaSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {/* Header — same pattern as block section headers */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors border-t border-slate-200 bg-slate-50/80 hover:bg-slate-100/60"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-400 shrink-0">
            <FileText size={14} />
          </span>
          <span className="text-[12px] font-bold text-slate-700">
            Page Settings
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-400 uppercase tracking-wider shrink-0">
            SEO
          </span>
        </div>
        <span className="shrink-0 ml-2 text-slate-300">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {/* Meta Fields */}
      {expanded && (
        <div className="px-4 py-3 space-y-2.5 bg-white">
          <MetaInput
            label="Page Title"
            placeholder="Landing Page"
            defaultValue="AI 시대를 위한 가장 완벽한 플랫폼"
          />
          <MetaInput
            label="Slug"
            placeholder="/landing"
            defaultValue="/landing"
            icon={<Globe size={12} />}
          />
          <MetaTextarea
            label="Meta Description"
            placeholder="A brief description of the page for search engines..."
            defaultValue="네이버클라우드의 기술력으로 완성된 하이퍼스케일 AI 스튜디오를 경험하세요."
          />
          <MetaInput
            label="Keywords"
            placeholder="cloud, AI, platform"
            defaultValue="cloud, AI, platform, naver"
          />
        </div>
      )}
    </div>
  );
}

function MetaInput({
  label,
  placeholder,
  defaultValue,
  icon,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  icon?: React.ReactNode;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          type="text"
          className={`w-full py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-700 ${icon ? "pl-7 pr-2" : "px-2"}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function MetaTextarea({
  label,
  placeholder,
  defaultValue,
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        {label}
      </label>
      <textarea
        className="w-full px-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 min-h-[48px] resize-y text-slate-700 leading-relaxed"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PanelActionBar — Preview + Publish buttons
// ═══════════════════════════════════════════════════════════════════

function PanelActionBar() {
  return (
    <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-end gap-1.5 shrink-0">
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-[12px] font-medium transition-all rounded-lg hover:bg-slate-100"
      >
        <Eye size={14} />
        Preview
      </button>
      <button
        type="button"
        className="px-3.5 py-1.5 bg-violet-600 text-white text-[12px] font-bold rounded-lg hover:bg-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-violet-600/20"
      >
        Publish
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helpers — Resolve block ownership from focusedId
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve which top-level (or child) block "owns" a given focusedId.
 */
function resolveOwnerBlockId(
  focusedId: string,
  blocks: Block[],
): string | null {
  for (const block of blocks) {
    if (block.id === focusedId) return block.id;
    if (block.children) {
      const childResult = resolveOwnerBlockId(focusedId, block.children);
      if (childResult) return childResult;
    }
  }
  const allBlocks = flattenAllBlocks(blocks);
  const sorted = allBlocks
    .filter((b) => focusedId.startsWith(b.id))
    .sort((a, b) => b.id.length - a.id.length);
  return sorted[0]?.id ?? null;
}

/**
 * Resolve all ancestor block IDs for a given block ID.
 */
function resolveAncestorIds(blockId: string, blocks: Block[]): string[] {
  const result: string[] = [];
  function traverse(list: Block[], path: string[]): boolean {
    for (const block of list) {
      if (block.id === blockId) {
        result.push(...path, block.id);
        return true;
      }
      if (block.children) {
        if (traverse(block.children, [...path, block.id])) return true;
      }
    }
    return false;
  }
  traverse(blocks, []);
  return result;
}

function flattenAllBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];
  for (const b of blocks) {
    result.push(b);
    if (b.children) result.push(...flattenAllBlocks(b.children));
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════

export { HighlightContext };
