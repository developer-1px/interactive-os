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

import { createPage } from "@os-devtool/testing/page";
import type { AppPage } from "@os-sdk/app/defineApp/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DocsApp } from "../../app";
import {
    FAVORITE_ITEMS,
    RECENT_ITEMS,
    SIDEBAR_ITEMS,
} from "../../testbot-docs";

interface DocsState {
    activePath: string | null;
    searchOpen: boolean;
}

let page: AppPage<DocsState>;

// ═══════════════════════════════════════════════════════════════════
// Setup: 3개 zone을 모두 등록하여 full page 시뮬레이션
// ═══════════════════════════════════════════════════════════════════

function setupAllZones(activeZone: string, focusedItemId?: string) {
    // Register all zones — order determines Tab sequence
    page.goto("docs-favorites", {
        focusedItemId: activeZone === "docs-favorites"
            ? (focusedItemId ?? FAVORITE_ITEMS[0] ?? null)
            : null,
    });
    page.goto("docs-recent", {
        focusedItemId: activeZone === "docs-recent"
            ? (focusedItemId ?? RECENT_ITEMS[0] ?? null)
            : null,
    });
    page.goto("docs-sidebar", {
        focusedItemId: activeZone === "docs-sidebar"
            ? (focusedItemId ?? SIDEBAR_ITEMS[0] ?? null)
            : null,
    });
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
    it("focused item has tabIndex=0, others have tabIndex=-1", () => {
        page.goto("docs-sidebar");
        page.click(SIDEBAR_ITEMS[0]!);

        // Focused item → tabIndex 0
        const focusedAttrs = page.attrs(SIDEBAR_ITEMS[0]!);
        expect(focusedAttrs.tabIndex).toBe(0);

        // Non-focused items → tabIndex -1
        const otherAttrs = page.attrs(SIDEBAR_ITEMS[1]!);
        expect(otherAttrs.tabIndex).toBe(-1);
    });

    it("after ArrowDown, tabIndex moves to new focused item", () => {
        page.goto("docs-sidebar");
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

        console.log(`[BEFORE] activeZone=${page.activeZoneId()}, focused=${page.focusedItemId()}`);

        page.keyboard.press("Tab");

        const afterZone = page.activeZoneId();
        const afterFocus = page.focusedItemId();
        console.log(`[AFTER Tab] activeZone=${afterZone}, focused=${afterFocus}`);

        // Tab should have moved to a different zone
        expect(afterZone).not.toBe("docs-favorites");
        // Should have a focused item in the new zone
        expect(afterFocus).toBeTruthy();
    });

    it("Tab from recent → should escape to next zone", () => {
        setupAllZones("docs-recent", RECENT_ITEMS[0]);

        page.keyboard.press("Tab");

        const afterZone = page.activeZoneId();
        console.log(`[AFTER Tab from recent] activeZone=${afterZone}, focused=${page.focusedItemId()}`);

        expect(afterZone).not.toBe("docs-recent");
        expect(page.focusedItemId()).toBeTruthy();
    });

    it("Tab from sidebar → should escape to next zone", () => {
        setupAllZones("docs-sidebar", SIDEBAR_ITEMS[0]);

        page.keyboard.press("Tab");

        const afterZone = page.activeZoneId();
        console.log(`[AFTER Tab from sidebar] activeZone=${afterZone}, focused=${page.focusedItemId()}`);

        expect(afterZone).not.toBe("docs-sidebar");
        expect(page.focusedItemId()).toBeTruthy();
    });

    it("Shift+Tab from sidebar → should escape backward", () => {
        setupAllZones("docs-sidebar", SIDEBAR_ITEMS[0]);

        page.keyboard.press("Shift+Tab");

        const afterZone = page.activeZoneId();
        console.log(`[AFTER Shift+Tab from sidebar] activeZone=${afterZone}, focused=${page.focusedItemId()}`);

        expect(afterZone).not.toBe("docs-sidebar");
        expect(page.focusedItemId()).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════════
// §3 Tab 순환 — 전체 zone을 순회
// ═══════════════════════════════════════════════════════════════════

describe("§3 Tab — Full Cycle", () => {
    it("Tab 3번 → 모든 zone을 순회하고 원래 zone으로 돌아온다", () => {
        setupAllZones("docs-favorites", FAVORITE_ITEMS[0]);

        const startZone = page.activeZoneId();
        const visitedZones: string[] = [startZone!];

        for (let i = 0; i < 3; i++) {
            page.keyboard.press("Tab");
            const z = page.activeZoneId();
            visitedZones.push(z!);
            console.log(`Tab ${i + 1}: zone=${z}, focused=${page.focusedItemId()}`);
        }

        console.log("Visited zones:", visitedZones);

        // Should visit at least 2 distinct zones
        const uniqueZones = new Set(visitedZones);
        expect(uniqueZones.size).toBeGreaterThanOrEqual(2);

        // After 3 Tabs with 3 zones, should return to start
        expect(visitedZones[visitedZones.length - 1]).toBe(startZone);
    });

    it("Shift+Tab 3번 → 역방향으로 모든 zone 순회", () => {
        setupAllZones("docs-favorites", FAVORITE_ITEMS[0]);

        const startZone = page.activeZoneId();
        const visitedZones: string[] = [startZone!];

        for (let i = 0; i < 3; i++) {
            page.keyboard.press("Shift+Tab");
            const z = page.activeZoneId();
            visitedZones.push(z!);
            console.log(`Shift+Tab ${i + 1}: zone=${z}, focused=${page.focusedItemId()}`);
        }

        console.log("Visited zones (reverse):", visitedZones);

        const uniqueZones = new Set(visitedZones);
        expect(uniqueZones.size).toBeGreaterThanOrEqual(2);
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
