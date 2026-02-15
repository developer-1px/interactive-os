import {
  Image as ImageIcon,
  Layout,
  Link as LinkIcon,
  MousePointer2,
  Square,
  Type,
} from "lucide-react";
import {
  BuilderApp,
  builderUpdateField,
  type PropertyType,
} from "@/apps/builder/app";

/**
 * PropertiesPanel
 *
 * Visual CMS / Web Builder - Right Sidebar
 * Reads selected element and field data from BuilderApp state.
 * Writes field changes via builderUpdateField (same command as canvas inline editing).
 */
export function PropertiesPanel() {
  const selectedId = BuilderApp.useComputed((s) => s.ui.selectedId);
  const selectedType = BuilderApp.useComputed((s) => s.ui.selectedType);

  if (!selectedId || !selectedType) {
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
      {/* Tabs Header */}
      <div className="px-2 py-2 border-b border-slate-100 flex items-center justify-around bg-slate-50/50">
        <TabButton
          active={selectedType === "text"}
          icon={<Type size={14} />}
          label="Text"
        />
        <TabButton
          active={selectedType === "image"}
          icon={<ImageIcon size={14} />}
          label="Img"
        />
        <TabButton
          active={selectedType === "icon"}
          icon={<Square size={14} />}
          label="Icon"
        />
        <TabButton
          active={selectedType === "link"}
          icon={<LinkIcon size={14} />}
          label="Link"
        />
        <TabButton
          active={selectedType === "button"}
          icon={<MousePointer2 size={14} />}
          label="Btn"
        />
        <TabButton
          active={selectedType === "section"}
          icon={<Layout size={14} />}
          label="Sect"
        />
      </div>

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
            {selectedId}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {selectedType === "text" && <TextProperties fieldName={selectedId} />}
        {selectedType === "image" && <ImageProperties />}
        {selectedType === "icon" && <IconProperties />}
        {selectedType === "link" && <LinkProperties fieldName={selectedId} />}
        {selectedType === "button" && (
          <ButtonProperties fieldName={selectedId} />
        )}
        {selectedType === "section" && (
          <SectionProperties fieldName={selectedId} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-1.5 rounded-md transition-all ${
        active
          ? "bg-white text-violet-600 shadow-sm ring-1 ring-violet-100"
          : "text-slate-400"
      }`}
      title={label}
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </div>
  );
}

function getIconForType(type: PropertyType) {
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
    case "section":
      return <Layout size={16} />;
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------------------------------
 * Live-Bound Forms — reads/writes BuilderApp state
 * ------------------------------------------------------------------------------------------------- */

function TextProperties({ fieldName }: { fieldName: string }) {
  const value = BuilderApp.useComputed((s) => s.data.fields[fieldName] ?? "");

  return (
    <div className="space-y-6">
      <FormGroup label="Content">
        <textarea
          className="w-full p-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-h-[80px] resize-y"
          value={value}
          onChange={(e) => builderUpdateField(fieldName, e.target.value)}
        />
        <p className="text-[10px] text-slate-400 mt-1.5">
          Edit the text content. Changes apply to canvas in real-time.
        </p>
      </FormGroup>

      <FormGroup label="Semantics">
        <Select label="Tag" value="H1 (Heading 1)" />
        <div className="mt-2" />
        <TextInput label="Aria Label" value="" />
      </FormGroup>
    </div>
  );
}

function ImageProperties() {
  return (
    <div className="space-y-6">
      <FormGroup label="Preview">
        <div className="aspect-video bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center mb-3 overflow-hidden relative group">
          <img
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">
            Replace Image
          </button>
        </div>
      </FormGroup>

      <FormGroup label="Source">
        <TextInput label="Image URL" value="https://images.unsplash.com/..." />
        <div className="mt-3">
          <TextInput label="Alt Text" value="Code editor on screen" />
          <p className="text-[10px] text-slate-400 mt-1">
            Important for accessibility and SEO.
          </p>
        </div>
      </FormGroup>

      <FormGroup label="Interaction">
        <Select label="Click Action" value="Open Lightbox" />
      </FormGroup>
    </div>
  );
}

function IconProperties() {
  return (
    <div className="space-y-6">
      <FormGroup label="Icon Selection">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`aspect-square rounded-md border flex items-center justify-center cursor-pointer hover:bg-slate-50 ${
                i === 1
                  ? "border-violet-500 bg-violet-50 text-violet-600"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              <Square size={20} />
            </div>
          ))}
        </div>
        <TextInput label="Search Icon" value="ArrowRight" />
      </FormGroup>
      <FormGroup label="Accessibility">
        <TextInput label="Label" value="" />
        <p className="text-[10px] text-slate-400 mt-1">
          Leave empty if decorative.
        </p>
      </FormGroup>
    </div>
  );
}

function LinkProperties({ fieldName }: { fieldName: string }) {
  const value = BuilderApp.useComputed((s) => s.data.fields[fieldName] ?? "");

  return (
    <div className="space-y-6">
      <FormGroup label="Link Text">
        <textarea
          className="w-full p-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 min-h-[40px] resize-y"
          value={value}
          onChange={(e) => builderUpdateField(fieldName, e.target.value)}
        />
      </FormGroup>

      <FormGroup label="Destination">
        <Select label="Link Type" value="External URL" />
        <div className="mt-2">
          <TextInput label="URL" value="https://example.com" />
        </div>
      </FormGroup>

      <FormGroup label="Options">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            defaultChecked
            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          <label className="text-sm text-slate-600">Open in new tab</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          <label className="text-sm text-slate-600">No Follow (SEO)</label>
        </div>
      </FormGroup>
    </div>
  );
}

function ButtonProperties({ fieldName }: { fieldName: string }) {
  const value = BuilderApp.useComputed((s) => s.data.fields[fieldName] ?? "");

  return (
    <div className="space-y-6">
      <FormGroup label="Button Label">
        <input
          type="text"
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          value={value}
          onChange={(e) => builderUpdateField(fieldName, e.target.value)}
        />
      </FormGroup>

      <FormGroup label="Destination">
        <Select label="Type" value="External Link" />
        <div className="mt-2">
          <TextInput label="URL" value="/signup" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="new-tab"
            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          <label htmlFor="new-tab" className="text-sm text-slate-600">
            Open in new tab
          </label>
        </div>
      </FormGroup>

      <FormGroup label="Tracking">
        <TextInput label="Event Name" value="hero_cta_click" />
      </FormGroup>
    </div>
  );
}

function SectionProperties({ fieldName }: { fieldName: string }) {
  return (
    <div className="space-y-6">
      <FormGroup label="Section Identity">
        <TextInput label="Section Name" value={fieldName} />
        <div className="mt-3">
          <TextInput label="ID (Anchor)" value={fieldName} />
          <p className="text-[10px] text-slate-400 mt-1">
            Used for anchor links (e.g. #{fieldName}).
          </p>
        </div>
      </FormGroup>

      <FormGroup label="Visibility">
        <Select label="Status" value="Published" />
        <div className="mt-3 p-3 bg-slate-50 rounded text-xs text-slate-500 border border-slate-100">
          Design settings are locked by the theme.
        </div>
      </FormGroup>
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

function TextInput({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
      />
    </div>
  );
}

function Select({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <div className="relative">
        <select
          defaultValue={value}
          className="w-full pl-2 pr-6 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 appearance-none bg-white"
        >
          <option>{value}</option>
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export type { PropertyType };
