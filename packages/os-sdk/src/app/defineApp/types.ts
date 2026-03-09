/**
 * defineApp — Type Definitions
 *
 * All branded types, handler types, binding interfaces, and public API types
 * used by defineApp and its consumers.
 *
 * These are pure type declarations with zero runtime dependencies.
 */

import type { BaseCommand, CommandFactory } from "@kernel/core/tokens";
import type { FieldType } from "@os-core/engine/registries/fieldRegistry";
import type { ZoneRole } from "@os-core/engine/registries/roleRegistry";
import type { ZoneCallback } from "@os-core/engine/registries/zoneRegistry";
import type { FieldCommandFactory } from "@os-core/schema/types/command/BaseCommand";
import type { FieldMode } from "@os-react/6-project/field/Field";
import type React from "react";
import type { ReactNode } from "react";

/** Overlay config for zone.overlay() */
export interface ZoneOverlayConfig {
  confirm?: BaseCommand;
  role?: "dialog" | "alertdialog" | "menu" | "popover" | "tooltip" | "listbox";
}

/** OverlayHandle — L1 contract for overlay triggers. No React components. */
export interface OverlayHandle {
  overlayId: string;
  trigger: <T extends HTMLElement>(
    payload?: string,
  ) => React.HTMLAttributes<T> & {
    "data-trigger-id": string;
    "aria-haspopup"?: string;
    "aria-controls"?: string;
  };
}

import type { ZodSchema } from "zod";

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
  /** Cursor-based factory to dispatch on activation (Enter key or click) */
  onActivate: (focusId: string) => BaseCommand;
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
  options?: import("@os-react/6-project/Zone").ZoneOptions;
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

/** App-level keybinding — static command, string context guard */
export interface AppKeybindingEntry {
  key: string;
  command: BaseCommand;
  when?: "editing" | "navigating";
}

// ═══════════════════════════════════════════════════════════════════
// Zone Binding Entry — collected by defineApp.ts at zone.bind() time
// ═══════════════════════════════════════════════════════════════════

export interface ZoneBindingEntry {
  role: ZoneRole;
  bindings: ZoneBindings;
  keybindings?: KeybindingEntry<unknown>[];
  field?: FieldBindings;
  triggers?: TriggerBinding[];
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
          valueNow?: number;
        }) => ReactNode);
    asChild?: boolean;
  }> & {
    /** Passive projection of Item's visibility state — auto-manages role + aria-labelledby + hidden/mount */
    Content: React.FC<{
      for: string;
      id?: string;
      className?: string;
      children?: ReactNode;
    }>;
  };
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
    options?: {
      when?: Condition<S> | "editing" | "navigating";
      key?: string | string[];
    },
  ): CommandFactory<T, P>;

  /** Register a side-effect handler. Commands return `{ effectName: payload }` to trigger it. */
  defineEffect<V>(type: string, handler: (value: V) => void): void;

  createZone(name: string): ZoneHandle<S>;

  /** Declare an overlay trigger: id + config. Returns OverlayHandle (L1 contract). */
  overlay(id: string, config: ZoneOverlayConfig): OverlayHandle;

  bind<
    TriggerMap extends Record<
      string,
      (focusId: string) => BaseCommand
    > = Record<string, never>,
  >(
    config: Omit<ZoneBindings, "triggers"> & {
      field?: FieldBindings;
      keybindings?: {
        key: string;
        command: BaseCommand | ZoneCallback;
        when?: unknown;
      }[];
      /** Triggers: object map {Name: callback} */
      triggers?: TriggerMap;
    },
  ): BoundComponents<S> & {
    triggers: {
      [K in keyof TriggerMap]: <T extends HTMLElement>(
        payload?: string,
      ) => React.HTMLAttributes<T>;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════
// TestInstance
// ═══════════════════════════════════════════════════════════════════

export interface TestInstance<S> {
  readonly state: S;
  readonly runtime: unknown;
  dispatch(command: BaseCommand): boolean;
  reset(): void;
  evaluate(condition: Condition<S>): boolean;
  select<T>(selector: Selector<S, T>): T;
  transaction(fn: () => void): void;
}

// ═══════════════════════════════════════════════════════════════════
// AppPage — Playwright Page isomorphic headless interface
// ═══════════════════════════════════════════════════════════════════

/** Locator assertion subset — recursive via .not for Playwright compatibility */
export interface AppLocatorAssertions {
  toHaveAttribute(name: string, value: string | boolean | RegExp): void;
  toBeFocused(): void;
  toBeChecked(): void;
  toBeDisabled(): void;
  not: AppLocatorAssertions;
}

export interface AppPage<_S> {
  /**
   * Navigate to a URL — Playwright page.goto() isomorphic.
   *
   * Headless: registers all app zones from bindings and renders the
   * component tree (renderToString). No internal state seeding.
   * Playwright: delegates to native page.goto().
   */
  goto(url: string): void;

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
  attrs(
    itemId: string,
    zoneId?: string,
  ): import("@os-core/3-inject/headless.types").ItemAttrs;

  /** Currently focused item ID. */
  focusedItemId(zoneId?: string): string | null;

  /** Current selection. */
  selection(zoneId?: string): string[];

  /** Active zone ID. */
  activeZoneId(): string | null;

  /** @internal OS Kernel instance (for OS-level testing only). */
  readonly kernel: unknown;

  /** Reset to initial state. */
  reset(): void;

  /** Clean up zone registrations. */
  cleanup(): void;

  /** Dump OS diagnostics (schema-filtered transactions + zone snapshot). */
  dumpDiagnostics(): void;

  /** Playwright-style locator: query any element by ID (Zone or Item). */
  locator(elementId: string): {
    getAttribute(name: string): string | null;
    click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }): void;
    toHaveAttribute(name: string, value: string | boolean | RegExp): void;
    toBeFocused(): void;
    toBeChecked(): void;
    toBeDisabled(): void;
    inputValue(): string;
    readonly attrs: import("@os-core/3-inject/headless.types").ElementAttrs;
    /** Negated assertions — Playwright locator.not isomorphic. */
    not: AppLocatorAssertions;
  };

  // ── Projection Checkpoint (optional — requires Component) ────────

  /** Check if search string exists in rendered HTML (renderToString). */
  query(search: string): boolean;

  /** Get the full rendered HTML string. */
  html(): string;
}

