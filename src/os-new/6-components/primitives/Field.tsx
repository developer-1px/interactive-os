import { useFieldFocus } from "@os/5-hooks/useFieldHooks.ts";
import type { HTMLAttributes } from "react";
import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { kernel } from "@os/kernel.ts";
import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import type { BaseCommand } from "@kernel";
import type { FieldCommandFactory } from "@os/schema/command/BaseCommand.ts";
import type { FocusTarget } from "@os/schema/focus/FocusTarget.ts";
import {
  type FieldConfig,
  FieldRegistry,
  useFieldRegistry,
} from "./FieldRegistry";

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
  placeholder?: string;
  customClassName?: string;
}

/**
 * Composes the Tailwind classes for the field.
 *
 * Visual States:
 * - Default: No special styling
 * - Focused (Selected): Ring outline indicating selection
 * - Editing (Active): Blue ring + blue tint background indicating input mode
 */
const getFieldClasses = ({
  isFocused: _isFocused,
  isEditing,
  multiline,
  value,
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
  // Editing: Blue ring + blue tint background (clearly "input mode")
  // Focused: Default focus ring (from FocusItem or custom)
  const stateClasses = isEditing
    ? "ring-2 ring-blue-500 bg-blue-500/10 rounded-sm"
    : "";

  // User's customClassName comes LAST to allow full control over display, sizing, etc.
  // Field only provides: placeholder, whitespace handling, state feedback, and min-height
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
  onSubmit?: FieldCommandFactory; // Field injects { text: currentValue }
  onChange?: FieldCommandFactory; // Field injects { text: currentValue }
  onCancel?: BaseCommand;
  updateType?: string;
  onCommit?: (value: string) => void;
  onSync?: (value: string) => void;
  onCancelCallback?: () => void;
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
 * - Delegates all event handling to InputSensor (pipeline)
 *
 * NO event handlers - all logic in InputSensor + InputIntent.
 */
const FieldBase = forwardRef<HTMLElement, FieldProps>(
  (
    {
      value,
      name,
      placeholder,
      multiline = false,
      onSubmit,
      onChange,
      onCancel,
      updateType,
      onCommit,
      mode = "immediate",
      target = "real",
      controls,
      blurOnInactive = false,
      as = "span",
      ...rest
    },
    ref,
  ) => {
    const context = useFocusGroupContext();
    const zoneId = context?.zoneId || "unknown";
    const activeZoneId = kernel.useComputed((s) => s.os.focus.activeZoneId);
    const osFocusedItemId = kernel.useComputed(
      (s) => s.os.focus.zones[zoneId]?.focusedItemId ?? null,
    );

    const innerRef = useRef<HTMLElement>(null);
    const cursorRef = useRef<number | null>(null);

    // --- Identity ---
    const fieldId = name || "unknown-field";

    // --- Registry Binding ---
    useEffect(() => {
      if (!name) return;
      const config: FieldConfig = {
        name,
        mode,
        multiline,
        ...(onSubmit !== undefined ? { onSubmit } : {}),
        ...(onChange !== undefined ? { onChange } : {}),
        ...(onCancel !== undefined ? { onCancel } : {}),
        ...(updateType !== undefined ? { updateType } : {}),
        ...(onCommit !== undefined ? { onCommit } : {}),
      };
      FieldRegistry.register(name, config);
      return () => FieldRegistry.unregister(name);
    }, [
      name,
      mode,
      multiline,
      onSubmit,
      onChange,
      onCancel,
      updateType,
      onCommit,
    ]);

    // --- State Subscription ---
    const fieldData = useFieldRegistry((s) => s.fields.get(fieldId));
    const isEditing = fieldData?.state.isEditing ?? false;
    const localValue = fieldData?.state.localValue ?? value;

    // Sync prop value to registry when NOT editing
    useEffect(() => {
      if (!isEditing && value !== fieldData?.state.localValue) {
        FieldRegistry.updateValue(fieldId, value);
      }
    }, [value, isEditing, fieldId, fieldData?.state.localValue]);

    // --- Focus Computation ---
    const isSystemActive = activeZoneId === zoneId;
    const isFocused = isSystemActive && osFocusedItemId === fieldId;
    const isContentEditable =
      mode === "deferred" ? isFocused && isEditing : isFocused;
    const isActive = isContentEditable;

    // --- Initial Value (set once on mount via ref) ---
    // contentEditable manages its own DOM, we only set initial value
    const initialValueRef = useRef(value);
    const hasInitialized = useRef(false);

    useLayoutEffect(() => {
      if (innerRef.current && !hasInitialized.current) {
        innerRef.current.innerText = initialValueRef.current;
        hasInitialized.current = true;
      }
    }, []);

    // Reset when value prop becomes empty (e.g., after submit)
    const prevValueRef = useRef(value);
    useLayoutEffect(() => {
      if (innerRef.current && prevValueRef.current !== value && value === "") {
        innerRef.current.innerText = "";
      }
      prevValueRef.current = value;
    }, [value]);

    const shouldHaveDOMFocus = mode === "deferred" ? isFocused : isActive;
    useFieldFocus({
      innerRef,
      isActive: shouldHaveDOMFocus,
      blurOnInactive,
      cursorRef,
    });

    // --- Styling ---
    const { className: customClassName, ...otherProps } = rest as any;
    const composeProps = getFieldClasses({
      isFocused,
      isEditing,
      multiline,
      value: localValue,
      ...(placeholder !== undefined ? { placeholder } : {}),
      customClassName,
    });

    // --- Base Props (Projection Only) ---
    const baseProps = {
      id: fieldId,
      contentEditable: isContentEditable,
      suppressContentEditableWarning: true,
      role: "textbox",
      "aria-multiline": multiline,
      tabIndex: 0,
      className: composeProps,
      "data-placeholder": placeholder,
      "data-mode": mode,
      "data-editing":
        mode === "deferred" ? (isEditing ? "true" : undefined) : undefined,
      "data-focused": isFocused ? "true" : undefined,
      "aria-controls": controls,
      "aria-activedescendant":
        target === "virtual" &&
          controls &&
          osFocusedItemId &&
          osFocusedItemId !== name
          ? osFocusedItemId
          : undefined,
      children: null, // Managed by useFieldDOMSync
      ...otherProps,
    };

    const setInnerRef = (node: HTMLElement | null) => {
      (innerRef as any).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as any).current = node;
    };

    return <FocusItem id={fieldId} as={as} ref={setInnerRef} {...baseProps} />;
  },
);

FieldBase.displayName = "Field";

import { Label } from "./Label";

// Namespace merge — attach Label as Field.Label (same pattern as Trigger.Portal)
export const Field = Object.assign(FieldBase, {
  Label,
});
