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
import {
  buildFieldConfig,
  type FieldConfigInputs,
  validateField,
} from "@os-core/3-inject/fieldContext.ts";
import { os } from "@os-core/engine/kernel.ts";
import {
  FieldRegistry,
  type FieldTrigger,
  useFieldRegistry,
} from "@os-core/engine/registries/fieldRegistry";
import type { FieldCommandFactory } from "@os-core/schema/types/command/BaseCommand.ts";
import { Item } from "@os-react/6-project/Item.tsx";
import { useZoneContext } from "@os-react/6-project/Zone.tsx";
import {
  forwardRef,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ZodSchema } from "zod";

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
    const context = useZoneContext();
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

        const validation = validateField(currentValue, schemaRef.current);
        if (!validation.valid) {
          FieldRegistry.setError(name, validation.error!);
          return;
        }

        FieldRegistry.setError(name, null);
        const command = commitCmd({ text: currentValue });
        os.dispatch(command);
      },
      [name],
    );

    // --- Registry Registration (pure config build) ---
    useEffect(() => {
      const inputs: FieldConfigInputs = {
        name,
        mode: "immediate",
        fieldType: "block",
        trigger,
      };
      if (onCommitRef.current !== undefined)
        inputs.onCommit = onCommitRef.current;
      if (schema !== undefined) inputs.schema = schema;
      if (onCancelRef.current !== undefined)
        inputs.onCancel = onCancelRef.current;
      const config = buildFieldConfig(inputs);

      FieldRegistry.register(name, config);
      return () => FieldRegistry.unregister(name);
    }, [name, trigger, schema]);

    // --- Sync prop value to registry ---
    const registryValueRef = useRef<string | undefined>(undefined);
    const rawRegistryValue = useFieldRegistry(
      (s) => s.fields.get(name)?.state.value,
    );
    registryValueRef.current =
      rawRegistryValue != null ? String(rawRegistryValue) : undefined;

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
        handleCommit(String(FieldRegistry.getValue(name)));
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
      <Item id={name} as="span">
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
      </Item>
    );
  },
);

FieldTextarea.displayName = "Field.Textarea";
