/**
 * locator — Playwright Locator factory for headless environment.
 *
 * Creates a locator that resolves element attributes from OS state.
 * Supports :focus pseudo-selector, #id selectors, and [data-item] multi-element selectors.
 *
 * Multi-element selectors (e.g., [data-item]) resolve all matching items
 * from ZoneRegistry. Use .nth(n), .first(), .last() to narrow to a single element.
 */

import { readFocusedItemId, resolveElement } from "@os-core/3-inject/compute";
import { os } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { simulateClick } from "../simulate";
import type { Locator, LocatorAssertions } from "../types";
import type { Projection } from "./projection";

/**
 * Extended locator with internal expect() hooks.
 * Extends Locator (Playwright subset) with _toBeFocused/_toHaveAttribute
 * used by the custom expect() implementation.
 */
export interface HeadlessLocator extends Locator {
  readonly attrs: import("@os-core/3-inject/headless.types").ElementAttrs;
  _toBeFocused(negated?: boolean): void;
  _toHaveAttribute(
    name: string,
    value?: string | RegExp,
    negated?: boolean,
  ): void;
}

// ─── Active zone filter for scoped item resolution ───────────────
// When set, resolveAllItems("[data-item]") returns items from this zone only.
// Used by runScenarios to scope per-scenario tests.
// null = return items from all zones (E2E/browser behavior).

let _activeZoneFilter: string | null = null;

/** Scope [data-item] resolution to a specific zone. null = all zones. */
export function setActiveZoneFilter(zoneId: string | null): void {
  _activeZoneFilter = zoneId;
}

// ─── Resolve all item IDs matching a CSS-like selector ─────────────

function resolveAllItems(selector: string): string[] {
  if (selector === "[data-item]") {
    if (_activeZoneFilter) {
      // Scoped: return items from the active zone only
      const entry = ZoneRegistry.get(_activeZoneFilter);
      return entry?.getItems?.() ?? [];
    }
    // Unscoped: collect items from ALL registered zones
    const allItems: string[] = [];
    for (const zoneId of ZoneRegistry.keys()) {
      const entry = ZoneRegistry.get(zoneId);
      const items = entry?.getItems?.() ?? [];
      allItems.push(...items);
    }
    return allItems;
  }
  // Unsupported multi-element selector
  return [];
}

// ─── Assertion helpers ─────────────────────────────────────────────

function createNegatedLocator(elementId: string): LocatorAssertions {
  return {
    toHaveAttribute(_name: string, _value?: string | RegExp) {},
    toBeFocused() {},
    toBeChecked() {},
    toBeDisabled() {},
    get not(): LocatorAssertions {
      return createPositiveLocator(elementId);
    },
  };
}

function createPositiveLocator(elementId: string): LocatorAssertions {
  return {
    toHaveAttribute(_name: string, _value?: string | RegExp) {},
    toBeFocused() {},
    toBeChecked() {},
    toBeDisabled() {},
    get not(): LocatorAssertions {
      return createNegatedLocator(elementId);
    },
  };
}

// ─── Multi-element locator (for [data-item] etc.) ──────────────────

function createMultiLocator(
  selector: string,
  projection: Projection | null,
): HeadlessLocator {
  // Resolve items lazily (zone state may change between locator creation and use)
  function getItems(): string[] {
    return resolveAllItems(selector);
  }

  function resolveFirst(): HeadlessLocator {
    const items = getItems();
    if (items.length === 0) {
      throw new Error(
        `locator("${selector}"): no matching elements found`,
      );
    }
    return createLocator(`#${items[0]}`, projection);
  }

  // Multi-element locator: click/getAttribute/assertions operate on FIRST match
  // Use .nth(n), .first(), .last() to target specific elements
  const firstProxy = (): HeadlessLocator => resolveFirst();

  return {
    get attrs() {
      return firstProxy().attrs;
    },
    getAttribute(name: string) {
      return firstProxy().getAttribute(name);
    },
    click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }) {
      return firstProxy().click(opts);
    },
    toHaveAttribute(name: string, value?: string | RegExp) {
      return firstProxy().toHaveAttribute(name, value);
    },
    toBeFocused() {
      return firstProxy().toBeFocused();
    },
    toBeChecked() {
      return firstProxy().toBeChecked();
    },
    toBeDisabled() {
      return firstProxy().toBeDisabled();
    },
    inputValue() {
      return firstProxy().inputValue();
    },
    get not(): LocatorAssertions {
      return firstProxy().not;
    },
    nth(index: number): Locator {
      const items = getItems();
      if (index < 0 || index >= items.length) {
        throw new Error(
          `locator("${selector}").nth(${index}): index out of range (${items.length} items)`,
        );
      }
      return createLocator(`#${items[index]}`, projection);
    },
    first(): Locator {
      return resolveFirst();
    },
    last(): Locator {
      const items = getItems();
      if (items.length === 0) {
        throw new Error(
          `locator("${selector}").last(): no matching elements`,
        );
      }
      return createLocator(`#${items[items.length - 1]}`, projection);
    },
    count(): number {
      return getItems().length;
    },
    _toBeFocused(negated?: boolean) {
      return firstProxy()._toBeFocused(negated);
    },
    _toHaveAttribute(name: string, value?: string | RegExp, negated?: boolean) {
      return firstProxy()._toHaveAttribute(name, value, negated);
    },
  };
}

