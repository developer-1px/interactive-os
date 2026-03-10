/**
 * Projection Items: renderToString → HTML parse → [data-item] extraction.
 *
 * In projection mode (Component provided), items come EXCLUSIVELY from
 * rendered HTML — getItems() is ignored. This is the headless equivalent
 * of browser's DOM scan (el.querySelectorAll("[data-item]")).
 *
 * This is a pure infrastructure test using a minimal test fixture app,
 * not the real DocsViewer (which depends on virtual:docs-meta).
 */

import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { createPage } from "@os-testing/page";
import { defineApp } from "@os-sdk/app/defineApp";
import { OS_ACTIVATE, os } from "@os-sdk/os";
import { produce } from "immer";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Fixture: Minimal app with conditional rendering
//
// Both zones use projection-only — no getItems() anywhere.
// Items are derived exclusively from rendered HTML.
// ═══════════════════════════════════════════════════════════════════

interface FixtureState {
  mode: "list" | "detail";
}

const FixtureApp = defineApp<FixtureState>("fixture-projection", {
  mode: "list",
});

const switchMode = FixtureApp.command(
  "SWITCH_MODE",
  (ctx, payload: { mode: "list" | "detail" }) => ({
    state: produce(ctx.state, (draft) => {
      draft.mode = payload.mode;
    }),
  }),
);

const listZone = FixtureApp.createZone("fixture-list");
const ListUI = listZone.bind("listbox", {
  options: {
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

const detailZone = FixtureApp.createZone("fixture-detail");
const DetailUI = detailZone.bind("feed", {
  options: {
    inputmap: { click: [OS_ACTIVATE()] },
  },
});

// ── Fixture Component: conditionally renders items based on mode ──

import type { FC } from "react";
import { createElement } from "react";

const FixtureComponent: FC = () => {
  const state = os.useComputed(
    (s) => s.apps["fixture-projection"] as FixtureState,
  );

  return createElement(
    "div",
    null,
    // List zone: always renders 3 items
    createElement(
      ListUI.Zone,
      null,
      ["item-a", "item-b", "item-c"].map((id) =>
        createElement(ListUI.Item, { key: id, id }, id),
      ),
    ),
    // Detail zone: only renders items in "detail" mode
    createElement(
      DetailUI.Zone,
      null,
      state.mode === "detail"
        ? createElement(DetailUI.Item, { id: "detail-content" }, "Content")
        : null,
    ),
  );
};

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Projection Items: projection-only item discovery", () => {
  it("list mode: detail zone has no rendered items → Tab skips it", () => {
    const { page } = createPage(FixtureApp, FixtureComponent);
    page.goto("/");

    // Bootstrap in list zone
    page.click("item-a");
    expect(readActiveZoneId(os)).toBe("fixture-list");

    // Tab forward — detail zone has NO items (not rendered in list mode)
    // Projection finds 0 items → Tab should skip fixture-detail
    page.keyboard.press("Tab");
    // Should wrap back to fixture-list (only zone with items)
    expect(readActiveZoneId(os)).not.toBe("fixture-detail");
  });

  it("detail mode: detail zone has 1 rendered item → Tab enters it", () => {
    const { page } = createPage(FixtureApp, FixtureComponent);
    page.goto("/");

    // Switch to detail mode
    os.dispatch(switchMode({ mode: "detail" }));

    // Bootstrap in list zone
    page.click("item-a");
    expect(readActiveZoneId(os)).toBe("fixture-list");

    // Tab forward — detail zone now has 1 item (rendered via projection)
    page.keyboard.press("Tab");
    expect(readActiveZoneId(os)).toBe("fixture-detail");
    expect(readFocusedItemId(os)).toBe("detail-content");
  });

  it("locator catches phantom elements not in rendered output", () => {
    const { page } = createPage(FixtureApp, FixtureComponent);
    page.goto("/");

    // item-a exists in rendered output
    expect(() => page.locator("#item-a")).not.toThrow();

    // detail-content does NOT exist in rendered output (detail mode is off)
    expect(() => page.locator("#detail-content")).toThrow();
  });

  it("projection provides items for navigation (ArrowDown)", () => {
    const { page } = createPage(FixtureApp, FixtureComponent);
    page.goto("/");

    // All items come from projection, not getItems()
    page.click("item-a");
    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("item-b");

    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("item-c");
  });
});