/**
 * AppPageInternal — Extended AppPage with unit-test-only capabilities.
 *
 * Provides `dispatch` and `state` access for legitimate unit tests
 * that need to verify internal state or set up data without UI interaction.
 *
 * TestScript `run()` MUST NOT use this — only Playwright strict subset.
 * Unit tests (.test.ts) may use this via type assertion: `page as AppPageInternal<S>`.
 */
export interface AppPageInternal<S> extends AppPage<S> {
  kernel: import("@os-core/3-inject/headless.types").HeadlessKernel;
  getDOMElement(id: string): HTMLElement | null;
  /** Legacy setupZone */
  setupZone(
    target: string,
    opts?: {
      focusedItemId?: string | null;
      config?: Partial<
        import("@os-core/schema/types/focus/config/FocusGroupConfig").FocusGroupConfig
      >;
      role?: import("@os-core/engine/registries/roleRegistry").ZoneRole;
      initial?: { selection?: string[]; expanded?: string[] };
      items?: string[];
      expandableItems?: Set<string>;
      treeLevels?: Map<string, number>;
    },
  ): void;
  /** App state (direct access — unit test only, not for TestScript). */
  readonly state: S;

  /** Dispatch a command directly (unit test setup only, not for TestScript). */
  dispatch(command: BaseCommand): boolean;
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
    options?: {
      when?: Condition<S> | "editing" | "navigating";
      key?: string | string[];
    },
  ): CommandFactory<T, P>;
  /** Register a side-effect handler. Commands return `{ effectName: payload }` to trigger it. */
  defineEffect<V>(type: string, handler: (value: V) => void): void;
  createZone(name: string): ZoneHandle<S>;
  useComputed<T>(selector: Selector<S, T>): T;
  useComputed<T>(fn: (state: S) => T): T;
  create(
    overrides?: Partial<S> | { history?: boolean; withOS?: boolean },
  ): TestInstance<S>;

  /**
   * Register app-level keybindings.
   * Declarative: stores entries on the handle AND registers on Keybindings singleton.
   * Headless page reads __appKeybindings for lifecycle management.
   */
  keybindings(entries: AppKeybindingEntry[]): void;

  // ── Internal (for OS-level createPage) ────────────────────────────
  /** @internal App ID for OS-level createPage. */
  readonly __appId: string;
  /** @internal Zone binding entries for OS-level createPage. */
  readonly __zoneBindings: Map<string, ZoneBindingEntry>;
  /** @internal App-level keybinding entries for headless lifecycle. */
  readonly __appKeybindings: readonly AppKeybindingEntry[];
}
