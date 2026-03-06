/**
 * DocsViewer — Tab Navigation Reproduction Test
 *
 * Issue: tabindex와 Tab키 동작이 제대로 안 되고 있다.
 * Strategy: createPage(DocsApp) — 앱 통합 테스트.
 *   - 3개 zone (favorites, recent, sidebar) 동시 등록
 *   - Tab/Shift+Tab으로 zone 간 전환 검증
 *   - tabIndex 계산 검증 (focused item = 0, 나머지 = -1)
 *
 * 이 테스트는 OS 레이어의 Tab 처리 (resolveTab + OS_TAB)가
 * DocsViewer zone 구성에서 올바르게 동작하는지 headless로 검증한다.
 */

import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { createPage } from "@os-devtool/testing/page";
import type { AppPage } from "@os-sdk/app/defineApp/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DocsApp } from "../../app";

// Tab navigation test fixtures — any IDs work (testing zone-switching mechanics, not real content)
const NAVBAR_ITEMS = [
  "docs-btn-back",
  "docs-btn-forward",
  "docs-toggle-pin",
  "docs-btn-search",
];
const FAVORITE_ITEMS = ["fav-tab-a", "fav-tab-b"];
const RECENT_ITEMS = ["recent-tab-a", "recent-tab-b", "recent-tab-c"];
const SIDEBAR_ITEMS = [
  "sb-tab-a",
  "sb-tab-b",
  "sb-tab-c",
  "sb-tab-d",
  "sb-tab-e",
];
const READER_ITEMS = ["reader-tab-1", "reader-tab-2"];

interface DocsState {
  activePath: string | null;
  searchOpen: boolean;
  favVersion: number;
}

let page: AppPage<DocsState>;

// ═══════════════════════════════════════════════════════════════════
// Setup: 3개 zone을 모두 등록하여 full page 시뮬레이션
// ═══════════════════════════════════════════════════════════════════

/** All zone IDs in Tab order with their default items */
const ZONE_ITEMS: Record<string, string[]> = {
  "docs-navbar": NAVBAR_ITEMS,
  "docs-favorites": FAVORITE_ITEMS,
  "docs-recent": RECENT_ITEMS,
  "docs-sidebar": SIDEBAR_ITEMS,
  "docs-reader": READER_ITEMS,
};

const ALL_ZONES = Object.keys(ZONE_ITEMS);

function setupAllZones(activeZone: string, focusedItemId?: string) {
  // Register all zones — order determines Tab sequence.
  // goto() sets activeZoneId, so we call the target zone LAST
  // to avoid last-writer-wins overriding the intended active zone.
  for (const zoneId of ALL_ZONES) {
    if (zoneId === activeZone) continue;
    page.goto(zoneId, { focusedItemId: null });
  }
  // Target zone last → sets activeZoneId correctly
  page.goto(activeZone, {
    focusedItemId: focusedItemId ?? ZONE_ITEMS[activeZone]?.[0] ?? null,
  });

  // Inject getItems into ZoneRegistry for headless Tab resolution.
  // In the browser, DOM_ZONE_ORDER discovers items via DOM queries.
  // Headless needs getItems() on each zone entry.
  for (const [zoneId, items] of Object.entries(ZONE_ITEMS)) {
    const entry = ZoneRegistry.get(zoneId);
    if (entry) entry.getItems = () => items;
  }
}

beforeEach(() => {
  page = createPage(DocsApp);
});

