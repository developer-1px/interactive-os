// Tab Axis: Tab key navigation logic (v7.3 Semantics)
// - loop: Focus trapped within zone
// - escape: Jump to next Zone in DOM order
// - flow: Linear item traversal across all zones
import type { FocusBehavior } from "@os/entities/FocusBehavior";
import type { ZoneMetadata } from "@os/entities/ZoneMetadata";

export interface TabNavigationContext {
    focusedItemId: string | null;
    zoneId: string;
    isShiftTab: boolean;
    registry: Record<string, ZoneMetadata>;
    behavior: FocusBehavior;
}

type Registry = Record<string, ZoneMetadata>;

// ─────────────────────────────────────────────────────────────
// Main Entry
// ─────────────────────────────────────────────────────────────

export function executeTabNavigation(ctx: TabNavigationContext): string | null {
    switch (ctx.behavior.tab) {
        case "loop": return executeLoopNavigation(ctx);
        case "escape": return executeEscapeNavigation(ctx);
        case "flow": return executeFlowNavigation(ctx);
        default: return null;
    }
}

// ─────────────────────────────────────────────────────────────
// LOOP: Trapped within current zone
// ─────────────────────────────────────────────────────────────

function executeLoopNavigation(ctx: TabNavigationContext): string | null {
    const rootId = findAncestor(ctx.zoneId, ctx.registry, z => z.behavior?.tab === "loop") ?? ctx.zoneId;
    const sequence = buildSequence(rootId, ctx.registry);
    return navigateSequence(sequence, ctx.focusedItemId, ctx.isShiftTab, true, ctx.behavior.tabSkip);
}

// ─────────────────────────────────────────────────────────────
// ESCAPE: Jump to next zone in DOM order
// ─────────────────────────────────────────────────────────────

function executeEscapeNavigation(ctx: TabNavigationContext): string | null {
    const zones = sortByDOM(Object.values(ctx.registry), z => `[data-zone-id="${z.id}"]`);
    const currentIdx = zones.findIndex(z => z.id === ctx.zoneId);
    if (currentIdx === -1) return null;

    const dir = ctx.isShiftTab ? -1 : 1;
    for (let i = 1; i < zones.length; i++) {
        const nextZone = zones[(currentIdx + i * dir + zones.length) % zones.length];
        const entry = resolveEntry(nextZone, ctx.isShiftTab, ctx.registry);
        if (entry) return entry;
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
// FLOW: Linear traversal across entire tree
// ─────────────────────────────────────────────────────────────

function executeFlowNavigation(ctx: TabNavigationContext): string | null {
    const rootId = findRoot(ctx.zoneId, ctx.registry);
    if (!rootId) return null;
    const sequence = buildSequence(rootId, ctx.registry);
    return navigateSequence(sequence, ctx.focusedItemId, ctx.isShiftTab, false, ctx.behavior.tabSkip);
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function navigateSequence(
    seq: string[],
    currentId: string | null,
    reverse: boolean,
    wrap: boolean,
    skip?: "none" | "skip-disabled"
): string | null {
    if (seq.length === 0) return null;

    const dir = reverse ? -1 : 1;
    const idx = currentId ? seq.indexOf(currentId) : -1;
    let next = idx === -1 ? (reverse ? seq.length - 1 : 0) : idx + dir;

    for (let i = 0; i < seq.length; i++) {
        if (wrap) next = (next + seq.length) % seq.length;
        if (next < 0 || next >= seq.length) return null;
        if (!isSkipped(seq[next], skip)) return seq[next];
        next += dir;
    }
    return null;
}

function buildSequence(zoneId: string, reg: Registry): string[] {
    const zone = reg[zoneId];
    if (!zone) return [];

    const items = zone.items ? [...zone.items] : [];
    const children = sortByDOM(
        Object.values(reg).filter(z => z.parentId === zoneId),
        z => `[data-zone-id="${z.id}"]`
    );
    children.forEach(c => items.push(...buildSequence(c.id, reg)));

    return sortByDOM(items, id => `#${id}`);
}

function resolveEntry(zone: ZoneMetadata, reverse: boolean, reg: Registry): string | null {
    const items = zone.items || [];
    if (items.length > 0) {
        if (reverse) return items[items.length - 1];
        if (zone.behavior?.entry === "restore" && zone.lastFocusedId) return zone.lastFocusedId;
        return items[0];
    }
    // Check child zones
    const children = sortByDOM(Object.values(reg).filter(z => z.parentId === zone.id), z => `[data-zone-id="${z.id}"]`);
    const target = reverse ? children[children.length - 1] : children[0];
    return target ? resolveEntry(target, reverse, reg) : null;
}

function findAncestor(id: string, reg: Registry, pred: (z: ZoneMetadata) => boolean): string | null {
    let cur = reg[id];
    while (cur) {
        if (pred(cur)) return cur.id;
        cur = cur.parentId ? reg[cur.parentId] : undefined!;
    }
    return null;
}

function findRoot(id: string, reg: Registry): string | null {
    let cur = reg[id];
    if (!cur) return null;
    while (cur.parentId && reg[cur.parentId]) cur = reg[cur.parentId];
    return cur.id;
}

function sortByDOM<T>(items: T[], selector: (item: T) => string): T[] {
    return [...items].sort((a, b) => {
        const elA = document.querySelector(selector(a));
        const elB = document.querySelector(selector(b));
        if (!elA || !elB) return 0;
        const pos = elA.compareDocumentPosition(elB);
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : pos & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
    });
}

function isSkipped(id: string, policy?: "none" | "skip-disabled"): boolean {
    if (policy !== "skip-disabled") return false;
    const el = document.getElementById(id);
    return el?.getAttribute("aria-disabled") === "true" || el?.hasAttribute("disabled") || false;
}
