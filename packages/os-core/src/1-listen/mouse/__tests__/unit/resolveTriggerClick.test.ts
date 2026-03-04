/**
 * resolveTriggerClick — Unit tests
 *
 * Verifies that the Trigger layer of the ZIFT click responder chain
 * correctly resolves clicks based on TriggerConfig presets.
 *
 * Symmetrical to resolveTriggerKey.test.ts (keyboard counterpart).
 *
 * Pure function tests. No DOM, no React.
 */

import { describe, expect, it } from "vitest";
import {
    resolveTriggerClick,
    type TriggerClickInput,
} from "@os-core/1-listen/mouse/resolveTriggerClick";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function menuClick(overrides: Partial<TriggerClickInput> = {}): TriggerClickInput {
    return {
        triggerId: "mb-trigger",
        triggerRole: "menu",
        overlayId: "popup-menu",
        isTriggerOverlayOpen: false,
        ...overrides,
    };
}

function dialogClick(overrides: Partial<TriggerClickInput> = {}): TriggerClickInput {
    return {
        triggerId: "dlg-trigger",
        triggerRole: "dialog",
        overlayId: "dialog-1",
        isTriggerOverlayOpen: false,
        ...overrides,
    };
}

function tooltipClick(overrides: Partial<TriggerClickInput> = {}): TriggerClickInput {
    return {
        triggerId: "tt-trigger",
        triggerRole: "tooltip",
        overlayId: "tooltip-1",
        isTriggerOverlayOpen: false,
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Menu Trigger (APG Menu Button Pattern)
// ═══════════════════════════════════════════════════════════════════

describe("resolveTriggerClick: menu", () => {
    it("click when closed → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerClick(menuClick());
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
    });

    it("click when open → OS_OVERLAY_CLOSE (toggle)", () => {
        const cmd = resolveTriggerClick(menuClick({ isTriggerOverlayOpen: true }));
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_CLOSE");
    });

    it("open command carries correct overlayId", () => {
        const cmd = resolveTriggerClick(menuClick({ overlayId: "my-menu" }));
        expect(cmd!.payload).toEqual(
            expect.objectContaining({ id: "my-menu" }),
        );
    });

    it("open command carries triggerId for focus restoration", () => {
        const cmd = resolveTriggerClick(menuClick({ triggerId: "btn-actions" }));
        expect(cmd!.payload).toEqual(
            expect.objectContaining({ triggerId: "btn-actions" }),
        );
    });

    it("close command carries correct overlayId", () => {
        const cmd = resolveTriggerClick(menuClick({
            overlayId: "my-menu",
            isTriggerOverlayOpen: true,
        }));
        expect(cmd!.payload).toEqual(
            expect.objectContaining({ id: "my-menu" }),
        );
    });
});

// ═══════════════════════════════════════════════════════════════════
// Dialog Trigger
// ═══════════════════════════════════════════════════════════════════

describe("resolveTriggerClick: dialog", () => {
    it("click when closed → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerClick(dialogClick());
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
    });

    it("click when open → OS_OVERLAY_CLOSE (toggle)", () => {
        const cmd = resolveTriggerClick(dialogClick({ isTriggerOverlayOpen: true }));
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_CLOSE");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Tooltip Trigger (onClick: false)
// ═══════════════════════════════════════════════════════════════════

describe("resolveTriggerClick: tooltip", () => {
    it("click → null (tooltip doesn't open on click)", () => {
        expect(resolveTriggerClick(tooltipClick())).toBeNull();
    });

    it("click when open → null (tooltip doesn't toggle on click)", () => {
        expect(resolveTriggerClick(tooltipClick({ isTriggerOverlayOpen: true }))).toBeNull();
    });
});
