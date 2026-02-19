import type { BaseCommand } from "@kernel";
import { useFieldFocus } from "@os/5-hooks/useFieldHooks.ts";
import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { kernel } from "@os/kernel.ts";
import type { FieldCommandFactory } from "@os/schemas/command/BaseCommand.ts";
import type { FocusTarget } from "@os/schemas/focus/FocusTarget.ts";
import type { HTMLAttributes } from "react";
import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import type { ZodSchema } from "zod";
import {
  type FieldConfig,
  FieldRegistry,
  type FieldTrigger,
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

export interface FieldProps
  extends Omit<
    HTMLAttributes<HTMLElement>,
    "onChange" | "onBlur" | "onFocus" | "onSubmit"
  > {
  value: string;
  name?: string;
  placeholder?: string;
  multiline?: boolean;

  // -- New Architecture --
  onCommit?: FieldCommandFactory;
  trigger?: FieldTrigger;
  schema?: ZodSchema;
  resetOnSubmit?: boolean;

  onCancel?: BaseCommand;

  mode?: FieldMode;
  target?: FocusTarget;
  controls?: string;
  blurOnInactive?: boolean;
  as?: "span" | "div";
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
const FieldBase = forwardRef<HTMLElement, FieldProps>(
  (
    {
      value,
      name,
      placeholder,
      multiline = false,

      onCommit,
      trigger: triggerProp,
      schema,
      resetOnSubmit = false,

      onCancel,

      mode = "immediate",
      target = "real",
      controls,
      blurOnInactive = false,
      as = "span",
      ...rest
    },
    ref,
  ) => {
    const trigger: FieldTrigger = triggerProp ?? "enter";

    const context = useFocusGroupContext();
    const zoneId = context?.zoneId || "unknown";

    const innerRef = useRef<HTMLElement>(null);
    const cursorRef = useRef<number | null>(null);

    // --- Identity ---
    const fieldId = name || "unknown-field";

    // --- Refs for Stabilizing Config ---
    const onCommitRef = useRef(onCommit);
    const onCancelRef = useRef(onCancel);
    const schemaRef = useRef(schema);

    onCommitRef.current = onCommit;
    onCancelRef.current = onCancel;
    schemaRef.current = schema;

    // --- Actions ---

    const handleCommit = (currentValue: string) => {
      const commitCmd = onCommitRef.current;
      if (!commitCmd) return;

      // 1. Validate
      if (schemaRef.current) {
        const result = schemaRef.current.safeParse(currentValue);
        if (!result.success) {
          const errorMessage = result.error.issues[0]?.message ?? "Validation failed";
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
      kernel.dispatch(command);

      // 4. Reset (if configured)
      if (resetOnSubmit) {
        FieldRegistry.reset(fieldId);
      }
    };

    // Stable wrappers for Registry (Config)
    // We wrap these so Registry can call them if needed, but mostly Field handles logic internally now.


    // --- Registry Registration ---
    useEffect(() => {
      if (!name) return;

      const config: FieldConfig = {
        name,
        mode,
        multiline,
        trigger,
        resetOnSubmit,
        ...(onCommitRef.current !== undefined ? { onCommit: onCommitRef.current } : {}),
        ...(schema !== undefined ? { schema } : {}),
        ...(onCancelRef.current !== undefined ? { onCancel: onCancelRef.current } : {}),
      };

      FieldRegistry.register(name, config);
      return () => FieldRegistry.unregister(name);
    }, [name, mode, multiline, trigger, resetOnSubmit]); // Re-register on config change

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
    const isFocused = kernel.useComputed(
      (s) =>
        s.os.focus.activeZoneId === zoneId &&
        (s.os.focus.zones[zoneId]?.focusedItemId ?? null) === fieldId,
    );

    const isEditingThisField = kernel.useComputed(
      (s) => (s.os.focus.zones[zoneId]?.editingItemId ?? null) === fieldId,
    );
    const isParentEditing = kernel.useComputed((s) => {
      if (s.os.focus.activeZoneId !== zoneId) return false;
      const zone = s.os.focus.zones[zoneId];
      if (!zone?.editingItemId) return false;
      if (zone.focusedItemId !== zone.editingItemId) return false;
      // If this field IS the editing item, isEditingThisField handles it
      if (zone.editingItemId === fieldId) return false;
      // Verify DOM ancestry: the editing item must be a parent of this field
      if (!innerRef.current) return false;
      const editingEl = document.getElementById(String(zone.editingItemId));
      return editingEl?.contains(innerRef.current) ?? false;
    });

    const activedescendantId = kernel.useComputed((s) => {
      if (target !== "virtual" || !controls) return null;
      const focusedId = s.os.focus.zones[zoneId]?.focusedItemId ?? null;
      return focusedId && focusedId !== name ? focusedId : null;
    });

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
      if (
        !isContentEditableRef.current &&
        value !== registryValueRef.current
      ) {
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
    }, [fieldId, trigger, resetOnSubmit]); // Re-bind if config changes

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
      "aria-controls": controls,
      "aria-activedescendant": activedescendantId || undefined,
      children: null,
      ...otherProps,
    };

    const setInnerRef = (node: HTMLElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    };

    return <FocusItem id={fieldId} as={as} ref={setInnerRef} {...baseProps} />;
  },
);

FieldBase.displayName = "Field";

export const Field = Object.assign(FieldBase, {
  Label,
});
