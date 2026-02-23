/**
 * DocsViewer App — minimal defineApp for ZIFT primitives.
 *
 * State is intentionally empty. The purpose is to get public
 * Zone/Item/Trigger primitives for the sidebar tree.
 * State can be added later without changing any JSX.
 */

import { defineApp } from "@/os/defineApp";

// ═══════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════

export const DocsApp = defineApp<Record<string, never>>("docs-viewer", {});

// ═══════════════════════════════════════════════════════════════════
// Sidebar Zone — tree navigation
// ═══════════════════════════════════════════════════════════════════

const sidebarZone = DocsApp.createZone("docs-sidebar");

export const DocsSidebarUI = sidebarZone.bind({
    role: "tree",
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
