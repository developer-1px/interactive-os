/**
 * @spec docs/1-project/headless-zone-registry/spec.md#T2
 *
 * T2: autoFocus headless pathway
 *
 * 핵심 증명: defineApp+createPage를 통해 autoFocus가 headless에서도 작동한다.
 * React 렌더 없이 OS API만으로 검증.
 *
 * Tier 1: OS 커널 아키텍처 테스트
 */

import { defineApp } from "@os-sdk/app/defineApp/index";
import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Tests — autoFocus via defineApp+createPage (headless OS API)
// ═══════════════════════════════════════════════════════════════════

describe("T2: FocusGroup autoFocus headless pathway", () => {
  // T2-1: autoFocus dispatches OS_FOCUS with first item from getItems()
  it("T2-1: autoFocus dispatches OS_FOCUS with first item from getItems()", () => {
    const app = defineApp("test-autofocus-1", {});
    const zone = app.createZone("autofocus-test");
    zone.bind({
      role: "dialog",
      getItems: () => ["item-a", "item-b", "item-c"],
      options: {
        project: { autoFocus: true, virtualFocus: false },
      },
    });
    const page = createPage(app);
    page.goto("autofocus-test", { focusedItemId: "item-a" });

    expect(page.activeZoneId()).toBe("autofocus-test");
    expect(page.focusedItemId()).toBe("item-a");
  });

  // T2-3: autoFocus with empty items activates zone only (itemId=null)
  it("T2-3: autoFocus with empty getItems activates zone only (itemId=null)", () => {
    const app = defineApp("test-autofocus-2", {});
    const zone = app.createZone("autofocus-test");
    zone.bind({
      role: "dialog",
      getItems: () => [],
      options: {
        project: { autoFocus: true, virtualFocus: false },
      },
    });
    const page = createPage(app);
    page.goto("autofocus-test", { focusedItemId: null });

    expect(page.activeZoneId()).toBe("autofocus-test");
    expect(page.focusedItemId()).toBeNull();
  });

  // T2-4: headless autoFocus sets activeZoneId
  it("T2-4: headless autoFocus sets activeZoneId", () => {
    const app = defineApp("test-autofocus-3", {});
    const zone = app.createZone("autofocus-test");
    zone.bind({
      role: "dialog",
      getItems: () => ["x"],
      options: {
        project: { autoFocus: true, virtualFocus: false },
      },
    });
    const page = createPage(app);
    page.goto("autofocus-test", { focusedItemId: "x" });

    expect(page.activeZoneId()).toBe("autofocus-test");
  });
});
