/**
 * sidebarCommands — Unit tests for section management commands.
 *
 * Tests deleteSection, duplicateSection, moveSectionUp, moveSectionDown
 * using BuilderApp.create() test instance (headless, no DOM).
 */

import { describe, expect, it, beforeEach } from "vitest";
import {
    BuilderApp,
    deleteSection,
    duplicateSection,
    moveSectionUp,
    moveSectionDown,
} from "../../app";

describe("sidebar section commands", () => {
    let app: ReturnType<typeof BuilderApp.create>;

    beforeEach(() => {
        app = BuilderApp.create();
    });

    function sectionIds(): string[] {
        return app.state.data.sections.map((s) => s.id);
    }



    // ─── deleteSection ────────────────────────────────────────────

    describe("deleteSection", () => {
        it("removes the section from the list", () => {
            expect(sectionIds()).toContain("ncp-news");

            app.dispatch(deleteSection({ id: "ncp-news" }));

            expect(sectionIds()).not.toContain("ncp-news");
            expect(app.state.data.sections).toHaveLength(3);
        });

        it("does not modify state for unknown section", () => {
            const before = app.state.data.sections;
            app.dispatch(deleteSection({ id: "nonexistent" }));
            expect(app.state.data.sections).toEqual(before);
        });

        it("preserves order of remaining sections", () => {
            app.dispatch(deleteSection({ id: "ncp-news" }));
            expect(sectionIds()).toEqual(["ncp-hero", "ncp-services", "ncp-footer"]);
        });
    });

    // ─── duplicateSection ─────────────────────────────────────────

    describe("duplicateSection", () => {
        it("inserts a copy after the original", () => {
            app.dispatch(duplicateSection({ id: "ncp-hero" }));

            expect(app.state.data.sections).toHaveLength(5);
            // Original stays at index 0, copy is at index 1
            expect(app.state.data.sections[0]!.id).toBe("ncp-hero");
            expect(app.state.data.sections[1]!.label).toBe("Hero (copy)");
            expect(app.state.data.sections[1]!.type).toBe("hero");
        });

        it("preserves the rest of the list", () => {
            app.dispatch(duplicateSection({ id: "ncp-news" }));

            // ncp-hero, ncp-news, ncp-news-copy-..., ncp-services, ncp-footer
            expect(app.state.data.sections).toHaveLength(5);
            expect(app.state.data.sections[0]!.id).toBe("ncp-hero");
            expect(app.state.data.sections[1]!.id).toBe("ncp-news");
            expect(app.state.data.sections[3]!.id).toBe("ncp-services");
            expect(app.state.data.sections[4]!.id).toBe("ncp-footer");
        });

        it("does nothing for unknown section", () => {
            app.dispatch(duplicateSection({ id: "nonexistent" }));
            expect(app.state.data.sections).toHaveLength(4);
        });
    });

    // ─── moveSectionUp ────────────────────────────────────────────

    describe("moveSectionUp", () => {
        it("swaps section with previous sibling", () => {
            app.dispatch(moveSectionUp({ id: "ncp-news" }));
            expect(sectionIds()).toEqual([
                "ncp-news",
                "ncp-hero",
                "ncp-services",
                "ncp-footer",
            ]);
        });

        it("does nothing when already first", () => {
            app.dispatch(moveSectionUp({ id: "ncp-hero" }));
            expect(sectionIds()).toEqual([
                "ncp-hero",
                "ncp-news",
                "ncp-services",
                "ncp-footer",
            ]);
        });
    });

    // ─── moveSectionDown ──────────────────────────────────────────

    describe("moveSectionDown", () => {
        it("swaps section with next sibling", () => {
            app.dispatch(moveSectionDown({ id: "ncp-news" }));
            expect(sectionIds()).toEqual([
                "ncp-hero",
                "ncp-services",
                "ncp-news",
                "ncp-footer",
            ]);
        });

        it("does nothing when already last", () => {
            app.dispatch(moveSectionDown({ id: "ncp-footer" }));
            expect(sectionIds()).toEqual([
                "ncp-hero",
                "ncp-news",
                "ncp-services",
                "ncp-footer",
            ]);
        });
    });
});
