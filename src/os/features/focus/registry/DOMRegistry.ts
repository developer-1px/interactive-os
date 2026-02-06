/**
 * DOMRegistry - Registry-First DOM Access
 * 
 * Minimal registry for DOM element access.
 * Uses DOM queries as source of truth for item ordering.
 */

// ═══════════════════════════════════════════════════════════════════
// Registry Maps
// ═══════════════════════════════════════════════════════════════════

const groupElements = new Map<string, HTMLElement>();
const itemElements = new Map<string, HTMLElement>();

// ═══════════════════════════════════════════════════════════════════
// Public Interface
// ═══════════════════════════════════════════════════════════════════

export const DOMRegistry = {
    // --- Group Registration ---
    registerGroup(groupId: string, element: HTMLElement): void {
        groupElements.set(groupId, element);
    },

    unregisterGroup(groupId: string): void {
        groupElements.delete(groupId);
    },

    getGroup(groupId: string): HTMLElement | undefined {
        return groupElements.get(groupId);
    },

    // --- Item Registration ---
    registerItem(itemId: string, groupId: string, element: HTMLElement): void {
        itemElements.set(itemId, element);
    },

    unregisterItem(itemId: string): void {
        itemElements.delete(itemId);
    },

    getItem(itemId: string): HTMLElement | undefined {
        return itemElements.get(itemId);
    },

    // --- Queries ---
    /**
     * Get all items in a group, ordered by their actual DOM position.
     * DOM is the source of truth for item order.
     */
    getGroupItems(groupId: string): string[] {
        const container = groupElements.get(groupId);
        if (!container) return [];

        // Query DOM directly for items in visual order
        const elements = container.querySelectorAll('[data-item-id]');
        return Array.from(elements)
            .map(el => el.getAttribute('data-item-id'))
            .filter((id): id is string => id !== null);
    },

    getAllGroups(): string[] {
        return Array.from(groupElements.keys());
    },

    // --- Spatial Helpers ---
    getGroupRect(groupId: string): DOMRect | undefined {
        const el = groupElements.get(groupId);
        return el?.getBoundingClientRect();
    },

    getAllGroupRects(): Map<string, DOMRect> {
        const result = new Map<string, DOMRect>();
        for (const [id, el] of groupElements) {
            result.set(id, el.getBoundingClientRect());
        }
        return result;
    },

    // --- Debugging ---
    __debug(): { groups: number; items: number } {
        return {
            groups: groupElements.size,
            items: itemElements.size,
        };
    },
};
