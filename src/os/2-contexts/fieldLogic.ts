/**
 * fieldLogic — Pure functions for Field / FieldInput / FieldTextarea.
 *
 * All functions here are pure (no DOM, no React, no side effects).
 * Only contains logic shared across 3+ Field variants.
 */

import type { BaseCommand } from "@kernel";
import type { FieldCommandFactory } from "@os/schemas/command/BaseCommand.ts";
import type { ZodSchema } from "zod";
import type { FieldConfig, FieldTrigger, FieldType } from "./FieldRegistry";

// ═══════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate a value against an optional Zod schema.
 * Pure function — no side effects.
 */
export function validateField(
    value: string,
    schema?: ZodSchema,
): ValidationResult {
    if (!schema) return { valid: true };
    const result = schema.safeParse(value);
    if (result.success) return { valid: true };
    return {
        valid: false,
        error: result.error.issues[0]?.message ?? "Validation failed",
    };
}

// ═══════════════════════════════════════════════════════════════════
// Field Config Builder
// ═══════════════════════════════════════════════════════════════════

export interface FieldConfigInputs {
    name: string;
    mode: "immediate" | "deferred";
    fieldType: FieldType;
    trigger: FieldTrigger;
    resetOnSubmit?: boolean;
    onCommit?: FieldCommandFactory;
    schema?: ZodSchema;
    onCancel?: BaseCommand;
}

/**
 * Build a FieldConfig from inputs.
 * Pure function — used by Field, FieldInput, and FieldTextarea.
 *
 * Eliminates config-building duplication across Field variants.
 */
export function buildFieldConfig(inputs: FieldConfigInputs): FieldConfig {
    return {
        name: inputs.name,
        mode: inputs.mode,
        fieldType: inputs.fieldType,
        trigger: inputs.trigger,
        ...(inputs.resetOnSubmit !== undefined
            ? { resetOnSubmit: inputs.resetOnSubmit }
            : {}),
        ...(inputs.onCommit !== undefined ? { onCommit: inputs.onCommit } : {}),
        ...(inputs.schema !== undefined ? { schema: inputs.schema } : {}),
        ...(inputs.onCancel !== undefined ? { onCancel: inputs.onCancel } : {}),
    };
}
