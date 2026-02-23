/**
 * CursorRegistry — Builder-scoped registry for cursor metadata.
 *
 * Each primitive declares its content type and color via `useCursorMeta`.
 * BuilderCursor reads from this registry — no hardcoded TYPE_COLORS.
 *
 * OCP: adding a new primitive = registering its own metadata.
 * BuilderCursor.tsx never changes.
 *
 * Reactivity: not needed. Focus change (os.useComputed) already triggers
 * BuilderCursor re-render, at which point it reads the latest registry.
 */

export interface CursorMeta {
    /** Content type tag displayed in the cursor badge (e.g. "icon", "button") */
    readonly tag: string;
    /** Cursor highlight color (hex) */
    readonly color: string;
}

const registry = new Map<string, CursorMeta>();

export const cursorRegistry = {
    get(itemId: string): CursorMeta | null {
        return registry.get(itemId) ?? null;
    },

    set(itemId: string, meta: CursorMeta): void {
        registry.set(itemId, meta);
    },

    delete(itemId: string): void {
        registry.delete(itemId);
    },
} as const;
