/**
 * FieldTextarea — Native <textarea> wrapper with OS focus + FieldRegistry integration.
 *
 * Use for multi-line form inputs (descriptions, comments, notes).
 * Owns ↑↓ keys for cursor movement within text (fieldType="block").
 *
 * Usage:
 *   <Field.Textarea name="description" value={desc} onCommit={commitDesc} />
 */

import type { BaseCommand } from "@kernel";
import { useFocusGroupContext } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { os } from "@os/kernel.ts";
import type { FieldCommandFactory } from "@os/schemas/command/BaseCommand.ts";
import {
  forwardRef,
  type TextareaHTMLAttributes,
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

export interface FieldTextareaProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
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

export const FieldTextarea = forwardRef<
  HTMLTextAreaElement,
  FieldTextareaProps
>(
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

    const innerRef = useRef<HTMLTextAreaElement>(null);

    // Stable refs
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
        fieldType: "block",
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
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Escape" && onCancelRef.current) {
          os.dispatch(onCancelRef.current);
        }
      },
      [],
    );

    // --- Ref merging ---
    const setRef = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
          node;
    };

    // --- Render ---
    const localValue = registryValueRef.current ?? value;

    return (
      <FocusItem id={name} as="span">
        <textarea
          ref={setRef}
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

FieldTextarea.displayName = "Field.Textarea";
