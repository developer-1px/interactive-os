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
import type { FieldMode } from "./6-components/field/Field";
import type { FieldType } from "./6-components/field/FieldRegistry";
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

/**
 * TriggerBinding — declarative item-level callback registration.
 * Push model: declared in zone.bind(), auto-registered by goto().
 * Replaces FocusItem useLayoutEffect pull model.
 */
export interface TriggerBinding {
  /** Item ID (must match FocusItem/Trigger id prop) */
  id: string;
  /** Command to dispatch on activation (Enter key or click) */
  onActivate: BaseCommand;
}

export interface ZoneBindings {
  role: ZoneRole;
  onCheck?: ZoneCallback;
  onAction?: ZoneCallback;
  onSelect?: ZoneCallback;
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
  getItems?: () => string[];
  getExpandableItems?: () => Set<string>;
  getTreeLevels?: () => Map<string, number>;
  onReorder?: (info: {
    itemId: string;
    overItemId: string;
    position: "before" | "after";
  }) => void;
  /** Declarative item-level callbacks — push model for headless */
  triggers?: TriggerBinding[];
}

export interface FieldBindings {
  /** Field name — used as FieldRegistry ID. Must match <Field name="..."> prop. */
  fieldName?: string;
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
  Zone: React.FC<{
    id?: string;
    className?: string;
    children?: ReactNode;
    /** Data: which items are expandable (have children). Not behavior. */
    getExpandableItems?: () => Set<string>;
  }>;
  Item: React.FC<{
    id: string | number;
    className?: string;
    children?:
    | ReactNode
    | ((state: {
      isFocused: boolean;
      isSelected: boolean;
      isExpanded: boolean;
      isAnchor?: boolean;
    }) => ReactNode);
    asChild?: boolean;
  }>;
  Field: React.FC<{
    name: string;
    value?: string;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    mode?: FieldMode;
    fieldType?: FieldType;
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
  readonly runtime: any; // Exposed for integration tests (typed as any to avoid circular dep with @kernel/core)
  dispatch(command: BaseCommand): boolean;
  reset(): void;
  evaluate(condition: Condition<S>): boolean;
  select<T>(selector: Selector<S, T>): T;
  transaction(fn: () => void): void;
}

// ═══════════════════════════════════════════════════════════════════
// AppPage — Playwright Page isomorphic headless interface
// ═══════════════════════════════════════════════════════════════════

export interface AppPage<S> {
  /** Navigate to a zone (like page.goto). Sets active zone + focused item. */
  goto(
    zoneName: string,
    opts?: {
      focusedItemId?: string | null;
      config?: Partial<
        import("@os/schemas/focus/config/FocusGroupConfig").FocusGroupConfig
      >;
    },
  ): void;

  /** Keyboard input — Playwright page.keyboard isomorphic. */
  keyboard: {
    press(key: string): void;
    /** Type text into the active field — Playwright page.keyboard.type() isomorphic. */
    type(text: string): void;
  };

  /** Click an item by ID — Playwright page.click() isomorphic. */
  click(
    itemId: string,
    opts?: { shift?: boolean; meta?: boolean; ctrl?: boolean; zoneId?: string },
  ): void;

  /** Get computed ARIA attributes for an item (headless DOM projection). */
  attrs(itemId: string, zoneId?: string): import("./defineApp.page").ItemAttrs;

  /** Currently focused item ID. */
  focusedItemId(zoneId?: string): string | null;

  /** Current selection. */
  selection(zoneId?: string): string[];

  /** Active zone ID. */
  activeZoneId(): string | null;

  /** App state (direct access — bonus over Playwright). */
  readonly state: S;

  /** Dispatch a command directly (for setup, not interaction). */
  dispatch(command: BaseCommand): boolean;

  /** Reset to initial state. */
  reset(): void;

  /** Clean up zone registrations. */
  cleanup(): void;

  // ── Projection Checkpoint (optional — requires Component) ────────

  /** Check if search string exists in rendered HTML (renderToString). */
  query(search: string): boolean;

  /** Get the full rendered HTML string. */
  html(): string;
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

  // ── Internal (for OS-level createPage) ────────────────────────────
  /** @internal App ID for OS-level createPage. */
  readonly __appId: string;
  /** @internal Zone binding entries for OS-level createPage. */
  readonly __zoneBindings: Map<
    string,
    import("./defineApp.page").ZoneBindingEntry
  >;
}
