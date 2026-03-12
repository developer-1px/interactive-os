/**
 * createZone — Spike: bind-less projection with Entity Scope Closure.
 *
 * Key differences from bind2:
 *   - No bind() step. createZone(config) → { Zone } directly.
 *   - <Zone>{(zone) => ...}</Zone> — zone callback provides everything.
 *   - zone.items((item) => JSX) — entity scope closure.
 *   - item.fieldName (property) — TS-inferred from fields config.
 *   - item.triggerName(children) — TS-inferred from triggers config.
 *   - zone.triggerName(children) — zone-level triggers.
 *   - zone.fieldName(opts) — zone-level fields.
 *
 * This is a SPIKE: standalone, does not modify existing defineApp/bind.
 */

import React, { type ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface FieldDef {
  type: "string" | "boolean" | "number";
  resolve: (entityId: string) => unknown;
}

interface TriggerDef {
  label?: string;
}

interface ZoneFieldDef {
  type: "string" | "boolean" | "number";
  resolve: () => unknown;
  placeholder?: string;
}

/** Mapped type: fields config → item properties (ReactElement) */
type ItemFields<F> = { readonly [K in keyof F]: React.ReactElement };

/** Mapped type: triggers config → item methods */
type ItemTriggers<T> = {
  [K in keyof T]: (children?: ReactNode) => React.ReactElement;
};

/** Full item context inside zone.items() callback */
type ItemContext<F, T> = { readonly id: string } & ItemFields<F> &
  ItemTriggers<T>;

/** Mapped type: zoneTriggers config → zone methods */
type ZoneTriggerMethods<ZT> = {
  [K in keyof ZT]: (children?: ReactNode) => React.ReactElement;
};

/** Mapped type: zoneFields config → zone methods */
type ZoneFieldMethods<ZF> = {
  [K in keyof ZF]: (opts?: { placeholder?: string }) => React.ReactElement;
};

/** Full zone context inside <Zone>{(zone) => ...}</Zone> */
type ZoneContext<F, T, ZF, ZT> = {
  readonly count: number;
  items(callback: (item: ItemContext<F, T>) => ReactNode): React.ReactElement;
} & ZoneTriggerMethods<ZT> &
  ZoneFieldMethods<ZF>;

interface ZoneConfig<
  F extends Record<string, FieldDef> = Record<string, never>,
  T extends Record<string, TriggerDef> = Record<string, never>,
  ZF extends Record<string, ZoneFieldDef> = Record<string, never>,
  ZT extends Record<string, TriggerDef> = Record<string, never>,
> {
  role: string;
  getItems?: () => string[];
  fields?: F;
  triggers?: T;
  zoneFields?: ZF;
  zoneTriggers?: ZT;
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

function createTriggerButton(
  name: string,
  label: string | undefined,
  children: ReactNode | undefined,
  payload?: string,
): React.ReactElement {
  const attrs: {
    type: "button";
    "data-trigger-id": string;
    "data-trigger-payload"?: string;
  } = {
    type: "button",
    "data-trigger-id": name,
  };
  if (payload !== undefined) {
    attrs["data-trigger-payload"] = payload;
  }
  return React.createElement("button", attrs, children ?? label ?? name);
}

// ═══════════════════════════════════════════════════════════════════
// Item builder — separated for complexity reduction
// ═══════════════════════════════════════════════════════════════════

function buildItemContext(
  itemId: string,
  fields: Record<string, FieldDef> | undefined,
  triggers: Record<string, TriggerDef> | undefined,
): Record<string, unknown> {
  const item: Record<string, unknown> = { id: itemId };

  if (fields) {
    for (const [name, def] of Object.entries(fields)) {
      Object.defineProperty(item, name, {
        get() {
          return renderField(name, def.type, def.resolve(itemId), itemId);
        },
        enumerable: true,
      });
    }
  }

  if (triggers) {
    for (const [name, def] of Object.entries(triggers)) {
      item[name] = (children?: ReactNode) =>
        createTriggerButton(name, def.label, children, itemId);
    }
  }

  return item;
}

// ═══════════════════════════════════════════════════════════════════
// createZone
// ═══════════════════════════════════════════════════════════════════

export function createZone<
  F extends Record<string, FieldDef> = Record<string, never>,
  T extends Record<string, TriggerDef> = Record<string, never>,
  ZF extends Record<string, ZoneFieldDef> = Record<string, never>,
  ZT extends Record<string, TriggerDef> = Record<string, never>,
>(config: ZoneConfig<F, T, ZF, ZT>) {
  const { role, getItems, fields, triggers, zoneFields, zoneTriggers } = config;

  function buildZoneContext(): ZoneContext<F, T, ZF, ZT> {
    const itemIds = getItems?.() ?? [];

    const zone: Record<string, unknown> = {
      count: itemIds.length,

      items(
        callback: (item: ItemContext<F, T>) => ReactNode,
      ): React.ReactElement {
        const elements = itemIds.map((itemId) => {
          const item = buildItemContext(
            itemId,
            fields as Record<string, FieldDef> | undefined,
            triggers as Record<string, TriggerDef> | undefined,
          );
          return React.createElement(
            "div",
            { key: itemId, id: itemId, "data-item": true },
            callback(item as ItemContext<F, T>),
          );
        });
        return React.createElement(React.Fragment, null, ...elements);
      },
    };

    if (zoneTriggers) {
      for (const [name, def] of Object.entries(zoneTriggers)) {
        zone[name] = (children?: ReactNode) =>
          createTriggerButton(name, def.label, children);
      }
    }

    if (zoneFields) {
      for (const [name, def] of Object.entries(zoneFields)) {
        zone[name] = (opts?: { placeholder?: string }) => {
          const value = def.resolve();
          if (def.type === "string") {
            return React.createElement("input", {
              type: "text",
              value: String(value ?? ""),
              placeholder: opts?.placeholder ?? def.placeholder,
              "data-zone-field": name,
              readOnly: true,
            });
          }
          return renderField(name, def.type, value, "zone");
        };
      }
    }

    return zone as ZoneContext<F, T, ZF, ZT>;
  }

  const Zone: React.FC<{
    className?: string;
    children: (zone: ZoneContext<F, T, ZF, ZT>) => ReactNode;
  }> = ({ className, children }) => {
    const zone = buildZoneContext();
    return React.createElement(
      "div",
      { role, className, "data-zone": true },
      children(zone),
    );
  };

  return { Zone };
}
