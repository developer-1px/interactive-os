/**
 * DocsViewer App — defineApp for ZIFT primitives.
 *
 * State: activePath — the shown document.
 * Sidebar navigation commands modify activePath.
 * DocsViewer reads activePath via useComputed.
 */

import { produce } from "immer";
import { defineApp } from "@/os/defineApp";

// ═══════════════════════════════════════════════════════════════════
// App State
// ═══════════════════════════════════════════════════════════════════

interface DocsState {
    activePath: string | null;
}

export const DocsApp = defineApp<DocsState>("docs-viewer", {
    activePath: null,
});

// ═══════════════════════════════════════════════════════════════════
// Sidebar Zone — tree navigation
// ═══════════════════════════════════════════════════════════════════

const sidebarZone = DocsApp.createZone("docs-sidebar");

/** SELECT_DOC — sets activePath. Expandable items are skipped via cursor.isExpandable. */
export const selectDoc = sidebarZone.command(
    "SELECT_DOC",
    (ctx, payload: { id: string; isExpandable: boolean }) => {
        if (payload.isExpandable) return { state: ctx.state };
        return {
            state: produce(ctx.state, (draft) => {
                draft.activePath = payload.id;
            }),
        };
    },
);

export const DocsSidebarUI = sidebarZone.bind({
    role: "tree",
    onAction: (cursor) => selectDoc({ id: cursor.focusId, isExpandable: cursor.isExpandable }),
    onSelect: (cursor) => selectDoc({ id: cursor.focusId, isExpandable: cursor.isExpandable }),
    options: {
        select: { followFocus: true },
        activate: { onClick: true },
    },
});

// ═══════════════════════════════════════════════════════════════════
// Reader Zone — section-based content navigation
// ═══════════════════════════════════════════════════════════════════

const readerZone = DocsApp.createZone("docs-reader");

// Commands: stateless — no state change, scroll effect handled by component
const NEXT_SECTION = readerZone.command(
    "DOCS_NEXT_SECTION",
    () => undefined,
);

const PREV_SECTION = readerZone.command(
    "DOCS_PREV_SECTION",
    () => undefined,
);

export const DocsReaderUI = readerZone.bind({
    role: "feed",
});

// ═══════════════════════════════════════════════════════════════════
// Fallback Middleware — catches Space when no zone handles it
// ═══════════════════════════════════════════════════════════════════

import { os } from "@/os/kernel";

os.use({
    id: "docs-section-nav",
    fallback(event: Event): ReturnType<NonNullable<Parameters<typeof os.use>[0]["fallback"]>> {
        if (!(event instanceof KeyboardEvent)) return null;
        if (event.key === " " && !event.shiftKey) return NEXT_SECTION();
        if (event.key === " " && event.shiftKey) return PREV_SECTION();
        return null;
    },
});
