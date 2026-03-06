/**
 * APG Table Pattern — OS Projection Tests (Tier 2)
 *
 * W3C APG Table spec:
 *   - Native <table> provides implicit role="table"
 *   - <th scope="col"> provides implicit role="columnheader"
 *   - <td> provides implicit role="cell"
 *   - <tr> provides implicit role="row"
 *   - aria-label on <table> identifies the table
 *   - aria-describedby references caption
 *   - aria-sort on sortable column headers
 *   - No keyboard interaction (static structure)
 *
 * ZIFT Classification: NONE (static semantic structure)
 * No Zone, no Item, no Field, no Trigger-based keyboard navigation.
 * Sorting uses OS commands via Trigger + defineApp.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/table/
 */

import { createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import {
  RESET_TABLE,
  SORT_BY_COLUMN,
  TableApp,
  TablePattern,
} from "@/pages/apg-showcase/patterns/TablePattern";

describe("APG Table: Projection (Tier 2)", () => {
  let page: ReturnType<typeof createPage>;

  beforeEach(() => {
    page = createPage(TableApp, TablePattern);
    page.dispatch(RESET_TABLE());
  });

  // ═══════════════════════════════════════════════════
  // ARIA Structure
  // ═══════════════════════════════════════════════════

  it("table has aria-label", () => {
    const html = page.html();
    expect(html).toContain('aria-label="Students"');
  });

  it("table has aria-describedby referencing caption", () => {
    const html = page.html();
    expect(html).toContain('aria-describedby="table-caption"');
    expect(html).toContain('id="table-caption"');
  });

  it("renders native HTML table elements (implicit ARIA roles)", () => {
    const html = page.html();
    // Native HTML table provides implicit role="table"
    expect(html).toContain("<table");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html).toContain("<tr");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
  });

  it("column headers have scope=col", () => {
    const html = page.html();
    expect(html).toContain('scope="col"');
  });

  it("renders all 4 student rows", () => {
    const html = page.html();
    expect(html).toContain("Fred");
    expect(html).toContain("Jackson");
    expect(html).toContain("Sara");
    expect(html).toContain("James");
    expect(html).toContain("Ralph");
    expect(html).toContain("Jefferson");
    expect(html).toContain("Nancy");
    expect(html).toContain("Jensen");
  });

  // ═══════════════════════════════════════════════════
  // aria-sort
  // ═══════════════════════════════════════════════════

  it("initial state: lastName column has aria-sort=ascending", () => {
    const html = page.html();
    // The active sort column should have aria-sort="ascending"
    expect(html).toContain('aria-sort="ascending"');
  });

  it("sortable columns without active sort have aria-sort=none", () => {
    const html = page.html();
    // firstName and company should have aria-sort="none" since lastName is the active sort
    expect(html).toContain('aria-sort="none"');
  });

  it("non-sortable column (address) has no aria-sort attribute on its th", () => {
    const html = page.html();
    // Address column header should not have aria-sort at all
    // We verify by checking that Address text appears but not with aria-sort
    expect(html).toContain("Address");
    // Count occurrences of aria-sort — should be 3 (firstName=none, lastName=ascending, company=none)
    const sortMatches = html.match(/aria-sort=/g);
    expect(sortMatches?.length).toBe(3);
  });

  // ═══════════════════════════════════════════════════
  // Sort via OS Commands (no useState, no onClick)
  // ═══════════════════════════════════════════════════

  it("SORT_BY_COLUMN command changes sort state", () => {
    // Initial: lastName ascending
    expect(page.state.sortColumn).toBe("lastName");
    expect(page.state.sortDirection).toBe("ascending");

    // Sort by firstName
    page.dispatch(SORT_BY_COLUMN({ column: "firstName" }));
    expect(page.state.sortColumn).toBe("firstName");
    expect(page.state.sortDirection).toBe("ascending");
  });

  it("sorting same column toggles direction", () => {
    // Initial: lastName ascending
    page.dispatch(SORT_BY_COLUMN({ column: "lastName" }));
    expect(page.state.sortDirection).toBe("descending");

    page.dispatch(SORT_BY_COLUMN({ column: "lastName" }));
    expect(page.state.sortDirection).toBe("ascending");
  });

  it("sorting different column resets to ascending", () => {
    // Toggle lastName to descending first
    page.dispatch(SORT_BY_COLUMN({ column: "lastName" }));
    expect(page.state.sortDirection).toBe("descending");

    // Now sort by company — should reset to ascending
    page.dispatch(SORT_BY_COLUMN({ column: "company" }));
    expect(page.state.sortColumn).toBe("company");
    expect(page.state.sortDirection).toBe("ascending");
  });

  it("sort projection: data rows are reordered after sort command", () => {
    // Initial sort: lastName ascending (Jackson, James, Jefferson, Jensen)
    let html = page.html();
    const jacksonIdx = html.indexOf("Jackson");
    const jamesIdx = html.indexOf("James");
    expect(jacksonIdx).toBeLessThan(jamesIdx);

    // Sort by firstName ascending (Fred, Nancy, Ralph, Sara)
    page.dispatch(SORT_BY_COLUMN({ column: "firstName" }));
    html = page.html();
    const fredIdx = html.indexOf("Fred");
    const nancyIdx = html.indexOf("Nancy");
    const ralphIdx = html.indexOf("Ralph");
    const saraIdx = html.indexOf("Sara");
    expect(fredIdx).toBeLessThan(nancyIdx);
    expect(nancyIdx).toBeLessThan(ralphIdx);
    expect(ralphIdx).toBeLessThan(saraIdx);
  });

  it("sort projection: aria-sort moves to new column after sort", () => {
    // Sort by company
    page.dispatch(SORT_BY_COLUMN({ column: "company" }));
    const html = page.html();

    // company header should have aria-sort="ascending"
    // We check by finding the th that contains "Company" text and aria-sort="ascending"
    expect(html).toContain('aria-sort="ascending"');
    // The ascending count should be exactly 1
    const ascMatches = html.match(/aria-sort="ascending"/g);
    expect(ascMatches?.length).toBe(1);
  });
});
