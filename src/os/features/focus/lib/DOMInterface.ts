/**
 * DOMInterface: React-Managed DOM Registry
 * 
 * Replaces slow querySelector calls with O(1) Map lookups.
 * Components register themselves on mount and unregister on unmount.
 */

class DOMRegistry {
    private zones = new Map<string, HTMLElement>();
    private items = new Map<string, HTMLElement>();

    // --- Zone Management ---
    registerZone(id: string, el: HTMLElement) {
        if (!id || !el) return;
        this.zones.set(id, el);
    }

    unregisterZone(id: string) {
        this.zones.delete(id);
    }

    getZone(id: string): HTMLElement | undefined {
        return this.zones.get(id);
    }

    getZoneRect(id: string): DOMRect | null {
        return this.zones.get(id)?.getBoundingClientRect() ?? null;
    }

    // --- Item Management ---
    registerItem(id: string, el: HTMLElement) {
        if (!id || !el) return;
        this.items.set(id, el);
    }

    unregisterItem(id: string) {
        this.items.delete(id);
    }

    getItem(id: string): HTMLElement | undefined {
        return this.items.get(id);
    }

    getItemRect(id: string): DOMRect | null {
        return this.items.get(id)?.getBoundingClientRect() ?? null;
    }

    /**
     * Get all registered items as a list of {id, rect}
     * Useful for spatial searches
     */
    getAllItemRects(filterIds?: string[]): { id: string; rect: DOMRect }[] {
        const results: { id: string; rect: DOMRect }[] = [];
        const source = filterIds ? filterIds : this.items.keys();

        for (const id of source) {
            const el = this.items.get(id);
            if (el) {
                results.push({ id, rect: el.getBoundingClientRect() });
            }
        }
        return results;
    }
}

export const DOMInterface = new DOMRegistry();
