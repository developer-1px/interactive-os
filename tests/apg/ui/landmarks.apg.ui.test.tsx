/**
 * Landmarks Pattern — Projection Tests
 *
 * W3C APG Landmarks spec:
 * - 8 landmark roles: banner, main, navigation, complementary, contentinfo, search, form, region
 * - Keyboard interaction: "Not applicable"
 * - Semantic HTML creates implicit roles (<main>, <nav>, <header>, <footer>, <aside>, <search>, <section>)
 * - Multiple instances of same role require unique labels
 * - One banner, one main, one contentinfo per page
 *
 * ZIFT: NONE — purely structural/semantic, no OS state or interaction.
 * Test strategy: Verify rendered HTML contains correct landmark elements and labeling.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 * @see https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LandmarksPattern } from "@/pages/apg-showcase/patterns/LandmarksPattern";

function renderHTML(): string {
  return renderToString(<LandmarksPattern />);
}

describe("APG Landmarks: Semantic Structure", () => {
  it("renders a banner landmark (header with role=banner)", () => {
    const html = renderHTML();
    expect(html).toContain('role="banner"');
  });

  it("renders a main landmark (<main>)", () => {
    const html = renderHTML();
    expect(html).toMatch(/<main[\s>]/);
  });

  it("renders navigation landmarks (<nav>)", () => {
    const html = renderHTML();
    expect(html).toMatch(/<nav[\s>]/);
  });

  it("renders a complementary landmark (<aside>)", () => {
    const html = renderHTML();
    expect(html).toMatch(/<aside[\s>]/);
  });

  it("renders a contentinfo landmark (footer with role=contentinfo)", () => {
    const html = renderHTML();
    expect(html).toContain('role="contentinfo"');
  });

  it("renders a search landmark (<search>)", () => {
    const html = renderHTML();
    expect(html).toMatch(/<search[\s>]/);
  });

  it("renders a form landmark (<form> with aria-labelledby)", () => {
    const html = renderHTML();
    expect(html).toMatch(/<form[\s>]/);
    expect(html).toContain("aria-labelledby");
  });

  it("renders a region landmark (<section> with aria-labelledby)", () => {
    const html = renderHTML();
    expect(html).toMatch(/<section[\s>]/);
    expect(html).toContain("aria-labelledby");
  });
});

describe("APG Landmarks: Labeling", () => {
  it("banner has aria-label", () => {
    const html = renderHTML();
    // role="banner" element should have aria-label
    expect(html).toMatch(/role="banner"[^>]*aria-label/);
  });

  it("main has aria-label", () => {
    const html = renderHTML();
    expect(html).toMatch(/<main[^>]*aria-label/);
  });

  it("complementary (aside) has aria-label", () => {
    const html = renderHTML();
    expect(html).toMatch(/<aside[^>]*aria-label/);
  });

  it("contentinfo has aria-label", () => {
    const html = renderHTML();
    expect(html).toMatch(/role="contentinfo"[^>]*aria-label/);
  });

  it("search has aria-label", () => {
    const html = renderHTML();
    expect(html).toMatch(/<search[^>]*aria-label/);
  });

  it("multiple nav elements have distinct aria-labels", () => {
    const html = renderHTML();
    // There should be two nav elements with different aria-label values
    const navMatches = html.match(/<nav[^>]*aria-label="([^"]+)"/g);
    expect(navMatches).not.toBeNull();
    expect(navMatches!.length).toBeGreaterThanOrEqual(2);

    // Extract label values and verify they are distinct
    const labels = navMatches!.map((m) => {
      const match = m.match(/aria-label="([^"]+)"/);
      return match?.[1];
    });
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it("form has aria-labelledby pointing to a heading", () => {
    const html = renderHTML();
    const formMatch = html.match(/<form[^>]*aria-labelledby="([^"]+)"/);
    expect(formMatch).not.toBeNull();
    const headingId = formMatch![1];
    // The referenced heading should exist
    expect(html).toContain(`id="${headingId}"`);
  });

  it("region (section) has aria-labelledby pointing to a heading", () => {
    const html = renderHTML();
    const sectionMatch = html.match(/<section[^>]*aria-labelledby="([^"]+)"/);
    expect(sectionMatch).not.toBeNull();
    const headingId = sectionMatch![1];
    // The referenced heading should exist
    expect(html).toContain(`id="${headingId}"`);
  });
});

describe("APG Landmarks: Reference Cards", () => {
  it("documents all 8 landmark roles in reference cards", () => {
    const html = renderHTML();
    const roles = [
      "banner",
      "navigation",
      "main",
      "complementary",
      "search",
      "form",
      "region",
      "contentinfo",
    ];
    for (const role of roles) {
      // Reference cards contain role text; React SSR may insert <!-- --> comment nodes
      // between JSX expression boundaries, so match with optional comments
      const pattern = new RegExp(`role=&quot;[^"]*${role}[^"]*&quot;`);
      expect(html).toMatch(pattern);
    }
  });

  it("has a reference card element for each landmark", () => {
    const html = renderHTML();
    const cardIds = [
      "lm-banner",
      "lm-navigation",
      "lm-main",
      "lm-complementary",
      "lm-search",
      "lm-form",
      "lm-region",
      "lm-contentinfo",
    ];
    for (const id of cardIds) {
      expect(html).toContain(`id="${id}"`);
    }
  });
});
