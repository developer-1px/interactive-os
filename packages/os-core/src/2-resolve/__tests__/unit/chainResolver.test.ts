/**
 * chainResolver — Unit tests
 *
 * Verifies the generic ZIFT chain executor:
 * - Binary return: Command = stop, null = pass
 * - NOOP = stop with no action
 * - Command[] chain: first success wins (toggle pattern)
 * - Empty chain / no match → null
 *
 * Architecture/refactoring task — no spec required.
 * Pure function tests. No DOM, no React.
 */

import { describe, expect, it } from "vitest";
import { resolveChain, NOOP, type Keymap } from "@os-core/2-resolve/chainResolver";

// ═══════════════════════════════════════════════════════════════════
// Mock commands
// ═══════════════════════════════════════════════════════════════════

const OPEN = { type: "OS_OVERLAY_OPEN", payload: { id: "menu-1" } } as BaseCommand;
const CLOSE = { type: "OS_OVERLAY_CLOSE", payload: { id: "menu-1" } } as BaseCommand;
const NAVIGATE = { type: "OS_NAVIGATE", payload: { direction: "down" } } as BaseCommand;
const COMMIT = { type: "OS_FIELD_COMMIT", payload: {} } as BaseCommand;
const CHECK = { type: "OS_CHECK", payload: { targetId: "item-1" } } as BaseCommand;

// ═══════════════════════════════════════════════════════════════════
// Basic chain resolution
// ═══════════════════════════════════════════════════════════════════

describe("resolveChain: basic", () => {
    it("single layer, key matches → returns command", () => {
        const layer: Keymap = { Enter: COMMIT };
        const result = resolveChain("Enter", [layer]);
        expect(result).toBe(COMMIT);
    });

    it("single layer, key not found → null", () => {
        const layer: Keymap = { Enter: COMMIT };
        const result = resolveChain("ArrowDown", [layer]);
        expect(result).toBeNull();
    });

    it("empty layers → null", () => {
        expect(resolveChain("Enter", [])).toBeNull();
    });

    it("empty keymap → null", () => {
        expect(resolveChain("Enter", [{}])).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// NOOP (absorb) — stop chain, no command
// ═══════════════════════════════════════════════════════════════════

describe("resolveChain: NOOP", () => {
    it("NOOP stops chain → returns NOOP (not null)", () => {
        const fieldLayer: Keymap = { Enter: NOOP };
        const zoneLayer: Keymap = { Enter: NAVIGATE };
        const result = resolveChain("Enter", [fieldLayer, zoneLayer]);
        expect(result).toBe(NOOP);
    });

    it("NOOP prevents later layers from running", () => {
        const fieldLayer: Keymap = { Space: NOOP };
        const itemLayer: Keymap = { Space: CHECK };
        const result = resolveChain("Space", [fieldLayer, itemLayer]);
        expect(result).toBe(NOOP);
        // CHECK should NOT be reached
    });
});

// ═══════════════════════════════════════════════════════════════════
// Priority / ordering
// ═══════════════════════════════════════════════════════════════════

describe("resolveChain: priority", () => {
    it("first layer wins when both layers have same key", () => {
        const fieldLayer: Keymap = { Enter: COMMIT };
        const zoneLayer: Keymap = { Enter: NAVIGATE };
        const result = resolveChain("Enter", [fieldLayer, zoneLayer]);
        expect(result).toBe(COMMIT);
    });

    it("falls through to later layer when first doesn't have key", () => {
        const fieldLayer: Keymap = { Escape: COMMIT };
        const zoneLayer: Keymap = { ArrowDown: NAVIGATE };
        const result = resolveChain("ArrowDown", [fieldLayer, zoneLayer]);
        expect(result).toBe(NAVIGATE);
    });

    it("4-layer ZIFT chain: Field > Trigger > Item > Zone", () => {
        const field: Keymap = {};  // Field doesn't claim Space
        const trigger: Keymap = {};  // Trigger doesn't claim Space
        const item: Keymap = { Space: CHECK };  // Item claims Space (checkbox)
        const zone: Keymap = { Space: NAVIGATE };  // Zone would also accept
        const result = resolveChain("Space", [field, trigger, item, zone]);
        expect(result).toBe(CHECK);
    });
});

// ═══════════════════════════════════════════════════════════════════
// Command chain (toggle pattern)
// ═══════════════════════════════════════════════════════════════════

describe("resolveChain: command chain (toggle)", () => {
    it("[CLOSE, OPEN] where CLOSE succeeds → CLOSE (first success)", () => {
        // CLOSE is a real command, not null → chain stops at CLOSE
        const trigger: Keymap = { Click: [CLOSE, OPEN] };
        // When overlay is open, CLOSE should be the first command tried
        // resolveChain just returns the first non-null in the sub-chain
        const result = resolveChain("Click", [trigger]);
        expect(result).toBe(CLOSE);
    });

    it("[null, OPEN] where first is null → OPEN (fallback)", () => {
        // Simulating: overlay is closed → CLOSE returns null → try OPEN
        const trigger: Keymap = { Click: [null, OPEN] };
        const result = resolveChain("Click", [trigger]);
        expect(result).toBe(OPEN);
    });

    it("[null, null] → null (nothing claimed)", () => {
        const trigger: Keymap = { Click: [null, null] };
        const result = resolveChain("Click", [trigger]);
        expect(result).toBeNull();
    });

    it("single-element chain [OPEN] → OPEN", () => {
        const trigger: Keymap = { Enter: [OPEN] };
        const result = resolveChain("Enter", [trigger]);
        expect(result).toBe(OPEN);
    });
});
