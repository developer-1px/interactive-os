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
});
