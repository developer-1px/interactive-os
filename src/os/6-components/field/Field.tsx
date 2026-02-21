import type { BaseCommand } from "@kernel";
import { useFieldFocus } from "@os/5-hooks/useFieldHooks.ts";
import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { os } from "@os/kernel.ts";
import type { FieldCommandFactory } from "@os/schemas/command/BaseCommand.ts";

import type { HTMLAttributes } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ZodSchema } from "zod";
import {
  type FieldConfig,
  FieldRegistry,
  type FieldTrigger,
  type FieldType,
  useFieldRegistry,
} from "./FieldRegistry";
import { Label } from "./Label";

/**
 * Checks if the value is effectively empty for placeholder display.
 */
const checkValueEmpty = (value: string | undefined | null): boolean => {
  return !value || value === "\n";
};

interface FieldStyleParams {
  isFocused: boolean;
  isEditing: boolean;
  multiline: boolean;
  value: string;
  error?: string | null | undefined;
  placeholder?: string | undefined;
  customClassName?: string | undefined;
}

/**
 * Composes the Tailwind classes for the field.
 */
const getFieldClasses = ({
  isFocused: _isFocused,
  isEditing,
  multiline,
  value,
  error,
  placeholder,
  customClassName = "",
}: FieldStyleParams): string => {
  const isEmpty = checkValueEmpty(value);
  const shouldShowPlaceholder = placeholder && isEmpty;
  const placeholderClasses = shouldShowPlaceholder
    ? "before:content-[attr(data-placeholder)] before:text-slate-400 before:opacity-50 before:pointer-events-none before:absolute before:top-0 before:left-0 before:truncate before:w-full before:h-full"
    : "";

  const lineClasses = multiline
    ? "whitespace-pre-wrap break-words"
    : "whitespace-nowrap overflow-hidden";

  // --- State Visual Distinction ---
  // Error: Red ring (overrides editing blue)
  // Editing: Blue ring + blue tint background
  // Focused: Default focus ring
  let stateClasses = "";
  if (error) {
    stateClasses = "ring-2 ring-red-500 bg-red-500/10 rounded-sm";
  } else if (isEditing) {
    stateClasses = "ring-2 ring-blue-500 bg-blue-500/10 rounded-sm";
  }

  return `${placeholderClasses} ${lineClasses} ${stateClasses} relative min-h-[1lh] ${customClassName}`.trim();
};

export type FieldMode = "immediate" | "deferred";

export interface EditableProps
  extends Omit<
    HTMLAttributes<HTMLElement>,
    "onChange" | "onBlur" | "onFocus" | "onSubmit"
  > {
  /** Current text value */
  value: string;
  /** Unique identifier — FieldRegistry key + FocusItem ID */
  name: string;
  placeholder?: string;
  /** Keyboard ownership preset (default: "inline") */
  fieldType?: FieldType;

  /** Command factory invoked on commit with { text } payload */
  onCommit?: FieldCommandFactory;
  /** When to commit: "enter" | "blur" | "change" (default: "enter") */
  trigger?: FieldTrigger;
  /** Zod schema for pre-commit validation */
  schema?: ZodSchema;
  /** Clear field value after successful commit */
  resetOnSubmit?: boolean;

  /** Command dispatched on Escape */
  onCancel?: BaseCommand;

  /** "immediate" = always editable, "deferred" = F2 to enter editing (default: "immediate") */
  mode?: FieldMode;
}

/**
 * Field - Pure Projection Primitive
 *
 * A passive text input component that:
 * - Registers with FieldRegistry for state management
 * - Subscribes to registry state for rendering
 * - Validates input against Zod schema (Gatekeeper)
 * - Dispatches 'onCommit' command with injected payload
 */
