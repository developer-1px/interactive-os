/**
 * Primitives encode/decode round-trip tests.
 *
 * Verifies: encode(decode(type, raw)) === raw
 * for all primitive types including backward compat with PoC data.
 */

import { describe, expect, it } from "vitest";
import { getBlockSchema, getPropertyDef } from "../../blockSchemas";
import type { PrimitiveType } from "../../primitives";
import { decode, encode } from "../../primitives";

describe("Primitives: encode/decode round-trip", () => {
  // ── Identity types (encode ∘ decode = identity) ──

  it.each([
    ["text", "Hello World"],
    ["text", ""],
    ["multiline", "Line 1\nLine 2\nLine 3"],
    ["date", "2024.03.15"],
    ["icon", "Server"],
    ["icon", "Database"],
    ["color", "#3b82f6"],
    ["color", "text-blue-600 bg-blue-50"],
    ["badge", "NEW"],
    ["badge", "UPDATED"],
    ["badge", ""],
    ["toggle", "true"],
    ["toggle", "false"],
    ["number", "42"],
    ["number", "0"],
  ] as [PrimitiveType, string][])("%s: round-trip(%s)", (type, raw) => {
    const decoded = decode(type, raw);
    const encoded = encode(decoded);
    expect(encoded).toBe(raw);
  });

  // ── Compound types (JSON round-trip) ──

  it("button: text-only (backward compat)", () => {
    const decoded = decode("button", "무료로 시작하기");
    expect(decoded).toEqual({ type: "button", text: "무료로 시작하기" });
    // Encoding a text-only button produces JSON
    const encoded = encode(decoded);
    expect(JSON.parse(encoded)).toEqual({ text: "무료로 시작하기" });
  });

  it("button: full compound", () => {
    const value = {
      type: "button" as const,
      text: "Sign Up",
      href: "/signup",
      action: "link" as const,
    };
    const encoded = encode(value);
    const decoded = decode("button", encoded);
    expect(decoded).toEqual(value);
  });

  it("link: full compound", () => {
    const value = {
      type: "link" as const,
      text: "Learn More",
      href: "https://example.com",
      target: "_blank" as const,
    };
    const encoded = encode(value);
    const decoded = decode("link", encoded);
    expect(decoded).toEqual(value);
  });

  it("image: full compound", () => {
    const value = {
      type: "image" as const,
      src: "/hero.png",
      alt: "Hero Image",
    };
    const encoded = encode(value);
    const decoded = decode("image", encoded);
    expect(decoded).toEqual(value);
  });

  it("select: value preserved", () => {
    const decoded = decode("select", "monthly");
    expect(decoded).toEqual({ type: "select", value: "monthly", options: [] });
  });
});

describe("Block Schemas", () => {
  it("hero schema has expected fields", () => {
    const schema = getBlockSchema("hero");
    expect(schema["title"]).toEqual({ type: "multiline", label: "Title" });
    expect(schema["cta"]).toEqual({ type: "button", label: "CTA Button" });
    expect(schema["brand"]).toEqual({ type: "text", label: "Brand" });
  });

  it("service-card schema has expected fields", () => {
    const schema = getBlockSchema("service-card");
    expect(schema["icon"]).toEqual({ type: "icon", label: "Icon" });
    expect(schema["color"]).toEqual({ type: "color", label: "Theme Color" });
    expect(schema["badge"]).toEqual({ type: "badge", label: "Badge" });
  });

  it("unknown block type returns empty schema", () => {
    expect(getBlockSchema("unknown-type")).toEqual({});
  });

  it("getPropertyDef falls back to text for unknown fields", () => {
    const def = getPropertyDef("hero", "unknown-field");
    expect(def.type).toBe("text");
    expect(def.label).toBe("Unknown Field");
  });

  it("getPropertyDef formats label from key", () => {
    const def = getPropertyDef("nonexistent", "item-1-title");
    expect(def.label).toBe("Item 1 Title");
  });
});
