/**
 * pasteBubbling — Unit tests for paste bubbling logic.
 *
 * PRD 1.5: Paste Bubbling (OS mechanism)
 * Pure function: no DOM, no React, no side effects.
 */

import { describe, expect, it } from "vitest";
import {
    type CollectionNode,
    findAcceptingCollection,
} from "../../pasteBubbling";

// ═══════════════════════════════════════════════════════════════════
// Test data — mirrors builder data model
// ═══════════════════════════════════════════════════════════════════

const COLLECTIONS: CollectionNode[] = [
    {
        id: "root",
        parentId: null,
        accept: (data: any) => data.type === "section" ? data : null,
        containsItem: (itemId: string) => {
            // Root "contains" all top-level section IDs
            return ["ncp-hero", "ncp-pricing", "ncp-footer", "tab-container-1"].includes(itemId);
        },
    },
    {
        id: "ncp-pricing:cards",
        parentId: "root",
        accept: (data: any) => data.type === "pricing-card" ? data : null,
        containsItem: (itemId: string) => {
            return ["plan-basic", "plan-pro", "plan-enterprise"].includes(itemId);
        },
    },
    {
        id: "tab-container-1:tabs",
        parentId: "root",
        accept: (data: any) => data.type === "tab" ? data : null,
        containsItem: (itemId: string) => {
            return ["tab-1-overview", "tab-1-details", "tab-1-faq"].includes(itemId);
        },
    },
];

describe("findAcceptingCollection", () => {
    // ── PRD 1.5 Scenario: 1단계 버블링 (직접 매칭) ──
    it("should find collection that directly contains the focused item", () => {
        const clipData = { type: "pricing-card", id: "plan-pro-copy", fields: {} };
        const result = findAcceptingCollection(
            "plan-basic",  // focused on a card
            clipData,
            COLLECTIONS,
        );
        expect(result).not.toBeNull();
        expect(result!.collectionId).toBe("ncp-pricing:cards");
    });

    // ── PRD 1.5 Scenario: 2단계 버블링 ──
    it("should bubble up when direct collection rejects", () => {
        const clipData = { type: "section", id: "ncp-hero-copy", fields: {} };
        const result = findAcceptingCollection(
            "plan-basic",  // focused on a card, but pasting a section
            clipData,
            COLLECTIONS,
        );
        // Cards collection rejects section → bubble to root → root accepts
        expect(result).not.toBeNull();
        expect(result!.collectionId).toBe("root");
    });

    // ── PRD 1.5 Scenario: 전체 거부 ──
    it("should return null when no collection accepts", () => {
        const clipData = { type: "unknown-widget", id: "x", fields: {} };
        const result = findAcceptingCollection(
            "plan-basic",
            clipData,
            COLLECTIONS,
        );
        expect(result).toBeNull();
    });

    // ── PRD 1.2 Scenario: 카드 → 탭 컬렉션 (타입 불일치) ──
    it("should reject when card is pasted into tab collection", () => {
        const clipData = { type: "pricing-card", id: "plan-copy", fields: {} };
        const result = findAcceptingCollection(
            "tab-1-overview",  // focused on a tab
            clipData,
            COLLECTIONS,
        );
        // Tab collection rejects card → bubble to root → root rejects card → null
        expect(result).toBeNull();
    });

    // ── PRD 1.1 Scenario: 정적 아이템 → 부모로 버블 ──
    it("should bubble from uncontained item to root", () => {
        const clipData = { type: "section", id: "new-section", fields: {} };
        const result = findAcceptingCollection(
            "ncp-hero-title",  // NOT directly in any collection
            clipData,
            COLLECTIONS,
        );
        // No collection contains "ncp-hero-title" → fallback to root → root accepts section
        expect(result).not.toBeNull();
        expect(result!.collectionId).toBe("root");
    });

    // ── PRD 1.2 Scenario: cross-collection 카드 붙여넣기 ──
    it("should accept same-type cross-collection paste", () => {
        const clipData = { type: "pricing-card", id: "from-other-section", fields: { title: "Pro" } };
        const result = findAcceptingCollection(
            "plan-basic",  // in pricing cards collection
            clipData,
            COLLECTIONS,
        );
        expect(result).not.toBeNull();
        expect(result!.collectionId).toBe("ncp-pricing:cards");
    });

    // ── Edge: 빈 컬렉션 목록 ──
    it("should return null when no collections registered", () => {
        const clipData = { type: "section", id: "x", fields: {} };
        const result = findAcceptingCollection("anything", clipData, []);
        expect(result).toBeNull();
    });
});
