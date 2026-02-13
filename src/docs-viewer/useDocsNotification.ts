/**
 * useDocsNotification — Detect new docs via HMR file changes.
 *
 * Takes a snapshot of doc file keys on mount.
 * When HMR triggers a module update (via import.meta.glob),
 * diffs against snapshot to detect newly added files.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { docsModules } from "@/docs-viewer/docsUtils";

/** Get current list of doc file keys */
function getDocKeys(): Set<string> {
    return new Set(Object.keys(docsModules));
}

export function useDocsNotification() {
    const snapshotRef = useRef<Set<string>>(getDocKeys());
    const [hasNewDocs, setHasNewDocs] = useState(false);
    const [newDocPaths, setNewDocPaths] = useState<string[]>([]);

    // Check for new docs on HMR updates
    useEffect(() => {
        if (!import.meta.hot) return;

        const checkForNewDocs = () => {
            const current = getDocKeys();
            const snapshot = snapshotRef.current;
            const added: string[] = [];

            for (const key of current) {
                if (!snapshot.has(key)) {
                    added.push(key);
                }
            }

            if (added.length > 0) {
                setHasNewDocs(true);
                setNewDocPaths((prev) => [...prev, ...added]);
            }
        };

        // Vite HMR: listen for any module update events
        import.meta.hot.on("vite:afterUpdate", checkForNewDocs);

        return () => {
            import.meta.hot?.off?.("vite:afterUpdate", checkForNewDocs);
        };
    }, []);

    const clearNotification = useCallback(() => {
        snapshotRef.current = getDocKeys();
        setHasNewDocs(false);
        setNewDocPaths([]);
    }, []);

    return { hasNewDocs, newDocPaths, clearNotification };
}
