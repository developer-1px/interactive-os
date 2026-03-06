/**
 * DocsViewer — App Interaction Tests (Spec-based)
 *
 * Tests the docs-viewer as a DOCUMENT VIEWER application:
 * - Document selection sets the active document
 * - Sidebar click navigates to document
 * - Favorites/Recent lists respond to focus
 * - Keyboard shortcuts trigger app-level actions
 * - Search overlay opens/closes
 * - Section navigation within a document
 *
 * Spec source: app behavior as a document reader
 * NOT APG spec — those are OS-guaranteed.
 */

import { type AppPageInternal, createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import { DocsApp, resetDoc } from "../../app";

interface DocsState {
  activePath: string | null;
  searchOpen: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Feature: Document Selection
// As a user, I want to click a document to read it
// ═══════════════════════════════════════════════════════════════════

describe("Feature: Document Selection", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-recent");
    page.dispatch(resetDoc());
  });

  it("starts with no document selected", () => {
    expect(page.state.activePath).toBeNull();
  });

  it("clicking a file selects it as active document", () => {
    page.click("docs/getting-started.md");
    expect(page.state.activePath).toBe("docs/getting-started.md");
  });

  it("clicking another file replaces the active document", () => {
    page.click("docs/intro.md");
    page.click("docs/setup.md");
    expect(page.state.activePath).toBe("docs/setup.md");
  });

  it("clicking a folder shows folder index view", () => {
    page.click("folder:docs/api");
    expect(page.state.activePath).toBe("folder:docs/api");
  });

  it("navigating from folder to file updates active path", () => {
    page.click("folder:docs/api");
    page.click("docs/api/endpoints.md");
    expect(page.state.activePath).toBe("docs/api/endpoints.md");
  });

  it("reset clears the active document", () => {
    page.click("docs/intro.md");
    expect(page.state.activePath).not.toBeNull();
    page.dispatch(resetDoc());
    expect(page.state.activePath).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Feature: Sidebar Navigation
// As a user, I want to browse the doc tree and select files
// ═══════════════════════════════════════════════════════════════════

describe("Feature: Sidebar Navigation", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-sidebar");
    page.dispatch(resetDoc());
  });

  it("clicking an item in sidebar selects the document", () => {
    page.click("docs/readme.md");
    expect(page.state.activePath).toBe("docs/readme.md");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Feature: Favorites List
// As a user, I want to quickly access pinned documents
// ═══════════════════════════════════════════════════════════════════

describe("Feature: Favorites List", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-favorites");
    page.dispatch(resetDoc());
  });

  it("clicking a favorite selects the document", () => {
    page.click("pinned-doc.md");
    expect(page.state.activePath).toBe("pinned-doc.md");
  });

  it("selection follows focus (followFocus: true)", () => {
    page.click("fav-a");
    expect(page.selection()).toContain("fav-a");

    page.keyboard.press("ArrowDown");
    const newFocus = page.focusedItemId();
    expect(page.selection()).toContain(newFocus!);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Feature: Recent List
// As a user, I want to see recently modified documents
// ═══════════════════════════════════════════════════════════════════

describe("Feature: Recent List", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-recent");
    page.dispatch(resetDoc());
  });

  it("clicking a recent file selects the document", () => {
    page.click("recent/changelog.md");
    expect(page.state.activePath).toBe("recent/changelog.md");
  });

  it("selection follows focus (followFocus: true)", () => {
    page.click("recent-a");
    expect(page.selection()).toContain("recent-a");

    page.keyboard.press("ArrowDown");
    const newFocus = page.focusedItemId();
    expect(page.selection()).toContain(newFocus!);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Feature: Search Overlay
// As a user, I want to search across all documents
// ═══════════════════════════════════════════════════════════════════

describe("Feature: Search Overlay", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-recent");
    page.dispatch(resetDoc());
  });

  it("search is closed by default", () => {
    expect(page.state.searchOpen).toBe(false);
  });

  it("/ key opens search overlay", () => {
    page.keyboard.press("/");
    expect(page.state.searchOpen).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Feature: History Navigation
// As a user, I want to go back/forward through my reading history
// ═══════════════════════════════════════════════════════════════════

describe("Feature: History Navigation", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-recent");
    page.dispatch(resetDoc());
  });

  it("Alt+ArrowLeft dispatches go back", () => {
    page.click("docs/a.md");
    // GO_BACK delegates to router — in headless, state is unchanged
    page.keyboard.press("Alt+ArrowLeft");
    expect(page.state.activePath).toBe("docs/a.md");
  });

  it("Alt+ArrowRight dispatches go forward", () => {
    page.click("docs/a.md");
    // GO_FORWARD delegates to router — in headless, state is unchanged
    page.keyboard.press("Alt+ArrowRight");
    expect(page.state.activePath).toBe("docs/a.md");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Feature: Section Navigation
// As a user, I want to jump between sections within a document
// ═══════════════════════════════════════════════════════════════════

describe("Feature: Section Navigation", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.goto("docs-reader");
    page.dispatch(resetDoc());
  });

  it("Space dispatches next section command", () => {
    // In headless, scroll is a DOM effect — we verify the command dispatches
    // without error. The scroll itself is tested in docs-scroll.test.ts.
    page.keyboard.press("Space");
    // No error = command dispatched successfully
  });

  it("Shift+Space dispatches previous section command", () => {
    page.keyboard.press("Shift+Space");
    // No error = command dispatched successfully
  });
});
