/**
 * Block Schemas — each block type declares its property composition.
 *
 * Schema maps field keys to primitive types.
 * Panel reads schema to render the correct widget.
 * Canvas reads schema to decode field values.
 *
 * OCP: new block type = new entry here. No other file changes.
 *
 * @see docs/1-project/builder-property-schema/BOARD.md
 */

import type { PrimitiveType } from "./primitives";

// ═══════════════════════════════════════════════════════════════════
// Property Definition — a single field in a block schema
// ═══════════════════════════════════════════════════════════════════

export interface PropertyDef {
    /** Primitive type — determines encode/decode + widget */
    readonly type: PrimitiveType;
    /** Display label in properties panel */
    readonly label: string;
    /** Placeholder text for empty fields */
    readonly placeholder?: string;
    /** Options for select type */
    readonly options?: readonly string[];
}

/** Schema for a block type: field key → property definition */
export type BlockSchema = Record<string, PropertyDef>;

// ═══════════════════════════════════════════════════════════════════
// Block Schema Registry — block type → property schema
//
// Derived from INITIAL_STATE data in appState.ts.
// Each entry maps the block.type string to its field definitions.
// ═══════════════════════════════════════════════════════════════════

export const blockSchemas: Record<string, BlockSchema> = {
    hero: {
        title: { type: "multiline", label: "Title" },
        sub: { type: "multiline", label: "Subtitle" },
        brand: { type: "text", label: "Brand" },
        cta: { type: "button", label: "CTA Button" },
        "nav-login": { type: "button", label: "Login Button" },
        "nav-signup": { type: "button", label: "Signup Button" },
        "portal-title": { type: "text", label: "Portal Title" },
        "portal-subtitle": { type: "text", label: "Portal Subtitle" },
    },

    news: {
        title: { type: "multiline", label: "Section Title" },
        all: { type: "button", label: "View All Link" },
        "item-1-title": { type: "multiline", label: "Item 1 Title" },
        "item-1-desc": { type: "multiline", label: "Item 1 Description" },
        "item-1-date": { type: "date", label: "Item 1 Date" },
        "item-2-title": { type: "multiline", label: "Item 2 Title" },
        "item-2-date": { type: "date", label: "Item 2 Date" },
        "item-3-title": { type: "multiline", label: "Item 3 Title" },
        "item-3-date": { type: "date", label: "Item 3 Date" },
    },

    services: {
        category: { type: "text", label: "Category" },
        title: { type: "multiline", label: "Section Title" },
    },

    "service-card": {
        "item-title": { type: "text", label: "Title" },
        "item-desc": { type: "multiline", label: "Description" },
        icon: { type: "icon", label: "Icon" },
        color: { type: "color", label: "Theme Color" },
        badge: { type: "badge", label: "Badge" },
    },

    pricing: {
        badge: { type: "badge", label: "Section Badge" },
        title: { type: "text", label: "Title" },
        sub: { type: "text", label: "Subtitle" },
        "m-starter-cta": { type: "button", label: "Monthly Starter CTA" },
        "m-pro-cta": { type: "button", label: "Monthly Pro CTA" },
        "m-ent-cta": { type: "button", label: "Monthly Enterprise CTA" },
        "a-starter-cta": { type: "button", label: "Annual Starter CTA" },
        "a-pro-cta": { type: "button", label: "Annual Pro CTA" },
        "a-ent-cta": { type: "button", label: "Annual Enterprise CTA" },
    },

    "pricing-tab": {
        // No editable fields — tab container only
    },

    tabs: {
        title: { type: "text", label: "Container Title" },
    },

    tab: {
        // Structural only — no editable fields
    },

    section: {
        heading: { type: "text", label: "Heading" },
        description: { type: "multiline", label: "Description" },
    },

    footer: {
        brand: { type: "text", label: "Brand" },
        desc: { type: "multiline", label: "Description" },
        copyright: { type: "text", label: "Copyright" },
    },
};

// ═══════════════════════════════════════════════════════════════════
// Lookup helper
// ═══════════════════════════════════════════════════════════════════

/**
 * Get schema for a block type. Returns empty schema for unknown types.
 */
export function getBlockSchema(blockType: string): BlockSchema {
    return blockSchemas[blockType] ?? {};
}

/**
 * Get property definition for a specific field in a block type.
 * Falls back to "text" for unregistered fields.
 */
export function getPropertyDef(blockType: string, fieldKey: string): PropertyDef {
    return blockSchemas[blockType]?.[fieldKey] ?? { type: "text", label: formatLabel(fieldKey) };
}

/** Format field key to display label: "item-1-title" → "Item 1 Title" */
function formatLabel(key: string): string {
    return key
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
