export const getBubblePath = (path: string[]): string[] => {
    // Returns path from leaf to root (reversed)
    if (!path) return [];
    return [...path].reverse();
};

export const resolvePivot = (items: string[], currentId?: string | null, _zoneId?: string): string => {
    // If current focus is in the list, keep it
    if (currentId && items.includes(currentId)) return currentId;

    // Otherwise return first item (default behavior)
    // In a real system, this might use 'history' or 'lastFocused' metadata from zone
    return items[0] || "";
};