/**
 * BuilderRegistry — Hierarchy data for Builder elements.
 *
 * Builder.Section/Group/Item이 mount할 때 등록하고,
 * drillDown/drillUp 콜백이 읽는다. DOM 접근 없이 순수 데이터 조회.
 *
 * Rule: DOM은 OS에서만 읽는다. 앱은 Registry/State만 사용한다.
 */

import type { BuilderLevel } from "../primitives/Builder";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface BuilderEntry {
    level: BuilderLevel;
    parentId: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════════

const entries = new Map<string, BuilderEntry>();
const children = new Map<string, string[]>();

export const BuilderRegistry = {
    /**
     * Register a builder element with its level and parent.
     * Called by Builder.Section/Group/Item on mount.
     */
    register(id: string, entry: BuilderEntry): void {
        entries.set(id, entry);

        // Track parent→children relationship
        if (entry.parentId) {
            const siblings = children.get(entry.parentId) ?? [];
            if (!siblings.includes(id)) {
                siblings.push(id);
                children.set(entry.parentId, siblings);
            }
        }
    },

    /**
     * Unregister a builder element.
     * Called by Builder.Section/Group/Item on unmount.
     */
    unregister(id: string): void {
        const entry = entries.get(id);
        if (entry?.parentId) {
            const siblings = children.get(entry.parentId);
            if (siblings) {
                const idx = siblings.indexOf(id);
                if (idx !== -1) siblings.splice(idx, 1);
                if (siblings.length === 0) children.delete(entry.parentId);
            }
        }
        entries.delete(id);
        children.delete(id);
    },

    /** Get entry by ID. */
    get(id: string): BuilderEntry | undefined {
        return entries.get(id);
    },

    /** Get level of an element. */
    getLevel(id: string): BuilderLevel | null {
        return entries.get(id)?.level ?? null;
    },

    /** Get direct children of an element (in mount order). */
    getChildren(id: string): readonly string[] {
        return children.get(id) ?? [];
    },

    /**
     * Get the first descendant at a specific level.
     * Walks the children tree recursively.
     */
    getFirstDescendantAtLevel(
        id: string,
        level: BuilderLevel,
    ): string | null {
        const kids = children.get(id);
        if (!kids) return null;

        for (const childId of kids) {
            const entry = entries.get(childId);
            if (entry?.level === level) return childId;
            // Recurse into children
            const found = BuilderRegistry.getFirstDescendantAtLevel(childId, level);
            if (found) return found;
        }
        return null;
    },

    /** Get parent ID. */
    getParent(id: string): string | null {
        return entries.get(id)?.parentId ?? null;
    },

    /**
     * Get the closest ancestor at a specific level.
     * Walks up the parent chain.
     */
    getAncestorAtLevel(id: string, level: BuilderLevel): string | null {
        let current = entries.get(id)?.parentId ?? null;
        while (current) {
            const entry = entries.get(current);
            if (entry?.level === level) return current;
            current = entry?.parentId ?? null;
        }
        return null;
    },

    /** Clear all entries (for testing). */
    clear(): void {
        entries.clear();
        children.clear();
    },
};
