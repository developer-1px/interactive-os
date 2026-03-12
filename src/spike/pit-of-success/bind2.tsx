/**
 * bind2 — Spike implementation of pit-of-success projection model.
 *
 * Key difference from bind():
 *   - zone.items((item) => JSX) — entity scope closure
 *   - item.field(name) → unstyled component with ARIA baked in
 *   - item.when(name) → boolean (condition-based)
 *   - item.trigger(name) → unstyled button with data-trigger attrs
 *
 * This is a SPIKE: standalone, does not modify existing defineApp/bind.
 */

import React, { type ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

/** Field schema: maps field names to their types for a zone's entity */
export interface FieldSchema {
  [fieldName: string]: {
    type: "string" | "boolean" | "number";
    /** Resolve field value from entity. Called at render time. */
    resolve: (entityId: string) => unknown;
  };
}

/** Condition schema: maps condition names to item-level boolean predicates */
export interface ConditionSchema {
  [conditionName: string]: {
    /** Resolve condition for a specific item */
    resolve: (entityId: string) => boolean;
  };
}

/** Trigger schema: maps trigger names to their callbacks */
export interface TriggerSchema {
  [triggerName: string]: {
    /** Label for the trigger button */
    label?: string;
  };
}

/** The item context passed to the items() callback — the ONLY data exit */
export interface ItemContext {
  /** The item's ID */
  readonly id: string;

  /**
   * Returns an unstyled component that renders the field value with correct ARIA.
   * - string → <span>{value}</span>
   * - boolean → <input type="checkbox" checked aria-checked />
   * - number → <span>{value}</span>
   */
  field(name: string): React.ReactElement;

  /**
   * Returns a boolean from a named condition.
   * Used for conditional rendering without entity scope leak.
   */
  when(name: string): boolean;

  /**
   * Returns an unstyled button element with data-trigger attrs.
   * The button dispatches the named trigger on click.
   */
  trigger(name: string, children?: ReactNode): React.ReactElement;
}

/** bind2 config */
export interface Bind2Config {
  role: string;
  fields: FieldSchema;
  conditions?: ConditionSchema;
  triggers?: TriggerSchema;
  /** Provide the list of item IDs to render */
  getItems: () => string[];
}

/** bind2 return value */
export interface Bind2Result {
  /** Zone wrapper component */
  Zone: React.FC<{ className?: string; children?: ReactNode }>;
  /** Item iterator — the pit of success pattern */
  items: (callback: (item: ItemContext) => ReactNode) => React.ReactElement;
}

// ═══════════════════════════════════════════════════════════════════
// Field Renderers — unstyled components with ARIA
// ═══════════════════════════════════════════════════════════════════

function renderField(
  name: string,
  type: "string" | "boolean" | "number",
  value: unknown,
  itemId: string,
): React.ReactElement {
  switch (type) {
    case "boolean": {
      const checked = Boolean(value);
      return React.createElement("input", {
        type: "checkbox",
        checked,
        "aria-checked": String(checked),
        "data-field": name,
        "data-item-id": itemId,
        readOnly: true,
      });
    }
    case "string":
      return React.createElement(
        "span",
        { "data-field": name, "data-item-id": itemId },
        String(value ?? ""),
      );
    case "number":
      return React.createElement(
        "span",
        { "data-field": name, "data-item-id": itemId },
        String(value ?? 0),
      );
  }
}

// ═══════════════════════════════════════════════════════════════════
// bind2 — Spike Implementation
// ═══════════════════════════════════════════════════════════════════

export function bind2(config: Bind2Config): Bind2Result {
  const { role, fields, conditions, triggers, getItems } = config;

  // ── Zone component ──
  const Zone: React.FC<{ className?: string; children?: ReactNode }> = ({
    className,
    children,
  }) => {
    return React.createElement(
      "div",
      { role, className, "data-zone": true },
      children,
    );
  };

  // ── items() — iterator with entity scope closure ──
  function items(
    callback: (item: ItemContext) => ReactNode,
  ): React.ReactElement {
    const itemIds = getItems();

    const elements = itemIds.map((itemId) => {
      // Create ItemContext — the ONLY data exit for this item
      const ctx: ItemContext = {
        id: itemId,

        field(name: string): React.ReactElement {
          const schema = fields[name];
          if (!schema) {
            throw new Error(
              `[bind2] Unknown field "${name}". Available: ${Object.keys(fields).join(", ")}`,
            );
          }
          const value = schema.resolve(itemId);
          return renderField(name, schema.type, value, itemId);
        },

        when(name: string): boolean {
          const condition = conditions?.[name];
          if (!condition) {
            throw new Error(
              `[bind2] Unknown condition "${name}". Available: ${Object.keys(conditions ?? {}).join(", ")}`,
            );
          }
          return condition.resolve(itemId);
        },

        trigger(name: string, children?: ReactNode): React.ReactElement {
          const trigger = triggers?.[name];
          if (!trigger) {
            throw new Error(
              `[bind2] Unknown trigger "${name}". Available: ${Object.keys(triggers ?? {}).join(", ")}`,
            );
          }
          return React.createElement(
            "button",
            {
              "data-trigger-id": name,
              "data-trigger-payload": itemId,
            },
            children ?? trigger.label ?? name,
          );
        },
      };

      return React.createElement(
        "div",
        { key: itemId, id: itemId, "data-item": true },
        callback(ctx),
      );
    });

    return React.createElement(React.Fragment, null, ...elements);
  }

  return { Zone, items };
}
