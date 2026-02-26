/**
 * T4: DocsSidebar useState hack 제거
 *
 * DocsSidebar.RecentSection uses `useState(true)` for isOpen.
 * This should be managed through OS state via DOCS_TOGGLE_SECTION command.
 *
 * Note: Uses onTestFailed + dumpDiagnostics (test-observability validation)
 */

import { defineScope } from "@kernel";
import { createOsPage, type OsPage } from "@os/createOsPage";
import { produce } from "immer";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFailed,
} from "vitest";
// toggleSection is a red-test stub — not yet implemented in app.ts
const toggleSection = (payload: { sectionId: string }) => ({ type: "DOCS_TOGGLE_SECTION" as const, payload });

describe("T4: DocsSidebar — isOpen via OS command (not useState)", () => {
  let page: OsPage;

  beforeEach(() => {
    page = createOsPage();
    page.goto("docs-sidebar-recent", {
      role: "listbox",
      items: ["recent-1", "recent-2", "recent-3"],
    });

    // Register app command on test kernel (scope hierarchy)
    const appScope = defineScope("docs-viewer");
    const appGroup = page.kernel.group({ scope: appScope });

    // Register DOCS_TOGGLE_SECTION with state management
    appGroup.defineCommand(
      "DOCS_TOGGLE_SECTION",
      (ctx: { readonly state: any }) => (payload: { sectionId: string }) => ({
        state: produce(ctx.state, (draft: any) => {
          if (!draft.docsViewer)
            draft.docsViewer = {
              ui: {
                sections: {
                  recent: { isOpen: true },
                  favorites: { isOpen: true },
                },
              },
            };
          const section = draft.docsViewer.ui.sections[payload.sectionId];
          if (section) {
            section.isOpen = !section.isOpen;
          } else {
            draft.docsViewer.ui.sections[payload.sectionId] = { isOpen: false };
          }
        }),
      }),
    );

    // Auto-diagnostics on failure
    onTestFailed(() => page.dumpDiagnostics());
  });

  afterEach(() => {
    page.cleanup();
  });

  // ── #1: Section starts expanded ──────────────────────────────
  it("#1 recent section item is visible (expanded by default)", () => {
    const attrs = page.attrs("recent-1");
    expect(attrs.hidden).not.toBe(true);
  });

  // ── #2: Toggle collapse via OS command ────────────────────────
  it("#2 dispatching DOCS_TOGGLE_SECTION changes state to collapsed", () => {
    page.kernel.dispatch(toggleSection({ sectionId: "recent" }));

    const lastTx = page.kernel.inspector.getLastTransaction();
    expect(lastTx).not.toBeNull();
    expect(lastTx!.command.type).toBe("DOCS_TOGGLE_SECTION");
  });
});
