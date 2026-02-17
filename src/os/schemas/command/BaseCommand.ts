/**
 * FieldCommandFactory — Command factory type for Field props (onChange, onSubmit).
 *
 * Field will automatically inject { text: currentValue } when invoking.
 * BaseCommand itself is now defined in @kernel.
 */
import type { BaseCommand } from "@kernel";

export type FieldCommandFactory<P extends { text: string } = { text: string }> =
  ((payload: P) => BaseCommand) & { id: string; _def?: any };
