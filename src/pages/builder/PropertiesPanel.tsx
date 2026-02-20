import {
  Bookmark,
  Image as ImageIcon,
  Layout,
  Link as LinkIcon,
  MousePointer2,
  Columns,
  Square,
  Minus,
  Type,
} from "lucide-react";
import {
  BuilderApp,
  type PropertyType,
  renameSectionLabel,
  resolveFieldAddress,
  updateField,
  updateFieldByDomId,
  useFieldByDomId,
} from "@/apps/builder/app";
import { os } from "@/os/kernel";
import { useFocusedItem } from "@/os/5-hooks/useFocusedItem";
import { getItemAttribute } from "@/os/2-contexts/itemQueries";
import type { Block } from "@/apps/builder/model/appState";

const CANVAS_ZONE_ID = "canvas";

/**
 * Non-null property type for resolved elements.
 * Falls back to "text" for items without explicit data-builder-type.
 */
type ResolvedPropertyType = NonNullable<PropertyType>;

/**
 * Resolve the parent block + field key for a focused DOM item.
 * The focusedId is the DOM element id. resolveFieldAddress parses it
 * into { section (the owning Block), field (the field key) }.
 */
function useResolvedField(focusedId: string) {
  return BuilderApp.useComputed((s) => {
    const addr = resolveFieldAddress(focusedId, s.data.blocks);
    if (!addr) return null;
    return {
      block: addr.section,
      fieldKey: addr.field,
    };
  });
}

/**
 * PropertiesPanel
 *
 * Visual CMS / Web Builder - Right Sidebar
 * Reads selected element and field data from BuilderApp state.
 * Writes field changes via updateFieldByDomId / updateField.
 */
