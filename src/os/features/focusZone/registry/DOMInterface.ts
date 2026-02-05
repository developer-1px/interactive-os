/**
 * DOMInterface - Registry-First DOM Access
 * 
 * All DOM element access goes through this registry.
 * No querySelector calls in focus logic.
 */

// ═══════════════════════════════════════════════════════════════════
// Registry Maps
// ═══════════════════════════════════════════════════════════════════

const zoneElements = new Map<string, HTMLElement>();
const itemElements = new Map<string, HTMLElement>();
const itemToZone = new Map<string, string>();

// ═══════════════════════════════════════════════════════════════════
// Public Interface
// ═══════════════════════════════════════════════════════════════════

export const DOMInterface = {
    // --- Zone Registration ---
    registerZone(zoneId: string, element: HTMLElement): void {
        zoneElements.set(zoneId, element);
    },

    unregisterZone(zoneId: string): void {
        zoneElements.delete(zoneId);
        // Clean up items belonging to this zone
        for (const [itemId, zone] of itemToZone.entries()) {
            if (zone === zoneId) {
                itemElements.delete(itemId);
                itemToZone.delete(itemId);
            }
        }
    },

    getZone(zoneId: string): HTMLElement | undefined {
        return zoneElements.get(zoneId);
    },

    // --- Item Registration ---
    registerItem(itemId: string, zoneId: string, element: HTMLElement): void {
        itemElements.set(itemId, element);
        itemToZone.set(itemId, zoneId);
    },

    unregisterItem(itemId: string): void {
        itemElements.delete(itemId);
        itemToZone.delete(itemId);
    },

    getItem(itemId: string): HTMLElement | undefined {
        return itemElements.get(itemId);
    },

    getItemZone(itemId: string): string | undefined {
        return itemToZone.get(itemId);
    },

    // --- Queries ---
    getZoneItems(zoneId: string): string[] {
        const items: string[] = [];
        for (const [itemId, zone] of itemToZone.entries()) {
            if (zone === zoneId) {
                items.push(itemId);
            }
        }
        return items;
    },

    getAllZones(): string[] {
        return Array.from(zoneElements.keys());
    },

    // --- Debugging ---
    __debug(): { zones: number; items: number } {
        return {
            zones: zoneElements.size,
            items: itemElements.size,
        };
    },
};
