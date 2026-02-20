/**
 * createApgKernel — browser mode
 *
 * When running inside TestBot, this module replaces the headless
 * createApgKernel. Instead of using kernel state, it interacts
 * with the REAL DOM through the existing Playwright shim (ShimPage).
 *
 * API is identical to the headless version:
 *   t.pressKey("ArrowRight")  → ShimPage.keyboard.press("ArrowRight")
 *   t.click("item-1")         → ShimPage.click("#item-1")
 *   t.attrs("item-1")         → element.getAttribute(...)
 *
 * This is injected by a Vite alias when building for the browser.
 */

import type { ItemAttrs } from "@os/3-commands/tests/integration/helpers/createTestOsKernel";

// ═══════════════════════════════════════════════════════════════════
// Browser ApgKernel — wraps real DOM
// ═══════════════════════════════════════════════════════════════════

export function createApgKernel() {
  let activeZoneId: string | null = null;

  // ─── Setup (browser mode: configure which zone to target) ───

  function setItems(_items: string[]) {
    // Browser: items are already rendered in the DOM.
    // No-op — the real FocusGroup manages these.
  }

  function setConfig(_config: any) {
    // Browser: config is already set by the FocusGroup component.
  }

  function setRole(zoneId: string, _role: string) {
    // Browser: role is already set by the FocusGroup component.
    // But we record the zoneId for targeting.
    activeZoneId = zoneId;
  }

  function setActiveZone(zoneId: string, _focusedItemId?: string) {
    activeZoneId = zoneId;
    // Browser: click the zone to activate it
    const el = document.getElementById(zoneId);
    if (el) el.focus();
    if (_focusedItemId) {
      const item = document.getElementById(_focusedItemId);
      if (item) item.click();
    }
  }

  // ─── Input Shim — browser mode dispatches real events ───

  function pressKey(key: string) {
    const keyMap: Record<string, string> = {
      ArrowDown: "ArrowDown",
      ArrowUp: "ArrowUp",
      ArrowLeft: "ArrowLeft",
      ArrowRight: "ArrowRight",
      Home: "Home",
      End: "End",
      Enter: "Enter",
      Escape: "Escape",
      Tab: "Tab",
      Space: " ",
    };

    const eventKey = keyMap[key] ?? key;
    const focused = document.activeElement ?? document.body;

    focused.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: eventKey,
        code: key,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function click(itemId: string) {
    const el = document.getElementById(itemId);
    if (!el) return;

    el.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );
    el.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, cancelable: true }),
    );
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  }

  // ─── DOM Projection — reads actual DOM attributes ───

  function attrs(itemId: string): ItemAttrs {
    const el = document.getElementById(itemId);
    if (!el) {
      return { role: undefined, tabIndex: -1 };
    }

    const ariaExpanded = el.getAttribute("aria-expanded");
    const ariaSelected = el.getAttribute("aria-selected");
    const ariaDisabled = el.getAttribute("aria-disabled");

    return {
      role: el.getAttribute("role") ?? undefined,
      tabIndex: el.tabIndex,
      "aria-selected":
        ariaSelected !== null ? ariaSelected === "true" : undefined,
      "aria-expanded":
        ariaExpanded !== null ? ariaExpanded === "true" : undefined,
      "aria-disabled":
        ariaDisabled !== null ? ariaDisabled === "true" : undefined,
      "data-focused": el.hasAttribute("data-focused") ? true : undefined,
    } as ItemAttrs;
  }

  // ─── State helpers (read from DOM) ───

  function focusedItemId(): string | null {
    if (!activeZoneId) return null;
    const zone = document.getElementById(activeZoneId);
    if (!zone) return null;
    const focused = zone.querySelector("[data-focused]");
    return focused?.id ?? null;
  }

  function zone() {
    if (!activeZoneId) return undefined;
    const zoneEl = document.getElementById(activeZoneId);
    if (!zoneEl) return undefined;

    // Read expandedItems from DOM
    const expandedItems: string[] = [];
    zoneEl.querySelectorAll("[aria-expanded='true']").forEach((el) => {
      if (el.id) expandedItems.push(el.id);
    });

    // Read selection from DOM
    const selection: string[] = [];
    zoneEl.querySelectorAll("[aria-selected='true']").forEach((el) => {
      if (el.id) selection.push(el.id);
    });

    return {
      focusedItemId: focusedItemId(),
      expandedItems,
      selection,
    };
  }

  function state() {
    return {
      os: {
        focus: {
          activeZoneId,
          zones: activeZoneId ? { [activeZoneId]: zone() } : {},
        },
      },
    };
  }

  function cleanup() {
    // Browser: no cleanup needed
  }

  return {
    // Setup
    setItems,
    setConfig,
    setRole,
    setActiveZone,

    // Input shims
    pressKey,
    click,

    // DOM projection
    attrs,

    // State helpers
    focusedItemId,
    zone,
    state,
    cleanup,

    // Dispatch — no-op in browser mode (use pressKey/click instead)
    dispatch: () => {},
  };
}
