/**
 * defineApp — Type Definitions
 *
 * All branded types, handler types, binding interfaces, and public API types
 * used by defineApp and its consumers.
 *
 * These are pure type declarations with zero runtime dependencies.
 */

import type { BaseCommand, CommandFactory } from "@kernel/core/tokens";
import type {
  CompoundTriggerComponents,
  CompoundTriggerConfig,
} from "@os/defineApp.trigger";
import type React from "react";
import type { ReactNode } from "react";
import type { ZodSchema } from "zod";
import type { ZoneCallback } from "./2-contexts/zoneRegistry";
import type { ZoneRole } from "./registries/roleRegistry";
import type { FieldCommandFactory } from "./schemas/command/BaseCommand";

// ═══════════════════════════════════════════════════════════════════
// Brand Symbols
// ═══════════════════════════════════════════════════════════════════

export const __conditionBrand = Symbol("condition");
export const __selectorBrand = Symbol("selector");

// ═══════════════════════════════════════════════════════════════════
// Branded Types
// ═══════════════════════════════════════════════════════════════════

/** Branded Condition — named boolean predicate for when guards */
export type Condition<S> = {
  readonly name: string;
  readonly evaluate: (state: S) => boolean;
  readonly [__conditionBrand]: true;
};

/** Branded Selector — named data derivation */
export type Selector<S, T> = {
  readonly name: string;
  readonly select: (state: S) => T;
  readonly [__selectorBrand]: true;
};

// ═══════════════════════════════════════════════════════════════════
// Handler Types
// ═══════════════════════════════════════════════════════════════════

export type CommandContext<S> = { readonly state: S };
export type HandlerResult<S> =
  | {
      state: S;
      dispatch?: BaseCommand | BaseCommand[] | undefined;
    }
  | undefined;

/** Flat handler: (ctx, payload) => result */
export type FlatHandler<S, P> = (
  ctx: CommandContext<S>,
  payload: P,
) => HandlerResult<S>;

// ═══════════════════════════════════════════════════════════════════
// Zone Bindings
// ═══════════════════════════════════════════════════════════════════

export interface ZoneBindings {
  role: ZoneRole;
  onCheck?: ZoneCallback;
  onAction?: ZoneCallback;
  onDelete?: ZoneCallback;
  onCopy?: ZoneCallback;
  onCut?: ZoneCallback;
  onPaste?: ZoneCallback;
  onMoveUp?: ZoneCallback;
  onMoveDown?: ZoneCallback;
  onUndo?: BaseCommand;
  onRedo?: BaseCommand;
  options?: import("@os/6-components/primitives/Zone").ZoneOptions;
  itemFilter?: (items: string[]) => string[];
}

export interface FieldBindings {
  onCommit?: FieldCommandFactory;
  trigger?: "change" | "blur" | "enter";
  schema?: ZodSchema;
  resetOnSubmit?: boolean;
  onCancel?: BaseCommand;
}

export interface KeybindingEntry<S> {
  key: string;
  command: ZoneCallback;
  when?: Condition<S>;
}

// ═══════════════════════════════════════════════════════════════════
// Bound Components (returned by bind)
// ═══════════════════════════════════════════════════════════════════

export interface BoundComponents<S> {
  Zone: React.FC<{ id?: string; className?: string; children?: ReactNode }>;
  Item: React.FC<{
    id: string | number;
    className?: string;
    children?: ReactNode;
    asChild?: boolean;
  }>;
  Field: React.FC<{
    name: string;
    value?: string;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    blurOnInactive?: boolean;
  }>;
  When: React.FC<{ condition: Condition<S>; children?: ReactNode }>;
}

// ═══════════════════════════════════════════════════════════════════
// ZoneHandle
// ═══════════════════════════════════════════════════════════════════

export interface ZoneHandle<S> {
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    options?: { when?: Condition<S> },
  ): CommandFactory<T, P>;

  createZone(name: string): ZoneHandle<S>;

  bind(
    config: ZoneBindings & {
      field?: FieldBindings;
      keybindings?: KeybindingEntry<S>[];
    },
  ): BoundComponents<S>;
}

// ═══════════════════════════════════════════════════════════════════
// TestInstance
// ═══════════════════════════════════════════════════════════════════

export interface TestInstance<S> {
  readonly state: S;
  readonly kernel: any; // Exposed for integration tests (typed as any to avoid circular dep with @kernel/core)
  dispatch(command: BaseCommand): boolean;
  reset(): void;
  evaluate(condition: Condition<S>): boolean;
  select<T>(selector: Selector<S, T>): T;
  transaction(fn: () => void): void;
}

// ═══════════════════════════════════════════════════════════════════
// AppHandle
// ═══════════════════════════════════════════════════════════════════

export interface AppHandle<S> {
  condition(name: string, predicate: (state: S) => boolean): Condition<S>;
  selector<T>(name: string, select: (state: S) => T): Selector<S, T>;
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    options?: { when?: Condition<S> },
  ): CommandFactory<T, P>;
  createZone(name: string): ZoneHandle<S>;
  createTrigger<P = void>(
    factory: CommandFactory<string, P>,
  ): React.FC<
    P extends void
      ? { children: ReactNode; payload?: never }
      : { children: ReactNode; payload: P }
  >;
  createTrigger(command: BaseCommand): React.FC<{
    children: ReactNode;
  }>;
  createTrigger(config: CompoundTriggerConfig): CompoundTriggerComponents;
  useComputed<T>(selector: Selector<S, T>): T;
  useComputed<T>(fn: (state: S) => T): T;
  create(
    overrides?: Partial<S> | { history?: boolean; withOS?: boolean },
  ): TestInstance<S>;
}