// ─── Single-element locator (for #id) ──────────────────────────────

export function createLocator(
  selector: string,
  projection: Projection | null,
): HeadlessLocator {
  // :focus pseudo-selector
  if (selector === ":focus") {
    const focusedId = readFocusedItemId(os);
    if (!focusedId) {
      throw new Error('locator(":focus"): no element is currently focused');
    }
    return createLocator("#" + focusedId, projection);
  }

  // Multi-element selector (e.g., [data-item])
  if (!selector.startsWith("#")) {
    return createMultiLocator(selector, projection);
  }

  const elementId = selector.slice(1);
  if (projection) projection.assertElement(elementId);

  return {
    get attrs() {
      return resolveElement(os, elementId);
    },
    getAttribute(name: string) {
      const resolved = resolveElement(os, elementId);
      const key = name === "tabindex" ? "tabIndex" : name;
      const val = resolved[key];
      if (val === true) return "true";
      if (val === false) return "false";
      if (val === undefined || val === null) return null;
      return String(val);
    },
    click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }) {
      const mods = opts?.modifiers ?? [];
      simulateClick(os, elementId, {
        meta: mods.includes("Meta"),
        shift: mods.includes("Shift"),
        ctrl: mods.includes("Control"),
      });
    },
    toHaveAttribute(_name: string, _value?: string | RegExp) {},
    toBeFocused() {},
    toBeChecked() {},
    toBeDisabled() {},
    inputValue() {
      return String(FieldRegistry.getValue(elementId) ?? "");
    },
    get not(): LocatorAssertions {
      return createNegatedLocator(elementId);
    },
    nth(index: number): Locator {
      if (index !== 0) {
        throw new Error(
          `locator("#${elementId}").nth(${index}): ID selector matches exactly one element`,
        );
      }
      return createLocator(`#${elementId}`, projection);
    },
    first(): Locator {
      return createLocator(`#${elementId}`, projection);
    },
    last(): Locator {
      return createLocator(`#${elementId}`, projection);
    },
    count(): number {
      return 1;
    },
    _toBeFocused(negated?: boolean) {
      const focused = readFocusedItemId(os) === elementId;
      const passed = negated ? !focused : focused;
      if (!passed) {
        const actual = readFocusedItemId(os);
        throw new Error(
          negated
            ? `Expected #${elementId} NOT to be focused but it was`
            : `Expected #${elementId} to be focused but focused is #${actual}`,
        );
      }
    },
    _toHaveAttribute(name: string, value?: string | RegExp, negated?: boolean) {
      const attrKey = name === "tabindex" ? "tabIndex" : name;
      const raw = resolveElement(os, elementId)[attrKey];
      if (value === undefined) {
        const exists = raw != null;
        const passed = negated ? !exists : exists;
        if (!passed) {
          throw new Error(
            negated
              ? `Expected [${name}] to be absent but it exists (value: "${raw}")`
              : `Expected [${name}] to exist but it was absent`,
          );
        }
        return;
      }
      const actual =
        raw === true
          ? "true"
          : raw === false
            ? "false"
            : raw == null
              ? null
              : String(raw);
      const expected = typeof value === "string" ? value : undefined;
      const matches = actual === expected;
      const passed = negated ? !matches : matches;
      if (!passed) {
        throw new Error(
          negated
            ? `Expected [${name}] NOT to be "${expected}" but it was`
            : `Expected [${name}] to be "${expected}" but got "${actual}"`,
        );
      }
    },
  };
}
