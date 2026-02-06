/**
 * DOM Utilities - Direct DOM Access
 * 
 * getElementById 기반 O(1) 조회
 * DOMRegistry 대체 - 생명주기 관리 불필요
 */

export const DOM = {
    /**
     * Get group container element
     */
    getGroup(groupId: string): HTMLElement | null {
        return document.getElementById(groupId);
    },

    /**
     * Get item element
     */
    getItem(itemId: string): HTMLElement | null {
        return document.getElementById(itemId);
    },

    /**
     * Get all item IDs in a group, in DOM order
     */
    getGroupItems(groupId: string): string[] {
        const container = document.getElementById(groupId);
        if (!container) return [];

        const elements = container.querySelectorAll('[data-item-id]');
        return Array.from(elements)
            .map(el => el.getAttribute('data-item-id'))
            .filter((id): id is string => id !== null);
    },

    /**
     * Get group bounding rect
     */
    getGroupRect(groupId: string): DOMRect | undefined {
        return this.getGroup(groupId)?.getBoundingClientRect();
    },

    /**
     * Get all group rects (uses data-focus-group attribute)
     */
    getAllGroupRects(): Map<string, DOMRect> {
        const result = new Map<string, DOMRect>();
        const groups = document.querySelectorAll('[data-focus-group]');
        for (const el of groups) {
            const id = el.getAttribute('data-focus-group');
            if (id) result.set(id, el.getBoundingClientRect());
        }
        return result;
    },
};
