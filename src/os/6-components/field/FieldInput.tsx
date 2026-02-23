/**
 * FieldInput — Native <input> wrapper with OS focus + FieldRegistry integration.
 *
 * Use for form panels, property panels, settings — anywhere native <input> is appropriate.
 * Delegates Tab and ↑↓ to OS for zone navigation.
 *
 * Usage:
 *   <Field.Input name="color" value={color} onCommit={commitColor} />
 */

import type { BaseCommand } from "@kernel";
import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { os } from "@os/kernel.ts";
import type { FieldCommandFactory } from "@os/schemas/command/BaseCommand.ts";
import {
  forwardRef,
  type InputHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ZodSchema } from "zod";
import {
  type FieldConfig,
  FieldRegistry,
  type FieldTrigger,
  useFieldRegistry,
} from "./FieldRegistry";

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

export interface FieldInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "onBlur" | "onFocus" | "onSubmit" | "value" | "name"
  > {
  value: string;
  name: string;
  onCommit?: FieldCommandFactory;
  trigger?: FieldTrigger;
  schema?: ZodSchema;
  onCancel?: BaseCommand;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  (
    {
      value,
      name,
      onCommit,
      trigger: triggerProp,
      schema,
      onCancel,
      className,
      ...rest
    },
    ref,
  ) => {
    const trigger: FieldTrigger = triggerProp ?? "blur";
    const context = useFocusGroupContext();
    const zoneId = context?.zoneId || "unknown";

    const innerRef = useRef<HTMLInputElement>(null);

    // Stable refs for callbacks
    const onCommitRef = useRef(onCommit);
    const onCancelRef = useRef(onCancel);
    const schemaRef = useRef(schema);
    onCommitRef.current = onCommit;
    onCancelRef.current = onCancel;
    schemaRef.current = schema;

    // --- Commit ---
    const handleCommit = useCallback(
      (currentValue: string) => {
        const commitCmd = onCommitRef.current;
        if (!commitCmd) return;

        if (schemaRef.current) {
          const result = schemaRef.current.safeParse(currentValue);
          if (!result.success) {
            const errorMessage =
              result.error.issues[0]?.message ?? "Validation failed";
            FieldRegistry.setError(name, errorMessage);
            return;
          }
        }

        FieldRegistry.setError(name, null);
        const command = commitCmd({ text: currentValue });
        os.dispatch(command);
      },
      [name],
    );

    // --- Registry Registration ---
    useEffect(() => {
      const config: FieldConfig = {
        name,
        mode: "immediate",
        fieldType: "inline",
        trigger,
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
    }, [name, trigger, schema]);

    // --- Sync prop value to registry ---
    const registryValueRef = useRef<string | undefined>(undefined);
    registryValueRef.current = useFieldRegistry(
      (s) => s.fields.get(name)?.state.value,
    );

    useEffect(() => {
      if (value !== registryValueRef.current) {
        FieldRegistry.updateValue(name, value);
      }
    }, [value, name]);

    // --- Error ---
    const error = useFieldRegistry((s) => s.fields.get(name)?.state.error);

    // --- Focus ---
    const isFocused = os.useComputed(
      (s) =>
        s.os.focus.activeZoneId === zoneId &&
        (s.os.focus.zones[zoneId]?.focusedItemId ?? null) === name,
    );

    // --- Event Handlers ---
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        FieldRegistry.updateValue(name, val);
        if (trigger === "change") {
          handleCommit(val);
        }
      },
      [name, trigger, handleCommit],
    );

    const handleBlur = useCallback(() => {
      if (trigger === "blur") {
        handleCommit(FieldRegistry.getValue(name));
      }
    }, [name, trigger, handleCommit]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (trigger === "enter") {
            handleCommit(FieldRegistry.getValue(name));
          }
        }
        if (e.key === "Escape" && onCancelRef.current) {
          os.dispatch(onCancelRef.current);
        }
      },
      [name, trigger, handleCommit],
    );

    // --- Ref merging ---
    const setRef = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    // --- Render ---
    const localValue = registryValueRef.current ?? value;

    return (
      <FocusItem id={name} as="span">
        <input
          ref={setRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-invalid={!!error}
          aria-errormessage={error || undefined}
          data-focused={isFocused ? "true" : undefined}
          className={className}
          {...rest}
        />
      </FocusItem>
    );
  },
);

FieldInput.displayName = "Field.Input";
