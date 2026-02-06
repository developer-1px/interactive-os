/**
 * DOMRegistry - Registry-First DOM Access
 * 
 * All DOM element access goes through this registry.
 * No querySelector calls in focus logic.
 */

// ═══════════════════════════════════════════════════════════════════
// Registry Maps
// ═══════════════════════════════════════════════════════════════════

const groupElements = new Map<string, HTMLElement>();
const itemElements = new Map<string, HTMLElement>();
const itemToGroup = new Map<string, string>();

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
        // Clean up items belonging to this group
        for (const [itemId, group] of itemToGroup.entries()) {
            if (group === groupId) {
                itemElements.delete(itemId);
                itemToGroup.delete(itemId);
            }
        }
    },

    getGroup(groupId: string): HTMLElement | undefined {
        return groupElements.get(groupId);
    },

    /** @deprecated Use getGroup */
    getZone(zoneId: string): HTMLElement | undefined {
        return groupElements.get(zoneId);
    },

    // --- Item Registration ---
    registerItem(itemId: string, groupId: string, element: HTMLElement): void {
        itemElements.set(itemId, element);
        itemToGroup.set(itemId, groupId);
    },

    unregisterItem(itemId: string): void {
        itemElements.delete(itemId);
        itemToGroup.delete(itemId);
    },

    getItem(itemId: string): HTMLElement | undefined {
        return itemElements.get(itemId);
    },

    getItemGroup(itemId: string): string | undefined {
        return itemToGroup.get(itemId);
    },

    // --- Queries ---
    getGroupItems(groupId: string): string[] {
        const items: string[] = [];
        for (const [itemId, group] of itemToGroup.entries()) {
            if (group === groupId) {
                items.push(itemId);
            }
        }
        return items;
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
