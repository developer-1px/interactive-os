/**
 * extractMouseInput — Pure function tests
 *
 * Tests the pure conversion: MouseDownSense → MouseInput
 * The MouseDownSense interface replaces HTMLElement/Event with plain objects.
 */

import { describe, expect, it } from "vitest";
import {
    extractMouseInput,
    type MouseDownSense,
} from "@os/1-listeners/shared/senseMouse";

const BASE: MouseDownSense = {
    isInspector: false,
    isLabel: false,
    labelTargetItemId: null,
    labelTargetGroupId: null,
    itemId: null,
    groupId: null,
    hasAriaExpanded: false,
    itemRole: null,
    zoneId: null,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
};

describe("extractMouseInput (pure)", () => {
    // ── Guards ──

    it("inspector target → null", () => {
        const result = extractMouseInput({ ...BASE, isInspector: true });
        expect(result).toBeNull();
    });

    // ── Label path ──

    it("label with resolved target → isLabel:true MouseInput", () => {
        const result = extractMouseInput({
            ...BASE,
            isLabel: true,
            labelTargetItemId: "field-1",
            labelTargetGroupId: "zone-A",
        });
        expect(result).toEqual(
            expect.objectContaining({
                isLabel: true,
                labelTargetItemId: "field-1",
                labelTargetGroupId: "zone-A",
                targetItemId: null,
                targetGroupId: null,
            }),
        );
    });

    it("label without resolved target → null", () => {
        const result = extractMouseInput({
            ...BASE,
            isLabel: true,
            labelTargetItemId: null,
            labelTargetGroupId: null,
        });
        expect(result).toBeNull();
    });

    // ── Normal item path ──

    it("item with focus target → full MouseInput", () => {
        const result = extractMouseInput({
            ...BASE,
            itemId: "item-1",
            groupId: "zone-A",
            hasAriaExpanded: true,
            itemRole: "treeitem",
        });
        expect(result).toEqual(
            expect.objectContaining({
                targetItemId: "item-1",
                targetGroupId: "zone-A",
                hasAriaExpanded: true,
                itemRole: "treeitem",
                isLabel: false,
            }),
        );
    });

    it("no item, zone exists → zone-only MouseInput", () => {
        const result = extractMouseInput({
            ...BASE,
            itemId: null,
            groupId: null,
            zoneId: "zone-A",
        });
        expect(result).toEqual(
            expect.objectContaining({
                targetItemId: null,
                targetGroupId: "zone-A",
                isLabel: false,
            }),
        );
    });

    it("no item, no zone → null", () => {
        const result = extractMouseInput({
            ...BASE,
            itemId: null,
            groupId: null,
            zoneId: null,
        });
        expect(result).toBeNull();
    });

    // ── Modifiers ──

    it("shift key → shiftKey:true in output", () => {
        const result = extractMouseInput({
            ...BASE,
            itemId: "item-1",
            groupId: "zone-A",
            shiftKey: true,
        });
        expect(result).toEqual(expect.objectContaining({ shiftKey: true }));
    });

    it("meta key → metaKey:true in output", () => {
        const result = extractMouseInput({
            ...BASE,
            itemId: "item-1",
            groupId: "zone-A",
            metaKey: true,
        });
        expect(result).toEqual(expect.objectContaining({ metaKey: true }));
    });
});