const FieldBase = forwardRef<HTMLElement, EditableProps>(
  (
    {
      value,
      name,
      placeholder,

      onCommit,
      trigger: triggerProp,
      schema,
      resetOnSubmit = false,

      onCancel,

      mode = "immediate",
      fieldType: fieldTypeProp,
      ...rest
    },
    ref,
  ) => {
    const trigger: FieldTrigger = triggerProp ?? "enter";

    // --- Derived props (from fieldType / mode) ---
    const fieldType: FieldType = fieldTypeProp ?? "inline";
    const multiline = fieldType === "block" || fieldType === "editor";
    const blurOnInactive = mode === "deferred";
    const tag = multiline ? "div" : "span";

    const context = useFocusGroupContext();
    const zoneId = context?.zoneId || "unknown";

    const innerRef = useRef<HTMLElement>(null);
    const cursorRef = useRef<number | null>(null);

    // --- Identity ---
    const fieldId = name;

    // --- Refs for Stabilizing Config ---
    const onCommitRef = useRef(onCommit);
    const onCancelRef = useRef(onCancel);
    const schemaRef = useRef(schema);

    onCommitRef.current = onCommit;
    onCancelRef.current = onCancel;
    schemaRef.current = schema;

    // --- Actions ---

    const handleCommit = useCallback(
      (currentValue: string) => {
        const commitCmd = onCommitRef.current;
        if (!commitCmd) return;

        // 1. Validate
        if (schemaRef.current) {
          const result = schemaRef.current.safeParse(currentValue);
          if (!result.success) {
            const errorMessage =
              result.error.issues[0]?.message ?? "Validation failed";
            FieldRegistry.setError(fieldId, errorMessage);
            return; // Block Commit
          }
        }

        // 2. Clear Error (if any)
        FieldRegistry.setError(fieldId, null);

        // 3. Dispatch (Inject Payload)
        // The factory expects { text: string }, we inject it.
        // We assume defineApp has wrapped the handler to accept this payload.
        // But wait, we need to DISPATCH the command.
        // FieldCommandFactory returns a Command object.
        const command = commitCmd({ text: currentValue });
        os.dispatch(command);

        // 4. Reset (if configured)
        if (resetOnSubmit) {
          FieldRegistry.reset(fieldId);
        }
      },
      [fieldId, resetOnSubmit],
    );

    // Stable wrappers for Registry (Config)
    // We wrap these so Registry can call them if needed, but mostly Field handles logic internally now.

    // --- Registry Registration ---
    useEffect(() => {
      const config: FieldConfig = {
        name,
        mode,
        multiline,
        fieldType,
        trigger,
        resetOnSubmit,
        ...(onCommitRef.current !== undefined
          ? { onCommit: onCommitRef.current }
          : {}),
        ...(schema !== undefined ? { schema } : {}),
        ...(onCancelRef.current !== undefined
          ? { onCancel: onCancelRef.current }
          : {}),
      };

      FieldRegistry.register(name, config);
      return () => FieldRegistry.unregister(name);
    }, [name, mode, fieldType, trigger, resetOnSubmit, schema]); // Re-register on config change

    // --- State Subscription ---
    // Subscribe to primitive values to avoid unnecessary re-renders on object reference changes.
    const rawRegistryValue = useFieldRegistry(
      (s) => s.fields.get(fieldId)?.state.value,
    );
    const localValue = rawRegistryValue ?? value;
    const error = useFieldRegistry((s) => s.fields.get(fieldId)?.state.error);

    // Sync prop value to registry when not actively editing (contentEditable)
    const isContentEditableRef = useRef(false);

    // --- Focus Computation ---
    const isFocused = os.useComputed(
      (s) =>
        s.os.focus.activeZoneId === zoneId &&
        (s.os.focus.zones[zoneId]?.focusedItemId ?? null) === fieldId,
    );

    const isEditingThisField = os.useComputed(
      (s) => (s.os.focus.zones[zoneId]?.editingItemId ?? null) === fieldId,
    );

    // isParentEditing: detect when a parent item is editing, making child fields editable.
    // Uses a pure useComputed for state + useLayoutEffect for DOM ancestry check.
    const parentEditingCandidate = os.useComputed((s) => {
      if (s.os.focus.activeZoneId !== zoneId) return null;
      const zone = s.os.focus.zones[zoneId];
      if (!zone?.editingItemId) return null;
      if (zone.focusedItemId !== zone.editingItemId) return null;
      if (zone.editingItemId === fieldId) return null;
      return zone.editingItemId;
    });

    const [isParentEditing, setIsParentEditing] = useState(false);
    useLayoutEffect(() => {
      if (!parentEditingCandidate || !innerRef.current) {
        setIsParentEditing(false);
        return;
      }
      const editingEl = document.getElementById(String(parentEditingCandidate));
      setIsParentEditing(editingEl?.contains(innerRef.current) ?? false);
    }, [parentEditingCandidate]);



    const isContentEditable =
      mode === "deferred"
        ? (isFocused && isEditingThisField) || isParentEditing
        : isFocused || isParentEditing;
    const isActive = isContentEditable;
    isContentEditableRef.current = isContentEditable;

    // --- DOM Sync & Event Listeners ---

    // Sync prop value to registry when not actively editing.
    //
    // ⚠️ CRITICAL: fieldData?.state.value must NOT be in deps.
    //   If it were, the loop would be:
    //   updateValue → emit → useFieldRegistry re-render
    //   → fieldData?.state.value changes → effect re-runs → updateValue → ...
    //
    // FIX: use a ref to read the latest registry value without adding it to deps.
    const registryValueRef = useRef(rawRegistryValue);
    registryValueRef.current = rawRegistryValue;

    useEffect(() => {
      if (!isContentEditableRef.current && value !== registryValueRef.current) {
        FieldRegistry.updateValue(fieldId, value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, fieldId]); // registryValueRef intentionally excluded — read via ref above

    // Initial Value
    const initialValueRef = useRef(value);
    const hasInitialized = useRef(false);
    useLayoutEffect(() => {
      if (innerRef.current && !hasInitialized.current) {
        innerRef.current.innerText = initialValueRef.current;
        hasInitialized.current = true;
      }
    }, []);

    // Restore value on cancel/exit
    // - Deferred mode: restore to prop value (cancel semantics)
    // - Immediate mode: restore to FieldRegistry value (preserve draft)
    const prevValueRef = useRef(value);
    const wasEditableRef = useRef(isContentEditable);
    useLayoutEffect(() => {
      const exitedEditing = wasEditableRef.current && !isContentEditable;
      wasEditableRef.current = isContentEditable;

      if (innerRef.current && !isContentEditable) {
        if (mode === "deferred") {
          // Deferred: revert to app's value prop (cancel/blur = discard changes)
          if (exitedEditing || prevValueRef.current !== value) {
            innerRef.current.innerText = value;
          }
        } else {
          // Immediate: preserve FieldRegistry value (draft survives blur)
          if (exitedEditing) {
            const registryValue = FieldRegistry.getValue(fieldId);
            if (registryValue && innerRef.current.innerText !== registryValue) {
              innerRef.current.innerText = registryValue;
            }
          }
        }
      }
      prevValueRef.current = value;
    }, [value, isContentEditable, mode, fieldId]);

    const shouldHaveDOMFocus = mode === "deferred" ? isFocused : isActive;

    // --- DOM Event Listeners ---
    // InputListener (global) handles DOM→FieldRegistry sync (data stream).
    // Field only handles commit triggers (command stream).

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const handleInput = () => {
        // Trigger: change → commit on every keystroke
        if (trigger === "change") {
          handleCommit(FieldRegistry.getValue(fieldId));
        }
      };

      const handleBlur = () => {
        // Trigger: Blur
        if (trigger === "blur") {
          handleCommit(FieldRegistry.getValue(fieldId));
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // Skip IME composition (Korean, Japanese, Chinese)
        // Matches KeyboardListener's guard: e.isComposing || e.keyCode === 229
        if (e.isComposing || e.keyCode === 229) return;

        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          if (trigger === "enter") {
            handleCommit(FieldRegistry.getValue(fieldId));
          }
        }
      };

      el.addEventListener("input", handleInput);
      el.addEventListener("blur", handleBlur);
      el.addEventListener("keydown", handleKeyDown);

      return () => {
        el.removeEventListener("input", handleInput);
        el.removeEventListener("blur", handleBlur);
        el.removeEventListener("keydown", handleKeyDown);
      };
    }, [fieldId, trigger, handleCommit]); // Re-bind if config changes

    useFieldFocus({
      innerRef,
      isActive: shouldHaveDOMFocus,
      blurOnInactive,
      cursorRef,
    });

    // --- Styling ---
    const { className: customClassName, id: _id, ...otherProps } = rest;
    const composeProps = getFieldClasses({
      isFocused,
      isEditing: isContentEditable,
      multiline,
      value: localValue,
      error,
      ...(placeholder !== undefined ? { placeholder } : {}),
      customClassName,
    });

    const baseProps = {
      contentEditable: isContentEditable,
      suppressContentEditableWarning: true,
      role: "textbox",
      "aria-multiline": multiline,
      tabIndex: 0,
      className: composeProps,
      "data-placeholder": placeholder,
      "data-mode": mode,
      // Error state for styling/accessibility
      "aria-invalid": !!error,
      "aria-errormessage": error || undefined,
      "data-editing":
        mode === "deferred"
          ? isContentEditable
            ? "true"
            : undefined
          : undefined,
      "data-focused": isFocused ? "true" : undefined,
      children: null,
      ...otherProps,
    };

    const setInnerRef = (node: HTMLElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    };

    return (
      <FocusItem
        id={fieldId}
        as={tag}
        ref={setInnerRef}
        {...(baseProps as any)}
      />
    );
  },
);

FieldBase.displayName = "Field.Editable";

/**
 * Field — Compound namespace for OS-integrated input primitives.
 *
 * Field.Editable  — contentEditable inline editing (canvas, rich text, chips/mentions)
 * Field.Input     — native <input> (form panels, property panels)
 * Field.Textarea  — native <textarea> (multi-line form inputs)
 * Field.Label     — <label> for field association
 */
const Editable = FieldBase;

import { FieldInput } from "./FieldInput";
import { FieldTextarea } from "./FieldTextarea";

export const Field = Object.assign(
  // Field() itself still works as Editable for backward compatibility
  // TODO: deprecate direct Field() usage — prefer Field.Editable
  FieldBase,
  {
    Editable,
    Input: FieldInput,
    Textarea: FieldTextarea,
    Label,
  },
);
