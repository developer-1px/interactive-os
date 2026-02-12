import type { BaseCommand } from "@kernel";
import { useSyncExternalStore } from "react";
import type { FieldCommandFactory } from "../../schema/command/BaseCommand.ts";

export interface FieldConfig {
  name: string;
  mode?: "immediate" | "deferred"; // immediate = always editing, deferred = needs Enter to edit
  multiline?: boolean;
  onSubmit?: FieldCommandFactory; // Field injects { text: currentValue }
  onChange?: FieldCommandFactory; // Field injects { text: currentValue }
  onCancel?: BaseCommand;
  updateType?: string; // Legacy support
  onCommit?: (value: string) => void; // Local callback support
}

export interface FieldState {
  isEditing: boolean;
  localValue: string;
}

export interface FieldEntry {
  config: FieldConfig;
  state: FieldState;
}

interface FieldRegistryState {
  fields: Map<string, FieldEntry>;
  activeFieldId: string | null; // The ID of the field currently in "Editing" mode
}

// ─── Vanilla Store ───

let state: FieldRegistryState = {
  fields: new Map(),
  activeFieldId: null,
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

function register(id: string, config: FieldConfig) {
  const newFields = new Map(state.fields);
  // Initialize with default state if not present
  if (!newFields.has(id)) {
    newFields.set(id, {
      config,
      state: { isEditing: false, localValue: "" },
    });
  } else {
    // Update config if re-registering
    const entry = newFields.get(id)!;
    newFields.set(id, { ...entry, config });
  }
  state = { ...state, fields: newFields };
  emit();
}

function unregister(id: string) {
  const newFields = new Map(state.fields);
  newFields.delete(id);
  const newActiveId = state.activeFieldId === id ? null : state.activeFieldId;
  state = { fields: newFields, activeFieldId: newActiveId };
  emit();
}

function setEditing(id: string, isEditing: boolean) {
  const newFields = new Map(state.fields);
  const entry = newFields.get(id);
  if (!entry) return;

  newFields.set(id, {
    ...entry,
    state: { ...entry.state, isEditing },
  });

  state = {
    fields: newFields,
    activeFieldId: isEditing
      ? id
      : state.activeFieldId === id
        ? null
        : state.activeFieldId,
  };
  emit();
}

function updateValue(id: string, value: string) {
  const newFields = new Map(state.fields);
  const entry = newFields.get(id);
  if (!entry) return;

  newFields.set(id, {
    ...entry,
    state: { ...entry.state, localValue: value },
  });
  state = { ...state, fields: newFields };
  emit();
}

function getField(id: string) {
  return state.fields.get(id);
}

function getActiveField() {
  const { activeFieldId, fields } = state;
  if (!activeFieldId) return undefined;
  return fields.get(activeFieldId);
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
  register: (id: string, config: FieldConfig) => register(id, config),
  unregister: (id: string) => unregister(id),
  setEditing: (id: string, isEditing: boolean) => setEditing(id, isEditing),
  updateValue: (id: string, value: string) => updateValue(id, value),
  getField: (id: string) => getField(id),
  getActiveField: () => getActiveField(),
};
