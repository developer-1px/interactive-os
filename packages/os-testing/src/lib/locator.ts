/**
 * locator — Playwright Locator factory for headless environment.
 *
 * Creates a locator that resolves element attributes from OS state.
 * Supports :focus pseudo-selector and #id selectors.
 */

import { readFocusedItemId, resolveElement } from "@os-core/3-inject/compute";
import { os } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
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

function createNegatedLocator(elementId: string): LocatorAssertions {
  return {
    toHaveAttribute(_name: string, _value?: string | RegExp) {
      // Negated assertion — used via expect(locator).not.toHaveAttribute()
    },
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
    toHaveAttribute(_name: string, _value?: string | RegExp) {
      // Positive assertion — used via expect(locator).toHaveAttribute()
    },
    toBeFocused() {},
    toBeChecked() {},
    toBeDisabled() {},
    get not(): LocatorAssertions {
      return createNegatedLocator(elementId);
    },
  };
}

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

  const elementId = selector.startsWith("#") ? selector.slice(1) : selector;
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
    toHaveAttribute(_name: string, _value?: string | RegExp) {
      // Direct assertion on locator — actual checking done via _toHaveAttribute in expect()
    },
    toBeFocused() {},
    toBeChecked() {},
    toBeDisabled() {},
    inputValue() {
      return String(FieldRegistry.getValue(elementId) ?? "");
    },
    get not(): LocatorAssertions {
      return createNegatedLocator(elementId);
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
