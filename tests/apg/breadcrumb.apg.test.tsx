/**
 * APG Breadcrumb Pattern -- DOM Rendering Test (Tier 2)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 *
 * W3C APG Breadcrumb spec:
 *   - nav element with aria-label="Breadcrumb"
 *   - Ordered list (ol) containing link items
 *   - Last link has aria-current="page"
 *   - No keyboard interaction beyond standard link behavior
 *   - Visual separators excluded from accessibility tree
 *
 * ZIFT Classification: NONE (static landmark structure)
 *   - No Zone (no arrow-key navigation, no roving tabindex)
 *   - No Field (no value editing)
 *   - No Trigger (standard links, no OS command dispatch)
 *   - Pure structural ARIA -- nav landmark + aria-current
 *
 * Why no Tier 1 test:
 *   Breadcrumb has zero OS-managed keyboard interaction.
 *   There is no createOsPage test because there is nothing for the OS to handle.
 *   The only contract is correct ARIA structure, verified here via DOM rendering.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BreadcrumbPattern } from "@/pages/apg-showcase/patterns/BreadcrumbPattern";

function renderHTML(): string {
  return renderToString(<BreadcrumbPattern />);
}

/** Minimal DOM parser using jsdom (vitest provides it) */
function parseHTML(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(`<div>${html}</div>`, "text/html");
}

describe("APG Breadcrumb: Structural ARIA (DOM Rendering)", () => {
  // ═══════════════════════════════════════════════════
  // nav landmark with aria-label
  // ═══════════════════════════════════════════════════

  it("renders a nav element with aria-label='Breadcrumb'", () => {
    const doc = parseHTML(renderHTML());

    const nav = doc.querySelector("nav[aria-label='Breadcrumb']");
    expect(nav).toBeTruthy();
    expect(nav!.tagName.toLowerCase()).toBe("nav");
  });

  // ═══════════════════════════════════════════════════
  // Ordered list structure
  // ═══════════════════════════════════════════════════

  it("contains an ordered list (ol) inside the nav", () => {
    const doc = parseHTML(renderHTML());

    const nav = doc.querySelector("nav[aria-label='Breadcrumb']");
    const ol = nav?.querySelector("ol");
    expect(ol).toBeTruthy();
  });

  it("list items contain links", () => {
    const doc = parseHTML(renderHTML());

    const nav = doc.querySelector("nav[aria-label='Breadcrumb']");
    const links = nav?.querySelectorAll("a") ?? [];
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  // ═══════════════════════════════════════════════════
  // aria-current="page" on the last (current) link
  // ═══════════════════════════════════════════════════

  it("last link has aria-current='page'", () => {
    const doc = parseHTML(renderHTML());

    const nav = doc.querySelector("nav[aria-label='Breadcrumb']");
    const links = nav?.querySelectorAll("a") ?? [];
    const lastLink = links[links.length - 1];

    expect(lastLink?.getAttribute("aria-current")).toBe("page");
  });

  it("non-last links do NOT have aria-current", () => {
    const doc = parseHTML(renderHTML());

    const nav = doc.querySelector("nav[aria-label='Breadcrumb']");
    const links = Array.from(nav?.querySelectorAll("a") ?? []);

    for (let i = 0; i < links.length - 1; i++) {
      expect(links[i].hasAttribute("aria-current")).toBe(false);
    }
  });

  // ═══════════════════════════════════════════════════
  // Visual separators excluded from accessibility tree
  // ═══════════════════════════════════════════════════

  it("separators are hidden from accessibility tree (aria-hidden)", () => {
    const doc = parseHTML(renderHTML());

    const nav = doc.querySelector("nav[aria-label='Breadcrumb']");
    const separators = nav?.querySelectorAll("[aria-hidden='true']") ?? [];

    expect(separators.length).toBeGreaterThanOrEqual(1);
  });
});
