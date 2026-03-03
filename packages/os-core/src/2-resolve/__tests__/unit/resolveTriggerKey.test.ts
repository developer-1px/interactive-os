/**
 * resolveTriggerKey — Unit tests
 *
 * Verifies that the Trigger layer of the ZIFT responder chain
 * correctly resolves keys based on TriggerConfig presets.
 *
 * Pure function tests. No DOM, no React.
 */

import { describe, expect, it } from "vitest";
import {
    resolveTriggerKey,
    type TriggerKeyContext,
} from "@os-core/2-resolve/resolveTriggerKey";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function menuTrigger(overrides: Partial<TriggerKeyContext> = {}): TriggerKeyContext {
    return {
        triggerRole: "menu",
        overlayId: "popup-menu",
        isOverlayOpen: false,
        ...overrides,
    };
}

function dialogTrigger(overrides: Partial<TriggerKeyContext> = {}): TriggerKeyContext {
    return {
        triggerRole: "dialog",
        overlayId: "dialog-1",
        isOverlayOpen: false,
        ...overrides,
    };
}

function tooltipTrigger(overrides: Partial<TriggerKeyContext> = {}): TriggerKeyContext {
    return {
        triggerRole: "tooltip",
        overlayId: "tooltip-1",
        isOverlayOpen: false,
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Menu Trigger (APG Menu Button Pattern)
// ═══════════════════════════════════════════════════════════════════

describe("resolveTriggerKey: menu", () => {
    it("Enter → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerKey("Enter", menuTrigger());
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
    });

    it("Space → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerKey("Space", menuTrigger());
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
    });

    it("ArrowDown → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerKey("ArrowDown", menuTrigger());
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
    });

    it("ArrowUp → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerKey("ArrowUp", menuTrigger());
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
    });

    it("ArrowLeft → null (not handled)", () => {
        expect(resolveTriggerKey("ArrowLeft", menuTrigger())).toBeNull();
    });

    it("Tab → null (not handled)", () => {
        expect(resolveTriggerKey("Tab", menuTrigger())).toBeNull();
    });

    it("when overlay is open → null (overlay Zone handles keys)", () => {
        expect(resolveTriggerKey("Enter", menuTrigger({ isOverlayOpen: true }))).toBeNull();
        expect(resolveTriggerKey("ArrowDown", menuTrigger({ isOverlayOpen: true }))).toBeNull();
    });

    it("overlay command carries correct overlayId", () => {
        const cmd = resolveTriggerKey("Enter", menuTrigger({ overlayId: "my-menu" }));
        expect(cmd!.payload).toEqual(
            expect.objectContaining({ id: "my-menu" }),
        );
    });
});

// ═══════════════════════════════════════════════════════════════════
// Dialog Trigger
// ═══════════════════════════════════════════════════════════════════

describe("resolveTriggerKey: dialog", () => {
    it("Enter → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerKey("Enter", dialogTrigger());
        expect(cmd).not.toBeNull();
        expect(cmd!.type).toBe("OS_OVERLAY_OPEN");
    });

    it("Space → OS_OVERLAY_OPEN", () => {
        const cmd = resolveTriggerKey("Space", dialogTrigger());
        expect(cmd).not.toBeNull();
    });

    it("ArrowDown → null (dialog doesn't open on arrow)", () => {
        expect(resolveTriggerKey("ArrowDown", dialogTrigger())).toBeNull();
    });

    it("ArrowUp → null (dialog doesn't open on arrow)", () => {
        expect(resolveTriggerKey("ArrowUp", dialogTrigger())).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// Tooltip Trigger
// ═══════════════════════════════════════════════════════════════════

describe("resolveTriggerKey: tooltip", () => {
    it("Enter → null (tooltip doesn't open on keyboard)", () => {
        expect(resolveTriggerKey("Enter", tooltipTrigger())).toBeNull();
    });

    it("Space → null", () => {
        expect(resolveTriggerKey("Space", tooltipTrigger())).toBeNull();
    });

    it("ArrowDown → null", () => {
        expect(resolveTriggerKey("ArrowDown", tooltipTrigger())).toBeNull();
    });
});
