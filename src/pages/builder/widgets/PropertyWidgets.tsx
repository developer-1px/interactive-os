/**
 * Property Widgets — OCP registry of primitive field editors.
 *
 * Each widget renders one PrimitiveType.
 * New primitive = new widget file + registry entry. No other changes.
 *
 * All widgets receive the same WidgetProps interface.
 * Label is rendered by the parent (FieldInput) — widgets only render the input.
 */

import type { PropertyDef } from "@apps/builder/model/blockSchemas";
import type { PrimitiveType } from "@apps/builder/model/primitives";
import { decode } from "@apps/builder/model/primitives";
import { Image, Palette, Type } from "lucide-react";
import type React from "react";

// ═══════════════════════════════════════════════════════════════════
// Widget Interface
// ═══════════════════════════════════════════════════════════════════

export interface WidgetProps {
  /** Raw string value from Block.fields */
  value: string;
  /** Callback to update value (encodes back to string) */
  onChange: (newValue: string) => void;
  /** Focus handler for canvas highlight sync */
  onFocus: () => void;
  /** Blur handler */
  onBlur: () => void;
  /** Property definition from schema */
  def: PropertyDef;
}

const INPUT_BASE =
  "w-full px-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-700";

// ═══════════════════════════════════════════════════════════════════
// Individual Widgets
// ═══════════════════════════════════════════════════════════════════

function TextWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  return (
    <input
      type="text"
      className={INPUT_BASE}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function MultilineWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  return (
    <textarea
      className={`${INPUT_BASE} min-h-[56px] resize-y leading-relaxed`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function ButtonWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  const decoded = decode("button", value);
  const text = decoded.type === "button" ? decoded.text : value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 text-[11px] font-semibold rounded-md bg-violet-600 text-white shrink-0 truncate max-w-[120px]">
          {text || "Button"}
        </span>
        <input
          type="text"
          className={`flex-1 ${INPUT_BASE}`}
          value={text}
          placeholder="Button text"
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
      {decoded.type === "button" && (
        <input
          type="text"
          className={`${INPUT_BASE} font-mono text-[11px]`}
          value={decoded.href ?? ""}
          placeholder="Link URL (optional)"
          onChange={(e) => {
            const updated = JSON.stringify({
              text,
              href: e.target.value || undefined,
            });
            onChange(updated);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
    </div>
  );
}

function LinkWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  const decoded = decode("link", value);
  const text = decoded.type === "link" ? decoded.text : value;
  const href = decoded.type === "link" ? decoded.href : "";

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        className={INPUT_BASE}
        value={text}
        placeholder="Link text"
        onChange={(e) => {
          onChange(JSON.stringify({ text: e.target.value, href }));
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <input
        type="text"
        className={`${INPUT_BASE} font-mono text-[11px]`}
        value={href}
        placeholder="https://..."
        onChange={(e) => {
          onChange(JSON.stringify({ text, href: e.target.value }));
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}

function IconWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 text-slate-500">
        <Type size={16} />
      </span>
      <input
        type="text"
        className={`flex-1 ${INPUT_BASE}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}

function ImageWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-center h-16 rounded-md border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
        <Image size={20} />
      </div>
      <input
        type="text"
        className={INPUT_BASE}
        value={value}
        placeholder="Image URL or path"
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#22c55e",
  orange: "#f97316",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  red: "#ef4444",
  yellow: "#eab308",
  pink: "#ec4899",
};

function ColorWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  const bg =
    Object.entries(COLOR_MAP).find(([k]) => value.includes(k))?.[1] ??
    "#94a3b8";

  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center justify-center w-8 h-8 rounded-md border border-slate-200"
        style={{ background: bg }}
      >
        <Palette size={14} className="text-white" />
      </span>
      <input
        type="text"
        className={`flex-1 ${INPUT_BASE} font-mono text-[11px]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}

function BadgeWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  return (
    <div className="flex items-center gap-2">
      {value && (
        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-wider shrink-0">
          {value}
        </span>
      )}
      <input
        type="text"
        className={`flex-1 ${INPUT_BASE}`}
        value={value}
        placeholder="e.g. NEW, UPDATED"
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}

function DateWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  return (
    <input
      type="text"
      className={`${INPUT_BASE} font-mono text-[12px]`}
      value={value}
      placeholder="YYYY.MM.DD"
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

function SelectWidget({ value, onChange, onFocus, onBlur, def }: WidgetProps) {
  const options = def.options ?? [];
  return (
    <select
      className={INPUT_BASE}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
      {!options.includes(value) && <option value={value}>{value}</option>}
    </select>
  );
}

function ToggleWidget({ value, onChange }: WidgetProps) {
  const checked = value === "true";
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-indigo-500" : "bg-slate-200"}`}
      onClick={() => onChange(checked ? "false" : "true")}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function NumberWidget({ value, onChange, onFocus, onBlur }: WidgetProps) {
  return (
    <input
      type="number"
      className={INPUT_BASE}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// Widget Registry — OCP: new type = new entry, nothing else changes
// ═══════════════════════════════════════════════════════════════════

const widgetRegistry: Record<PrimitiveType, React.FC<WidgetProps>> = {
  text: TextWidget,
  multiline: MultilineWidget,
  button: ButtonWidget,
  link: LinkWidget,
  image: ImageWidget,
  icon: IconWidget,
  color: ColorWidget,
  badge: BadgeWidget,
  date: DateWidget,
  select: SelectWidget,
  toggle: ToggleWidget,
  number: NumberWidget,
};

/**
 * Get the widget component for a primitive type.
 * Falls back to TextWidget for unknown types.
 */
export function getWidget(type: PrimitiveType): React.FC<WidgetProps> {
  return widgetRegistry[type] ?? TextWidget;
}
