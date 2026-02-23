/**
 * DocsViewer App — Unit Tests
 *
 * Tests the SELECT_DOC command:
 * - Sets activePath for non-expandable items (files)
 * - Skips expandable items (folders) — no state change
 * - Integrates with bind() onAction/onSelect
 *
 * Tests parseHashToPath (T9):
 * - Extracts docs path from URL hash
 * - Returns null for ext: hashes or empty hash
 * Feature: initial-path.feature
 */

import { describe, expect, it } from "vitest";
import { DocsApp, parseHashToPath, selectDoc } from "../../app";

describe("SELECT_DOC command", () => {
    it("sets activePath when item is not expandable (file)", () => {
        const app = DocsApp.create();
        expect(app.state.activePath).toBeNull();

        app.dispatch(selectDoc({ id: "getting-started.md", isExpandable: false }));
        expect(app.state.activePath).toBe("getting-started.md");
    });

    it("does NOT change activePath when item is expandable (folder)", () => {
        const app = DocsApp.create();
        app.dispatch(selectDoc({ id: "getting-started.md", isExpandable: false }));
        expect(app.state.activePath).toBe("getting-started.md");

        app.dispatch(selectDoc({ id: "folder:api", isExpandable: true }));
        expect(app.state.activePath).toBe("getting-started.md"); // unchanged
    });

    it("updates activePath on subsequent file selections", () => {
        const app = DocsApp.create();

        app.dispatch(selectDoc({ id: "intro.md", isExpandable: false }));
        expect(app.state.activePath).toBe("intro.md");

        app.dispatch(selectDoc({ id: "setup.md", isExpandable: false }));
        expect(app.state.activePath).toBe("setup.md");
    });
});

describe("parseHashToPath (T9: URL-based initial selection)", () => {
    it("extracts path from '#/docs/inbox/readme.md'", () => {
        expect(parseHashToPath("#/docs/inbox/readme.md")).toBe("docs/inbox/readme.md");
    });

    it("extracts path from '#docs/inbox/readme.md' (no leading slash)", () => {
        expect(parseHashToPath("#docs/inbox/readme.md")).toBe("docs/inbox/readme.md");
    });

    it("returns null for empty hash", () => {
        expect(parseHashToPath("")).toBeNull();
        expect(parseHashToPath("#")).toBeNull();
    });

    it("returns null for ext: hash (external folder mode)", () => {
        expect(parseHashToPath("#ext:my-folder/some/file.md")).toBeNull();
    });

    it("returns null for undefined/null", () => {
        expect(parseHashToPath(undefined as any)).toBeNull();
    });
});

