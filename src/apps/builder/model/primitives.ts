/**
 * Primitives — Stable web property types.
 *
 * Each primitive defines:
 *   1. A typed value structure (Domain Truth)
 *   2. encode/decode functions (boundary Transform)
 *
 * These are atoms — they rarely change.
 * Block schemas compose these into molecules.
 *
 * @see docs/1-project/builder-property-schema/BOARD.md
 */

// ═══════════════════════════════════════════════════════════════════
// Primitive Value Types — each has its own optimal structure
// ═══════════════════════════════════════════════════════════════════

/** Single-line text */
export interface TextValue {
    readonly type: "text";
    readonly value: string;
}

/** Multi-line text */
export interface MultilineValue {
    readonly type: "multiline";
    readonly value: string;
}

/** Button with optional link/action */
export interface ButtonValue {
    readonly type: "button";
    readonly text: string;
    readonly href?: string;
    readonly action?: "link" | "scroll" | "modal" | "submit";
}

/** Navigation link */
export interface LinkValue {
    readonly type: "link";
    readonly text: string;
    readonly href: string;
    readonly target?: "_blank" | "_self";
}

/** Image with metadata */
export interface ImageValue {
    readonly type: "image";
    readonly src: string;
    readonly alt?: string;
}

/** Icon reference */
export interface IconValue {
    readonly type: "icon";
    readonly name: string;
}

/** Theme color */
export interface ColorValue {
    readonly type: "color";
    readonly value: string;
    readonly label?: string;
}

/** Badge / tag */
export interface BadgeValue {
    readonly type: "badge";
    readonly text: string;
    readonly variant?: "default" | "success" | "warning" | "info";
}

/** Date string */
export interface DateValue {
    readonly type: "date";
    readonly value: string; // ISO or display format
}

/** Select from options */
export interface SelectValue {
    readonly type: "select";
    readonly value: string;
    readonly options: readonly string[];
}

/** Boolean toggle */
export interface ToggleValue {
    readonly type: "toggle";
    readonly value: boolean;
}

/** Numeric value */
export interface NumberValue {
    readonly type: "number";
    readonly value: number;
}

// ═══════════════════════════════════════════════════════════════════
// Union type
// ═══════════════════════════════════════════════════════════════════

export type PrimitiveValue =
    | TextValue
    | MultilineValue
    | ButtonValue
    | LinkValue
    | ImageValue
    | IconValue
    | ColorValue
    | BadgeValue
    | DateValue
    | SelectValue
    | ToggleValue
    | NumberValue;

export type PrimitiveType = PrimitiveValue["type"];

// ═══════════════════════════════════════════════════════════════════
// Encode / Decode — boundary Transform (pure functions)
//
// Storage format: string (Record<string, string> compatibility)
// Runtime format: PrimitiveValue (typed, structured)
//
// Simple types (text, icon, date) use identity encoding.
// Compound types (button, image, link) use JSON encoding.
// ═══════════════════════════════════════════════════════════════════

/**
 * Encode a PrimitiveValue → string for storage in Block.fields.
 * Pure function, no side effects.
 */
export function encode(value: PrimitiveValue): string {
    switch (value.type) {
        // Identity — string value stored as-is
        case "text":
        case "multiline":
        case "date":
            return value.value;

        case "icon":
            return value.name;

        case "color":
            return value.value;

        case "badge":
            return value.text;

        case "toggle":
            return value.value ? "true" : "false";

        case "number":
            return String(value.value);

        // Compound — JSON for multi-field values
        case "button":
            return JSON.stringify({
                text: value.text,
                ...(value.href && { href: value.href }),
                ...(value.action && { action: value.action }),
            });

        case "link":
            return JSON.stringify({
                text: value.text,
                href: value.href,
                ...(value.target && { target: value.target }),
            });

        case "image":
            return JSON.stringify({
                src: value.src,
                ...(value.alt && { alt: value.alt }),
            });

        case "select":
            return value.value;
    }
}

/**
 * Decode a string from Block.fields → PrimitiveValue.
 * Requires the primitive type to interpret correctly.
 * Pure function, no side effects.
 */
export function decode(type: PrimitiveType, raw: string): PrimitiveValue {
    switch (type) {
        case "text":
            return { type: "text", value: raw };

        case "multiline":
            return { type: "multiline", value: raw };

        case "date":
            return { type: "date", value: raw };

        case "icon":
            return { type: "icon", name: raw };

        case "color":
            return { type: "color", value: raw };

        case "badge":
            return { type: "badge", text: raw };

        case "toggle":
            return { type: "toggle", value: raw === "true" };

        case "number":
            return { type: "number", value: Number(raw) || 0 };

        case "button": {
            const parsed = tryParseJSON(raw);
            if (parsed) {
                return { type: "button", text: parsed.text ?? raw, href: parsed.href, action: parsed.action };
            }
            // Fallback: raw string is the button text (backward compat with PoC data)
            return { type: "button", text: raw };
        }

        case "link": {
            const parsed = tryParseJSON(raw);
            if (parsed) {
                return { type: "link", text: parsed.text ?? "", href: parsed.href ?? "", target: parsed.target };
            }
            return { type: "link", text: raw, href: "" };
        }

        case "image": {
            const parsed = tryParseJSON(raw);
            if (parsed) {
                return { type: "image", src: parsed.src ?? raw, alt: parsed.alt };
            }
            return { type: "image", src: raw };
        }

        case "select":
            return { type: "select", value: raw, options: [] };
    }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function tryParseJSON(s: string): Record<string, string> | null {
    try {
        const parsed = JSON.parse(s);
        return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
        return null;
    }
}
