// Generic command type that primitives can work with
export interface BaseCommand {
    type: string;
    payload?: any;
}

/**
 * Command factory for Field props (onChange, onSubmit).
 * Field will automatically inject { text: currentValue } when invoking.
 */
export type FieldCommandFactory<P extends { text: string } = { text: string }> =
    ((payload: P) => BaseCommand) & { id: string; _def?: any };
