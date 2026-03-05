/**
 * T1: formatDiagnostics(kernel): string — pure formatter
 *
 * Schema path filtering + Δ none detection + zone snapshot.
 * Pure function, no side effects — returns a formatted string.
 *
 * 🔴 RED: formatDiagnostics does not exist yet.
 *
 * @spec docs/1-project/test-observability/notes/2026-0303-2110-plan-auto-diagnostics.md
 */

// formatDiagnostics does not exist yet — this import will be undefined → Red
import {
  createOsPage,
  formatDiagnostics,
  type OsPage,
} from "@os-devtool/testing/page";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("T1: formatDiagnostics — pure formatter", () => {
  let page: OsPage;

  beforeEach(() => {
    page = createOsPage();
    page.goto("list", {
      role: "listbox",
      items: ["a", "b", "c"],
    });
  });

  afterEach(() => {
    page.cleanup();
  });

  it("returns a string (not void)", () => {
    page.keyboard.press("ArrowDown");
    const result = formatDiagnostics(page.kernel);
    expect(typeof result).toBe("string");
  });

  it("includes header/footer delimiters", () => {
    page.keyboard.press("ArrowDown");
    const result = formatDiagnostics(page.kernel);
    expect(result).toContain("═══ OS Diagnostic ═══");
    expect(result).toContain("═══════════════════════");
  });

  it("includes command type in transaction listing", () => {
    page.keyboard.press("ArrowDown");
    const result = formatDiagnostics(page.kernel);
    expect(result).toContain("OS_NAVIGATE");
  });

  it("shows state changes (Δ path: from → to)", () => {
    page.keyboard.press("ArrowDown");
    const result = formatDiagnostics(page.kernel);
    // Should show Δ with path and values
    expect(result).toMatch(/Δ\s+\S+.*→/);
  });

  it("detects Δ none and marks with ⚠️", () => {
    // Press a key that results in no state change (e.g., ArrowUp when already at top)
    // First item "a" is already focused, ArrowUp should be no-op
    page.keyboard.press("ArrowUp");
    const result = formatDiagnostics(page.kernel);
    expect(result).toContain("⚠️ Δ none");
  });

  it("includes zone snapshot", () => {
    page.keyboard.press("ArrowDown");
    const result = formatDiagnostics(page.kernel);
    // Zone snapshot should include zone id, items count, focused, selection
    expect(result).toMatch(/Zone "list"/);
    expect(result).toMatch(/items=3/);
    expect(result).toMatch(/focused=/);
    expect(result).toMatch(/selection=/);
  });

  it("shows Last: header with most recent command", () => {
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    const result = formatDiagnostics(page.kernel);
    // "Last:" line should show the most recent command
    expect(result).toMatch(/Last:\s+OS_NAVIGATE/);
  });

  it("returns empty diagnostic when no transactions", () => {
    // Clear transactions, then format
    page.kernel.inspector.clearTransactions();
    const result = formatDiagnostics(page.kernel);
    expect(typeof result).toBe("string");
    // Should still have delimiters but indicate no transactions
    expect(result).toContain("═══ OS Diagnostic ═══");
  });
});
