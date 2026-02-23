/**
 * useCursorMeta — Declarative cursor metadata registration.
 *
 * Each Builder primitive calls this hook with its itemId and a
 * module-level CURSOR_META constant. The hook handles mount/unmount
 * registration automatically.
 *
 * @example
 *   const CURSOR_META = { tag: "icon", color: "#f59e0b" } as const;
 *   export function BuilderIcon({ id }) {
 *     useCursorMeta(id, CURSOR_META);
 *     // ...
 *   }
 */

import { useEffect } from "react";
import { type CursorMeta, cursorRegistry } from "../model/cursorRegistry";

export function useCursorMeta(itemId: string, meta: CursorMeta): void {
    useEffect(() => {
        cursorRegistry.set(itemId, meta);
        return () => {
            cursorRegistry.delete(itemId);
        };
    }, [itemId, meta]);
}
