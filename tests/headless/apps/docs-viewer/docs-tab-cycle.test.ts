/**
 * DocsViewer: Tab Cycle Reproduction
 *
 * Bug: Tab from docs-reader zone produces no state change (OS_TAB → Diff: None).
 * Root cause hypothesis: docs-reader has no getItems() → excluded from DOM_ZONE_ORDER.
 */

import { readActiveZoneId } from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { DocsApp } from "@/docs-viewer/app";
import {
  buildDocTree,
  docsModules,
  flattenVisibleTree,
} from "@/docs-viewer/docsUtils";

/** Sidebar items with no folders expanded (initial view) */
function getSidebarItems(): string[] {
  const docTree = buildDocTree(Object.keys(docsModules));
  const nodes = flattenVisibleTree(docTree, [], 0, { sectionLevel: 0 });
  return nodes
    .filter((n) => !(n.type === "folder" && n.level === 0))
    .map((n) => n.id);
}

function setup() {
  const { page } = createPage(DocsApp);
  page.goto("/");
  return page;
}

describe("DocsViewer: Tab Cycle Bug Reproduction", () => {
  it("Tab from docs-sidebar should cycle through zones (not get stuck)", () => {
    const page = setup();
    const items = getSidebarItems();

    // Bootstrap: click first sidebar item
    const first = items[0]!;
    page.click(first);
    expect(readActiveZoneId(os)).toBe("docs-sidebar");

    // Tab forward — should escape to next zone
    page.keyboard.press("Tab");
    const afterFirstTab = readActiveZoneId(os);
    expect(afterFirstTab).not.toBe("docs-sidebar");

    // Keep pressing Tab until we either:
    // a) return to docs-sidebar (full cycle), or
    // b) get stuck (same zone after Tab)
    const visited: string[] = [afterFirstTab!];
    for (let i = 0; i < 10; i++) {
      const before = readActiveZoneId(os);
      page.keyboard.press("Tab");
      const after = readActiveZoneId(os);

      if (after === "docs-sidebar") {
        // Full cycle complete
        visited.push(after);
        break;
      }
      if (after === before) {
        // Stuck — bug reproduced
        throw new Error(
          `Tab stuck at zone "${after}" after visiting: [${visited.join(" → ")}]`,
        );
      }
      visited.push(after!);
    }

    // Verify docs-reader was part of the cycle
    expect(visited).toContain("docs-reader");
  });

  it("docs-reader zone should be reachable via Tab", () => {
    const page = setup();
    const items = getSidebarItems();

    // Bootstrap
    page.click(items[0]!);

    // Collect all zones reachable by Tab
    const reachable = new Set<string>();
    reachable.add(readActiveZoneId(os)!);

    for (let i = 0; i < 10; i++) {
      page.keyboard.press("Tab");
      const zoneId = readActiveZoneId(os);
      if (zoneId && reachable.has(zoneId)) break; // full cycle
      if (zoneId) reachable.add(zoneId);
    }

    expect(reachable).toContain("docs-reader");
  });
});
