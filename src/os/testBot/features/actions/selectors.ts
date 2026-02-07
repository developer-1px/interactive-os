/**
 * TestBot — Selector Resolution & Element Finders
 *
 * Resolves CSS selectors, semantic queries ({ text, role }),
 * and generates unique selectors for found elements.
 */

import type { Selector } from "../../entities/TestActions";
import { matchesName, matchesRole } from "./implicitRoles";

// ═══════════════════════════════════════════════════════════════════
// Unique Selector Generation
// ═══════════════════════════════════════════════════════════════════

export function getUniqueSelector(el: Element): string {
  if (el.id) return `#${el.id}`;

  const testId = el.getAttribute("data-testid");
  if (testId) return `[data-testid="${testId}"]`;

  const path: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body) {
    let qs = current.tagName.toLowerCase();
    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        qs += `:nth-of-type(${idx})`;
      }
    }
    path.unshift(qs);
    current = current.parentElement;
  }
  return path.join(" > ");
}

// ═══════════════════════════════════════════════════════════════════
// Element Finders
// ═══════════════════════════════════════════════════════════════════

export function findByText(text: string): Element | null {
  const all = document.querySelectorAll("*");
  let best: Element | null = null;
  let bestSize = Infinity;

  for (const el of all) {
    if (el.textContent?.trim() === text) {
      const size = el.querySelectorAll("*").length;
      if (size < bestSize) {
        best = el;
        bestSize = size;
      }
    }
  }
  return best;
}

export function findAllByText(text: string): Element[] {
  const all = document.querySelectorAll("*");
  const results: Element[] = [];
  for (const el of all) {
    if (el.children.length === 0 && el.textContent?.trim() === text) {
      results.push(el);
    }
  }
  return results;
}

export function findByRole(role: string, name?: string): Element | null {
  const all = document.querySelectorAll("*");
  for (const el of all) {
    if (!matchesRole(el, role)) continue;
    if (name && !matchesName(el, name)) continue;
    return el;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// Resolve Selector (CSS string | ElementQuery → Element)
// ═══════════════════════════════════════════════════════════════════

export function resolveElement(target: Selector): Element | null {
  if (typeof target === "string") {
    return document.querySelector(target);
  }
  if (target.text) return findByText(target.text);
  if (target.role) return findByRole(target.role, target.name);
  return null;
}

export function selectorLabel(target: Selector): string {
  if (typeof target === "string") return target;
  if (target.text) return `{text: "${target.text}"}`;
  if (target.role)
    return `{role: "${target.role}"${target.name ? `, name: "${target.name}"` : ""}}`;
  return JSON.stringify(target);
}
