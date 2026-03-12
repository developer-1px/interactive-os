/**
 * Projection — Component → HTML render + [data-item] parsing + ZoneRegistry sync.
 *
 * Caches renderToString output and parsed item maps.
 * Invalidation clears caches and re-syncs projection-backed getItems to ZoneRegistry.
 */

import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { createElement, type FC } from "react";
import { renderToString } from "react-dom/server";

export interface ProjectionElement {
  id: string | null;
  getAttribute(name: string): string | null;
}

export interface Projection {
  render(): string;
  invalidate(zonesWithBindingGetItems: Set<string>): void;
  sync(zonesWithBindingGetItems: Set<string>): void;
  assertElement(elementId: string): void;
  /** Query rendered HTML for elements matching an arbitrary CSS selector. Always re-renders fresh. */
  queryElements(selector: string): ProjectionElement[];
}

export function createProjection(Component: FC): Projection {
  let htmlCache: string | null = null;
  let itemsCache: Map<string, string[]> | null = null;

  function render(): string {
    if (htmlCache === null) {
      htmlCache = renderToString(createElement(Component));
    }
    return htmlCache;
  }

  function parseItems(): Map<string, string[]> {
    if (itemsCache) return itemsCache;

    const html = render();
    const container = document.createElement("div");
    container.innerHTML = html;

    const result = new Map<string, string[]>();
    const zoneEls = container.querySelectorAll("[data-zone]");
    for (const zoneEl of zoneEls) {
      const zoneId = zoneEl.getAttribute("data-zone");
      if (!zoneId) continue;
      const itemEls = zoneEl.querySelectorAll("[data-item]");
      const items: string[] = [];
      for (const itemEl of itemEls) {
        if (itemEl.closest("[data-zone]") !== zoneEl) continue;
        const id = itemEl.id;
        if (id) items.push(id);
      }
      result.set(zoneId, items);
    }

    itemsCache = result;
    return result;
  }

  function sync(zonesWithBindingGetItems: Set<string>): void {
    for (const zoneId of ZoneRegistry.keys()) {
      if (zonesWithBindingGetItems.has(zoneId)) continue;
      const entry = ZoneRegistry.get(zoneId);
      if (!entry) continue;
      const capturedZoneId = zoneId;
      entry.getItems = () => {
        const projection = parseItems();
        return projection.get(capturedZoneId) ?? [];
      };
    }
  }

  function invalidate(zonesWithBindingGetItems: Set<string>): void {
    htmlCache = null;
    itemsCache = null;
    sync(zonesWithBindingGetItems);
  }

  function assertElement(elementId: string): void {
    const html = render();
    const container = document.createElement("div");
    container.innerHTML = html;
    const found = container.querySelector(`[id="${elementId}"]`);
    if (!found) {
      throw new Error(
        `locator: element "#${elementId}" not found in rendered Component output.`,
      );
    }
  }

  function queryElements(selector: string): ProjectionElement[] {
    // Always re-render to capture latest state (after clicks/dispatches)
    htmlCache = null;
    itemsCache = null;
    const html = render();
    const container = document.createElement("div");
    container.innerHTML = html;
    const els = container.querySelectorAll(selector);
    return Array.from(els).map((el) => ({
      id: el.id || null,
      getAttribute: (name: string) => el.getAttribute(name),
    }));
  }

  return { render, invalidate, sync, assertElement, queryElements };
}
