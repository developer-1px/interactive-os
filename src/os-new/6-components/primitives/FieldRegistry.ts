import { create } from "zustand";
import type {
  BaseCommand,
  FieldCommandFactory,
} from "../../schema/command/BaseCommand.ts";

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

interface FieldRegistryActions {
  register: (id: string, config: FieldConfig) => void;
  unregister: (id: string) => void;
  setEditing: (id: string, isEditing: boolean) => void;
  updateValue: (id: string, value: string) => void;
  getField: (id: string) => FieldEntry | undefined;
  getActiveField: () => FieldEntry | undefined;
}

export const useFieldRegistry = create<
  FieldRegistryState & FieldRegistryActions
>((set, get) => ({
  fields: new Map(),
  activeFieldId: null,

  register: (id, config) => {
    set((state) => {
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
      return { fields: newFields };
    });
  },

  unregister: (id) => {
    set((state) => {
      const newFields = new Map(state.fields);
      newFields.delete(id);
      const newActiveId =
        state.activeFieldId === id ? null : state.activeFieldId;
      return { fields: newFields, activeFieldId: newActiveId };
    });
  },

  setEditing: (id, isEditing) => {
    set((state) => {
      const newFields = new Map(state.fields);
      const entry = newFields.get(id);
      if (!entry) return state;

      newFields.set(id, {
        ...entry,
        state: { ...entry.state, isEditing },
      });

      return {
        fields: newFields,
        activeFieldId: isEditing
          ? id
          : state.activeFieldId === id
            ? null
            : state.activeFieldId,
      };
    });
  },

  updateValue: (id, value) => {
    set((state) => {
      const newFields = new Map(state.fields);
      const entry = newFields.get(id);
      if (!entry) return state;

      newFields.set(id, {
        ...entry,
        state: { ...entry.state, localValue: value },
      });
      return { fields: newFields };
    });
  },

  getField: (id) => get().fields.get(id),

  getActiveField: () => {
    const { activeFieldId, fields } = get();
    if (!activeFieldId) return undefined;
    return fields.get(activeFieldId);
  },
}));

// Static Accessor
export const FieldRegistry = {
  get: () => useFieldRegistry.getState(),
  register: (id: string, config: FieldConfig) =>
    useFieldRegistry.getState().register(id, config),
  unregister: (id: string) => useFieldRegistry.getState().unregister(id),
  setEditing: (id: string, isEditing: boolean) =>
    useFieldRegistry.getState().setEditing(id, isEditing),
  updateValue: (id: string, value: string) =>
    useFieldRegistry.getState().updateValue(id, value),
  getField: (id: string) => useFieldRegistry.getState().getField(id),
  getActiveField: () => useFieldRegistry.getState().getActiveField(),
};
