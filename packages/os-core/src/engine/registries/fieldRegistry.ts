import { useSyncExternalStore } from "react";
import type { ZodSchema } from "zod";

/**
 * Field Type Presets — Key Ownership Model
 *
 * Determines which keys the field "consumes" during editing vs delegates to OS.
 * Derived from 3 independent axes: ↑↓ ownership, Tab ownership, Backspace∅ ownership.
 *
 * - inline:  Tab→OS, ↑↓→OS, Bksp∅→Field  (search, draft, rename)
 * - tokens:  Tab→OS, ↑↓→OS, Bksp∅→OS     (chips, tags, email recipients)
 * - block:   Tab→OS, ↑↓→Field, Bksp∅→Field (comment, description, chat)
 * - editor:  Tab→Field, ↑↓→Field, Bksp∅→Field (code editor, rich text)
 * - number:  Arrow/Home/End/Page→Field (slider, spinbutton)
 * - enum:    Zone+Item composition — single select (radiogroup, listbox, select)
 * - enum[]:  Zone+Item composition — multi select (checkbox group, multi-select listbox)
 */
export type FieldType =
  | "inline"
  | "tokens"
  | "block"
  | "editor"
  | "number"
  | "enum"
  | "enum[]"
  | "readonly";

/**
 * The value a Field can hold.
 *
 * - string: text fields (inline, tokens, block, editor)
 * - boolean: toggle fields (switch, checkbox)
 * - number: numeric fields (slider, spinbutton)
 * - string[]: multi-select fields (enum[])
 *
 * This union ensures "Field = text" is never assumed.
 */
export type FieldValue = string | boolean | number | string[];

export type FieldTrigger = "change" | "blur" | "enter";

export interface FieldConfig {
  name: string;
  defaultValue?: FieldValue; // Initial value (supports all FieldValue types)
  mode?: "immediate" | "deferred"; // immediate = always editing, deferred = needs Enter to edit
  fieldType?: FieldType; // Key ownership preset (default: "inline")

  /** Fixed set of choices for enum/enum[] Fields */
  options?: readonly string[];

  // -- Commit Architecture --
  onCommit?: FieldCommandFactory; // Field injects { text: currentValue }
  trigger?: FieldTrigger; // Default: 'enter'
  schema?: ZodSchema;
  resetOnSubmit?: boolean;
  onCancel?: BaseCommand;
}

export interface FieldState {
  value: FieldValue;
  defaultValue: FieldValue;
  isDirty: boolean;
  isValid: boolean;
  error: string | null;
  caretPosition: number | null;
}

export interface FieldEntry {
  config: FieldConfig;
  state: FieldState;
}

interface FieldRegistryState {
  fields: Map<string, FieldEntry>;
}

// ─── Vanilla Store ───

let state: FieldRegistryState = {
  fields: new Map(),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return state;
}

// ─── Actions ───

function register(id: string, config: FieldConfig) {
  const newFields = new Map(state.fields);
  const existing = newFields.get(id);
  const defaultValue = config.defaultValue ?? "";

  // If re-registering, preserve state but update config
  // If new, initialize default state
  const newState: FieldState = existing
    ? existing.state
    : {
        value: defaultValue,
        defaultValue,
        isValid: true,
        isDirty: false,
        error: null,
        caretPosition: null,
      };

  newFields.set(id, {
    config,
    state: { ...newState, defaultValue }, // Always sync defaultValue from config
  });

  state = { ...state, fields: newFields };
  emit();
}

function unregister(id: string) {
  const newFields = new Map(state.fields);
  newFields.delete(id);
  state = { fields: newFields };
  emit();
}

function updateValue(id: string, value: FieldValue) {
  const newFields = new Map(state.fields);
  const entry = newFields.get(id);
  if (!entry) return;

  // Check dirtiness against default value (if we tracked it, but for now just existence)
  const isDirty = true;

  newFields.set(id, {
    ...entry,
    state: { ...entry.state, value, isDirty },
  });

  state = { ...state, fields: newFields };
  emit();
}

function setError(id: string, error: string | null) {
  const newFields = new Map(state.fields);
  const entry = newFields.get(id);
  if (!entry) return;

  newFields.set(id, {
    ...entry,
    state: {
      ...entry.state,
      error,
      isValid: !error,
    },
  });

  state = { ...state, fields: newFields };
  emit();
}

function reset(id: string) {
  const newFields = new Map(state.fields);
  const entry = newFields.get(id);
  if (!entry) return;

  const defaultValue = entry.state.defaultValue;
  newFields.set(id, {
    ...entry,
    state: {
      value: defaultValue,
      defaultValue,
      error: null,
      isValid: true,
      isDirty: false,
      caretPosition: null,
    },
  });

  state = { ...state, fields: newFields };
  emit();
}

function getField(id: string) {
  return state.fields.get(id);
}

function getValue(id: string): FieldValue {
  if (!state.fields.has(id)) {
    console.warn(`[Field] getValue: '${id}' is not registered`);
  }
  return state.fields.get(id)?.state.value ?? "";
}

function updateCaretPosition(id: string, position: number | null) {
  const newFields = new Map(state.fields);
  const entry = newFields.get(id);
  if (!entry) return;

  newFields.set(id, {
    ...entry,
    state: { ...entry.state, caretPosition: position },
  });

  state = { ...state, fields: newFields };
  // No emit — caret position changes should not trigger re-renders.
  // It's read synchronously at restore time, not reactively.
}

// ─── React Hook ───

export function useFieldRegistry<T>(selector: (s: FieldRegistryState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
}

// ─── Static Accessor ───

export const FieldRegistry = {
  get: () => getSnapshot(),
  register,
  unregister,
  updateValue,
  updateCaretPosition,
  setError,
  reset,
  getField,
  getValue,
};