afterEach(() => {
  page.cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// §1 tabIndex 기본 투영
// ═══════════════════════════════════════════════════════════════════

describe("§1 tabIndex Projection", () => {
  function setupSidebar() {
    page.goto("docs-sidebar");
    const entry = ZoneRegistry.get("docs-sidebar");
    if (entry) entry.getItems = () => SIDEBAR_ITEMS;
  }

  it("focused item has tabIndex=0, others have tabIndex=-1", () => {
    setupSidebar();
    page.click(SIDEBAR_ITEMS[0]!);

    // Focused item → tabIndex 0
    const focusedAttrs = page.attrs(SIDEBAR_ITEMS[0]!);
    expect(focusedAttrs.tabIndex).toBe(0);

    // Non-focused items → tabIndex -1
    const otherAttrs = page.attrs(SIDEBAR_ITEMS[1]!);
    expect(otherAttrs.tabIndex).toBe(-1);
  });

  it("after ArrowDown, tabIndex moves to new focused item", () => {
    setupSidebar();
    page.click(SIDEBAR_ITEMS[0]!);
    page.keyboard.press("ArrowDown");

    expect(page.attrs(SIDEBAR_ITEMS[0]!).tabIndex).toBe(-1);
    expect(page.attrs(SIDEBAR_ITEMS[1]!).tabIndex).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §2 Tab으로 Zone 간 전환 (escape behavior)
// ═══════════════════════════════════════════════════════════════════

describe("§2 Tab — Zone Escape", () => {
  it("Tab from favorites → should escape to next zone", () => {
    setupAllZones("docs-favorites", FAVORITE_ITEMS[0]);

    page.keyboard.press("Tab");

    const afterZone = page.activeZoneId();
    const afterFocus = page.focusedItemId();

    // Tab should have moved to a different zone
    expect(afterZone).not.toBe("docs-favorites");
    // Should have a focused item in the new zone
    expect(afterFocus).toBeTruthy();
  });

  it("Tab from recent → should escape to next zone", () => {
    setupAllZones("docs-recent", RECENT_ITEMS[0]);

    page.keyboard.press("Tab");

    const afterZone = page.activeZoneId();

    expect(afterZone).not.toBe("docs-recent");
    expect(page.focusedItemId()).toBeTruthy();
  });

  it("Tab from sidebar → should escape to next zone", () => {
    setupAllZones("docs-sidebar", SIDEBAR_ITEMS[0]);

    page.keyboard.press("Tab");

    const afterZone = page.activeZoneId();

    expect(afterZone).not.toBe("docs-sidebar");
    expect(page.focusedItemId()).toBeTruthy();
  });

  it("Shift+Tab from sidebar → should escape backward", () => {
    setupAllZones("docs-sidebar", SIDEBAR_ITEMS[0]);

    page.keyboard.press("Shift+Tab");

    const afterZone = page.activeZoneId();

    expect(afterZone).not.toBe("docs-sidebar");
    expect(page.focusedItemId()).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §3 Tab 순환 — 전체 zone을 순회
// ═══════════════════════════════════════════════════════════════════

describe("§3 Tab — Full Cycle", () => {
  it(`Tab ${ALL_ZONES.length}번 → 모든 zone을 순회하고 원래 zone으로 돌아온다`, () => {
    setupAllZones("docs-navbar", NAVBAR_ITEMS[0]);

    const startZone = page.activeZoneId();
    const visitedZones: string[] = [startZone!];

    for (let i = 0; i < ALL_ZONES.length; i++) {
      page.keyboard.press("Tab");
      const z = page.activeZoneId();
      visitedZones.push(z!);
    }

    // Should visit all zones
    const uniqueZones = new Set(visitedZones);
    expect(uniqueZones.size).toBe(ALL_ZONES.length);

    // After N Tabs with N zones, should return to start
    expect(visitedZones[visitedZones.length - 1]).toBe(startZone);
  });

  it(`Shift+Tab ${ALL_ZONES.length}번 → 역방향으로 모든 zone 순회`, () => {
    setupAllZones("docs-navbar", NAVBAR_ITEMS[0]);

    const startZone = page.activeZoneId();
    const visitedZones: string[] = [startZone!];

    for (let i = 0; i < ALL_ZONES.length; i++) {
      page.keyboard.press("Shift+Tab");
      const z = page.activeZoneId();
      visitedZones.push(z!);
    }

    const uniqueZones = new Set(visitedZones);
    expect(uniqueZones.size).toBe(ALL_ZONES.length);
    expect(visitedZones[visitedZones.length - 1]).toBe(startZone);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §4 Tab 후 tabIndex 투영
// ═══════════════════════════════════════════════════════════════════

describe("§4 tabIndex after Tab transition", () => {
  it("Tab 전환 후 새 zone의 focused item이 tabIndex=0", () => {
    setupAllZones("docs-favorites", FAVORITE_ITEMS[0]);

    // Before Tab: favorites의 first item이 tabIndex=0
    expect(page.attrs(FAVORITE_ITEMS[0]!, "docs-favorites").tabIndex).toBe(0);

    page.keyboard.press("Tab");

    const newZone = page.activeZoneId();
    const newFocused = page.focusedItemId();

    if (newFocused && newZone) {
      // 새 zone의 focused item → tabIndex 0
      expect(page.attrs(newFocused, newZone).tabIndex).toBe(0);
    }
  });
});