export function PropertiesPanel() {
  const focusedId = useFocusedItem(CANVAS_ZONE_ID);
  const rawType = focusedId
    ? (getItemAttribute(CANVAS_ZONE_ID, focusedId, "data-builder-type") as PropertyType)
    : null;

  // Normalize: null/undefined → "text" (plain Field.Editable with no data-builder-type)
  const selectedType: ResolvedPropertyType | null = focusedId
    ? rawType ?? "text"
    : null;

  if (!focusedId || !selectedType) {
    return (
      <div className="w-80 border-l border-slate-200 bg-white h-full flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Layout size={32} />
        </div>
        <p className="text-sm font-medium">Select an element to edit</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-slate-200 bg-white h-full flex flex-col shadow-xl z-20">
      {/* Header Title */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-white">
        <div className="p-1.5 bg-slate-100 rounded text-slate-500">
          {getIconForType(selectedType)}
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 text-sm capitalize">
            {selectedType} Properties
          </h2>
          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
            {focusedId}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {selectedType === "text" && <TextProperties fieldName={focusedId} />}
        {selectedType === "image" && <ImageProperties fieldName={focusedId} />}
        {selectedType === "icon" && <IconProperties fieldName={focusedId} />}
        {selectedType === "link" && <LinkProperties fieldName={focusedId} />}
        {selectedType === "button" && <ButtonProperties fieldName={focusedId} />}
        {selectedType === "badge" && <BadgeProperties fieldName={focusedId} />}
        {selectedType === "section" && <SectionProperties fieldName={focusedId} />}
        {selectedType === "divider" && <DividerProperties fieldName={focusedId} />}
        {selectedType === "tabs" && <TabsProperties fieldName={focusedId} />}
      </div>
    </div>
  );
}

function getIconForType(type: ResolvedPropertyType) {
  switch (type) {
    case "text":
      return <Type size={16} />;
    case "image":
      return <ImageIcon size={16} />;
    case "icon":
      return <Square size={16} />;
    case "link":
      return <LinkIcon size={16} />;
    case "button":
      return <MousePointer2 size={16} />;
    case "badge":
      return <Bookmark size={16} />;
    case "section":
      return <Layout size={16} />;
    case "divider":
      return <Minus size={16} />;
    case "tabs":
      return <Columns size={16} />;
    default:
      return <Type size={16} />;
  }
}

/* -------------------------------------------------------------------------------------------------
 * Live-Bound Forms — reads/writes BuilderApp state
 * ------------------------------------------------------------------------------------------------- */

function TextProperties({ fieldName }: { fieldName: string }) {
  const value = useFieldByDomId(fieldName);

  return (
    <div className="space-y-6">
      <FormGroup label="Content">
        <textarea
          className="w-full p-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-h-[80px] resize-y"
          value={value}
          onChange={(e) => os.dispatch(updateFieldByDomId({ domId: fieldName, value: e.target.value }))}
        />
        <p className="text-[10px] text-slate-400 mt-1.5">
          Edit the text content. Changes apply to canvas in real-time.
        </p>
      </FormGroup>
    </div>
  );
}

function ImageProperties({ fieldName }: { fieldName: string }) {
  const resolved = useResolvedField(fieldName);
  const block = resolved?.block ?? null;
  const fieldKey = resolved?.fieldKey ?? "";

  // Image fields in the block
  const src = block?.fields[fieldKey] ?? "";
  const altKey = fieldKey.replace(/-?img$/, "") + "-alt";
  const alt = block?.fields[altKey] ?? "";

  const dispatchField = (key: string, value: string) => {
    if (!block) return;
    os.dispatch(updateField({ sectionId: block.id, field: key, value }));
  };

  return (
    <div className="space-y-6">
      <FormGroup label="Preview">
        <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center mb-3 overflow-hidden relative group">
          {src ? (
            <img
              src={src}
              alt={alt || "Preview"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-300 text-sm">No image</div>
          )}
        </div>
      </FormGroup>

      <FormGroup label="Source">
        <LiveInput
          label="Image URL"
          value={src}
          onChange={(v) => dispatchField(fieldKey, v)}
          placeholder="https://..."
        />
        <div className="mt-3">
          <LiveInput
            label="Alt Text"
            value={alt}
            onChange={(v) => dispatchField(altKey, v)}
            placeholder="Describe the image"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Important for accessibility and SEO.
          </p>
        </div>
      </FormGroup>
    </div>
  );
}

function IconProperties({ fieldName }: { fieldName: string }) {
  const resolved = useResolvedField(fieldName);
  const block = resolved?.block ?? null;
  const fieldKey = resolved?.fieldKey ?? "";

  // Icon data lives in the owning block's fields.
  // For service cards: Block.fields["icon"] = "Server"
  // For standalone icons: the fieldKey IS the icon field key
  // We detect which fields exist in the block
  const iconFieldKey = block?.fields["icon"] !== undefined ? "icon" : fieldKey;
  const currentIcon = block?.fields[iconFieldKey] ?? "";

  // Try common label field patterns
  const labelFieldKey = block?.fields["label"] !== undefined
    ? "label"
    : block?.fields[`${fieldKey}-label`] !== undefined
      ? `${fieldKey}-label`
      : null;
  const currentLabel = labelFieldKey ? (block?.fields[labelFieldKey] ?? "") : "";

  const ICON_OPTIONS = [
    "ArrowRight", "Check", "Star", "Heart", "Mail", "Phone",
    "Globe", "Shield", "Server", "Database", "Brain", "Layers",
    "Box", "Cpu",
  ];

  const dispatchField = (key: string, value: string) => {
    if (!block) return;
    os.dispatch(updateField({ sectionId: block.id, field: key, value }));
  };

  return (
    <div className="space-y-6">
      <FormGroup label="Icon Selection">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {ICON_OPTIONS.map((name) => (
            <button
              type="button"
              key={name}
              className={`aspect-square rounded-md border flex items-center justify-center cursor-pointer hover:bg-slate-50 text-xs ${currentIcon === name
                ? "border-violet-500 bg-violet-50 text-violet-600"
                : "border-slate-200 text-slate-400"
                }`}
              onClick={() => dispatchField(iconFieldKey, name)}
              title={name}
            >
              {name.slice(0, 2)}
            </button>
          ))}
        </div>
        <LiveInput
          label="Icon Name"
          value={currentIcon}
          onChange={(v) => dispatchField(iconFieldKey, v)}
          placeholder="Search icon..."
        />
      </FormGroup>

      {/* Block info */}
      <FormGroup label="Context">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Block</span>
            <span className="font-mono">{block?.id ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Field</span>
            <span className="font-mono">{iconFieldKey}</span>
          </div>
        </div>
      </FormGroup>

      {labelFieldKey && (
        <FormGroup label="Accessibility">
          <LiveInput
            label="Label"
            value={currentLabel}
            onChange={(v) => dispatchField(labelFieldKey, v)}
            placeholder="Leave empty if decorative"
          />
        </FormGroup>
      )}
    </div>
  );
}

function LinkProperties({ fieldName }: { fieldName: string }) {
  const value = useFieldByDomId(fieldName);
  const resolved = useResolvedField(fieldName);
  const block = resolved?.block ?? null;
  const fieldKey = resolved?.fieldKey ?? "";

  // Derive href field key: "link" → "link-href", "all" → "all-href"
  const hrefFieldKey = `${fieldKey}-href`;
  const hrefValue = block?.fields[hrefFieldKey] ?? "";

  const dispatchField = (key: string, value: string) => {
    if (!block) return;
    os.dispatch(updateField({ sectionId: block.id, field: key, value }));
  };

  return (
    <div className="space-y-6">
      <FormGroup label="Link Text">
        <textarea
          className="w-full p-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-h-[40px] resize-y"
          value={value}
          onChange={(e) => os.dispatch(updateFieldByDomId({ domId: fieldName, value: e.target.value }))}
        />
      </FormGroup>

      <FormGroup label="URL">
        <LiveInput
          label="Href"
          value={hrefValue}
          onChange={(v) => dispatchField(hrefFieldKey, v)}
          placeholder="https://..."
        />
        <p className="text-[10px] text-slate-400 mt-1.5">
          The link destination URL. Leave empty for # anchor.
        </p>
      </FormGroup>

      <FormGroup label="Context">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Block</span>
            <span className="font-mono">{block?.id ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Field</span>
            <span className="font-mono">{fieldKey || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Type</span>
            <span className="font-mono">{block?.type ?? "—"}</span>
          </div>
        </div>
      </FormGroup>
    </div>
  );
}

function ButtonProperties({ fieldName }: { fieldName: string }) {
  const value = useFieldByDomId(fieldName);
  const resolved = useResolvedField(fieldName);
  const block = resolved?.block ?? null;
  const fieldKey = resolved?.fieldKey ?? "";

  // Read current variant from DOM attribute
  const currentVariant = getItemAttribute(CANVAS_ZONE_ID, fieldName, "data-variant") ?? "primary";

  // Derive href field key for button links
  const hrefFieldKey = `${fieldKey}-href`;
  const hrefValue = block?.fields[hrefFieldKey] ?? "";

  const VARIANT_OPTIONS: { value: string; label: string; preview: string }[] = [
    { value: "primary", label: "Primary", preview: "bg-slate-900 text-white" },
    { value: "secondary", label: "Secondary", preview: "bg-slate-100 text-slate-900" },
    { value: "ghost", label: "Ghost", preview: "bg-transparent text-slate-600 border border-slate-200" },
    { value: "outline", label: "Outline", preview: "bg-transparent text-slate-900 border-2 border-slate-900" },
  ];

  const dispatchField = (key: string, value: string) => {
    if (!block) return;
    os.dispatch(updateField({ sectionId: block.id, field: key, value }));
  };

  return (
    <div className="space-y-6">
      <FormGroup label="Button Label">
        <input
          type="text"
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          value={value}
          onChange={(e) => os.dispatch(updateFieldByDomId({ domId: fieldName, value: e.target.value }))}
        />
      </FormGroup>

      <FormGroup label="Variant">
        <div className="grid grid-cols-2 gap-2">
          {VARIANT_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`px-3 py-2 rounded-md text-xs font-bold transition-all ${currentVariant === opt.value
                  ? "ring-2 ring-violet-500 ring-offset-1"
                  : "hover:bg-slate-50"
                }`}
              onClick={() => dispatchField(`${fieldKey}-variant`, opt.value)}
            >
              <div className={`w-full h-5 rounded mb-1.5 ${opt.preview}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </FormGroup>

      <FormGroup label="Action URL">
        <LiveInput
          label="Href"
          value={hrefValue}
          onChange={(v) => dispatchField(hrefFieldKey, v)}
          placeholder="https://..."
        />
        <p className="text-[10px] text-slate-400 mt-1.5">
          URL to navigate when clicked. Leave empty for no action.
        </p>
      </FormGroup>

      <FormGroup label="Context">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Block</span>
            <span className="font-mono">{block?.id ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Field</span>
            <span className="font-mono">{fieldKey || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Type</span>
            <span className="font-mono">{block?.type ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Variant</span>
            <span className="font-mono">{currentVariant}</span>
          </div>
        </div>
      </FormGroup>
    </div>
  );
}

function BadgeProperties({ fieldName }: { fieldName: string }) {
  const value = useFieldByDomId(fieldName);
  const resolved = useResolvedField(fieldName);
  const block = resolved?.block ?? null;

  return (
    <div className="space-y-6">
      <FormGroup label="Badge Text">
        <input
          type="text"
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          value={value}
          onChange={(e) => os.dispatch(updateFieldByDomId({ domId: fieldName, value: e.target.value }))}
        />
        <p className="text-[10px] text-slate-400 mt-1.5">
          Short label text, typically uppercase.
        </p>
      </FormGroup>

      <FormGroup label="Context">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Block</span>
            <span className="font-mono">{block?.id ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Type</span>
            <span className="font-mono">{block?.type ?? "—"}</span>
          </div>
        </div>
      </FormGroup>
    </div>
  );
}

function SectionProperties({ fieldName }: { fieldName: string }) {
  const sectionLabel = BuilderApp.useComputed(
    (s) =>
      s.data.blocks.find((sec) => sec.id === fieldName)?.label ?? fieldName,
  );

  // Get all editable fields for this section
  const sectionFields = BuilderApp.useComputed(
    (s) => s.data.blocks.find((b) => b.id === fieldName)?.fields ?? {},
  ) as unknown as Record<string, string>;

  const fieldEntries = Object.entries(sectionFields);

  return (
    <div className="space-y-6">
      <FormGroup label="Section Identity">
        <LiveInput
          label="Section Name"
          value={sectionLabel as string}
          onChange={(v) =>
            os.dispatch(renameSectionLabel({ id: fieldName, label: v }))
          }
        />
        <div className="mt-3">
          <ReadOnlyField label="ID (Anchor)" value={fieldName} />
          <p className="text-[10px] text-slate-400 mt-1">
            Used for anchor links (e.g. #{fieldName}).
          </p>
        </div>
      </FormGroup>

      {fieldEntries.length > 0 && (
        <FormGroup label={`Fields (${fieldEntries.length})`}>
          <div className="space-y-2.5">
            {fieldEntries.map(([key, val]) => (
              <LiveInput
                key={key}
                label={key}
                value={val}
                onChange={(v) =>
                  os.dispatch(updateField({ sectionId: fieldName, field: key, value: v }))
                }
              />
            ))}
          </div>
        </FormGroup>
      )}
    </div>
  );
}

function DividerProperties({ fieldName }: { fieldName: string }) {
  return (
    <div className="space-y-6">
      <FormGroup label="Divider">
        <p className="text-sm text-slate-500">
          Visual separator element. No editable properties.
        </p>
      </FormGroup>

      <FormGroup label="Element Info">
        <ReadOnlyField label="DOM ID" value={fieldName} />
      </FormGroup>
    </div>
  );
}

function TabsProperties({ fieldName }: { fieldName: string }) {
  const resolved = useResolvedField(fieldName);
  const block = resolved?.block ?? null;

  // Find the tabs container block
  const tabsBlock = BuilderApp.useComputed((s) => {
    function find(blocks: Block[]): Block | null {
      for (const b of blocks) {
        if (b.id === fieldName) return b;
        if (b.children) {
          const r = find(b.children);
          if (r) return r;
        }
      }
      return null;
    }
    return find(s.data.blocks);
  });

  const children = tabsBlock?.children ?? [];

  return (
    <div className="space-y-6">
      <FormGroup label="Tab Container">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Tabs</span>
            <span className="font-mono">{children.length}</span>
          </div>
          {children.map((child, i) => (
            <div key={child.id} className="flex justify-between">
              <span className="text-slate-400">Tab {i + 1}</span>
              <span className="font-mono truncate ml-2">{child.label}</span>
            </div>
          ))}
        </div>
      </FormGroup>

      {block && (
        <FormGroup label="Context">
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Block</span>
              <span className="font-mono">{block.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Type</span>
              <span className="font-mono">{block.type}</span>
            </div>
            {block.accept && (
              <div className="flex justify-between">
                <span className="text-slate-400">Accepts</span>
                <span className="font-mono">{block.accept.join(", ")}</span>
              </div>
            )}
          </div>
        </FormGroup>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * UI Primitives (Local)
 * ------------------------------------------------------------------------------------------------- */

function FormGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
        {label}
      </h3>
      {children}
    </div>
  );
}

function LiveInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <input
        type="text"
        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <input
        type="text"
        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-500"
        value={value}
        readOnly
      />
    </div>
  );
}

export type { PropertyType };
